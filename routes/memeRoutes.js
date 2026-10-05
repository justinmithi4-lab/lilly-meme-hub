const express = require("express");
const multer = require("multer");
const path = require("path");

const requireLogin = require("../middleware/requireLogin");
const requireMember = require("../middleware/requireMember");
const requireActiveSubscription = require("../middleware/requireActiveSubscription");
const requireAdmin = require("../middleware/requireAdmin");

const {
    getMeme,
    getHomepageMemes,
    getAllMemberMemes,
    createMeme,
    getAdminMemes,
    updateMeme,
    deleteMeme,
    toggleLike,
    recordMemeView,
    downloadMeme,
    toggleSaveMeme,
    createComment,
    getComments,
    toggleCommentLike,
    reportMeme,
    getCategories
} = require("../controllers/memeController");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Multer
|--------------------------------------------------------------------------
| Store uploaded images temporarily in memory.
| The controller will upload them directly to Cloudinary.
|--------------------------------------------------------------------------
*/

const storage = multer.memoryStorage();

const upload = multer({
    storage,

    limits: {
        fileSize: 10 * 1024 * 1024
    },

    fileFilter: function (req, file, cb) {

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
        ];

        if (!allowedTypes.includes(file.mimetype)) {

            return cb(
                new Error(
                    "Only JPG, PNG, WEBP and GIF images are allowed."
                )
            );
        }

        const extension = path.extname(file.originalname).toLowerCase();
        const allowedExtensions = new Set([
            ".jpg",
            ".jpeg",
            ".png",
            ".webp",
            ".gif"
        ]);

        if (!allowedExtensions.has(extension)) {
            return cb(new Error("The meme image must use a JPG, PNG, WEBP or GIF file extension."));
        }

        cb(null, true);
    }
});


/*
|--------------------------------------------------------------------------
| PUBLIC HOMEPAGE
|--------------------------------------------------------------------------
*/

router.get(
    "/homepage",
    getHomepageMemes
);

router.get(
    "/all",
    requireLogin,
    requireMember,
    requireActiveSubscription,
    getAllMemberMemes
);


/*
|--------------------------------------------------------------------------
| CATEGORIES
|--------------------------------------------------------------------------
*/

router.get(
    "/categories",
    getCategories
);

/*
|--------------------------------------------------------------------------
| ADMIN MEMES
|--------------------------------------------------------------------------
*/

router.get(
    "/admin",
    requireAdmin,
    getAdminMemes
);


/*
|--------------------------------------------------------------------------
| MEMBER MEMES
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    requireLogin,
    requireMember,
    requireActiveSubscription,
    getHomepageMemes
);


/*
|--------------------------------------------------------------------------
| SINGLE MEME
|--------------------------------------------------------------------------
*/

router.get(
    "/:id",
    requireLogin,
    requireMember,
    requireActiveSubscription,
    getMeme
);


/*
|--------------------------------------------------------------------------
| CREATE MEME
|--------------------------------------------------------------------------
| Admin only
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    requireAdmin,
    upload.single("image"),
    createMeme
);


/*
|--------------------------------------------------------------------------
| UPDATE MEME
|--------------------------------------------------------------------------
| Admin only
|--------------------------------------------------------------------------
*/

router.put(
    "/:id",
    requireAdmin,
    upload.single("image"),
    updateMeme
);


/*
|--------------------------------------------------------------------------
| DELETE MEME
|--------------------------------------------------------------------------
| Admin only
|--------------------------------------------------------------------------
*/

router.delete(
    "/:id",
    requireAdmin,
    deleteMeme
);


/*
|--------------------------------------------------------------------------
| LIKES
|--------------------------------------------------------------------------
*/

router.post(
    "/:id/like",
    requireLogin,
    requireMember,
    requireActiveSubscription,
    toggleLike
);


/*
|--------------------------------------------------------------------------
| VIEWS
|--------------------------------------------------------------------------
*/

router.post(
    "/:id/view",
    requireLogin,
    requireMember,
    requireActiveSubscription,
    recordMemeView
);


/*
|--------------------------------------------------------------------------
| DOWNLOAD
|--------------------------------------------------------------------------
*/

router.get(
    "/:id/download",
    requireLogin,
    requireMember,
    requireActiveSubscription,
    downloadMeme
);


/*
|--------------------------------------------------------------------------
| SAVED MEMES
|--------------------------------------------------------------------------
*/

router.post(
    "/:id/save",
    requireLogin,
    requireMember,
    requireActiveSubscription,
    toggleSaveMeme
);


/*
|--------------------------------------------------------------------------
| COMMENTS
|--------------------------------------------------------------------------
*/

router.get(
    "/:id/comments",
    requireLogin,
    requireMember,
    requireActiveSubscription,
    getComments
);

router.post(
    "/:id/comments",
    requireLogin,
    requireMember,
    requireActiveSubscription,
    createComment
);


/*
|--------------------------------------------------------------------------
| COMMENT LIKE
|--------------------------------------------------------------------------
*/

router.post(
    "/comments/:commentId/like",
    requireLogin,
    requireMember,
    requireActiveSubscription,
    toggleCommentLike
);


/*
|--------------------------------------------------------------------------
| REPLIES
|--------------------------------------------------------------------------
*/

router.post(
    "/comments/:commentId/reply",
    requireLogin,
    requireMember,
    requireActiveSubscription,
    createComment
);


/*
|--------------------------------------------------------------------------
| REPORT
|--------------------------------------------------------------------------
*/

router.post(
    "/:id/report",
    requireLogin,
    requireMember,
    requireActiveSubscription,
    reportMeme
);


module.exports = router;