const express = require("express");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const requireAdmin =
    require("../middleware/requireAdmin");

const requireLogin =
    require("../middleware/requireLogin");

const {
    getCategories,
    createMeme,
    getAdminMemes,
    getMeme,
    updateMeme,
    deleteMeme,
    getHomepageMemes,
    toggleLike,
    recordMemeView,
    toggleSaveMeme,
    downloadMeme,
    getComments,
    createComment,
    reportMeme,
    toggleCommentLike
} = require("../controllers/memeController");

const router = express.Router();

// ==================================================
// MULTER CONFIGURATION
// ==================================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(
            null,
            path.join(
                __dirname,
                "..",
                "uploads",
                "memes"
            )
        );

    },

    filename: function (req, file, cb) {

        const extension =
            path.extname(
                file.originalname
            ).toLowerCase();

        const randomName =
            Date.now() +
            "-" +
            crypto
                .randomBytes(8)
                .toString("hex") +
            extension;

        cb(
            null,
            randomName
        );

    }

});

// ==================================================
// UPLOAD FILTER
// ==================================================

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

        if (
            !allowedTypes.includes(
                file.mimetype
            )
        ) {

            return cb(
                new Error(
                    "Only JPG, PNG, WEBP and GIF images are allowed."
                )
            );

        }

        cb(null, true);

    }

});

// ==================================================
// PUBLIC HOMEPAGE FEED
// ==================================================

router.get(
    "/homepage",
    getHomepageMemes
);

// ==================================================
// ADMIN CATEGORIES
// ==================================================

router.get(
    "/categories",
    requireAdmin,
    getCategories
);

// ==================================================
// ADMIN MEME LIST
// ==================================================

router.get(
    "/admin",
    requireAdmin,
    getAdminMemes
);

// ==================================================
// VIEW A SINGLE MEME
// IMPORTANT:
// This must NOT use requireAdmin.
// Members/guests need to be able to open memes.
// ==================================================

router.get(
    "/:id",
    getMeme
);

// ==================================================
// RECORD MEME VIEW
// ==================================================

router.post(
    "/:id/view",
    requireLogin,
    recordMemeView
);

// ==================================================
// LIKE / UNLIKE
// ==================================================

router.post(
    "/:id/like",
    toggleLike
);

// ==================================================
// SAVE / UNSAVE
// ==================================================

router.post(
    "/:id/save",
    toggleSaveMeme
);

// ==================================================
// DOWNLOAD MEME
// ==================================================

router.get(
    "/:id/download",
    downloadMeme
);

// ==================================================
// GET COMMENTS
// ==================================================

router.get(
    "/:id/comments",
    getComments
);

// ==================================================
// CREATE COMMENT / REPLY
// ==================================================

router.post(
    "/:id/comments",
    createComment
);

router.post(
    "/comments/:commentId/like",
    requireLogin,
    toggleCommentLike
);

// ==================================================
// REPORT MEME
// ==================================================

router.post(
    "/:id/report",
    reportMeme
);

// ==================================================
// ADMIN CREATE MEME
// ==================================================

router.post(
    "/",
    requireAdmin,

    function (req, res, next) {

        upload.single("image")(
            req,
            res,

            function (error) {

                if (error) {

                    console.error(
                        "Upload error:",
                        error
                    );

                    // ----------------------------------
                    // Multer errors
                    // ----------------------------------

                    if (
                        error instanceof
                        multer.MulterError
                    ) {

                        if (
                            error.code ===
                            "LIMIT_FILE_SIZE"
                        ) {

                            return res
                                .status(400)
                                .json({

                                    success: false,

                                    message:
                                        "Image is too large. Maximum size is 10 MB."

                                });

                        }

                        return res
                            .status(400)
                            .json({

                                success: false,

                                message:
                                    "Image upload failed: " +
                                    error.message

                            });

                    }

                    // ----------------------------------
                    // Custom file filter error
                    // ----------------------------------

                    return res
                        .status(400)
                        .json({

                            success: false,

                            message:
                                error.message ||
                                "Image upload failed."

                        });

                }

                next();

            }
        );

    },

    createMeme
);

// ==================================================
// ADMIN UPDATE MEME
// ==================================================

router.put(
    "/:id",
    requireAdmin,
    updateMeme
);

// ==================================================
// ADMIN DELETE MEME
// ==================================================

router.delete(
    "/:id",
    requireAdmin,
    deleteMeme
);

// ==================================================
// EXPORT
// ==================================================

module.exports = router;