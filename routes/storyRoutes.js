const express = require("express");
const multer = require("multer");
const path = require("path");

const requireAdmin = require("../middleware/requireAdmin");
const requireActiveSubscription =
    require("../middleware/requireActiveSubscription");

const {
    getActiveStories,
    toggleStoryLike,
    getAdminStories,
    createStory,
    deleteStory
} = require("../controllers/storyController");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024
    },
    fileFilter(req, file, callback) {
        const allowedTypes = new Set([
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "video/mp4",
            "video/webm",
            "video/quicktime"
        ]);

        if (!allowedTypes.has(file.mimetype)) {
            callback(
                new Error("Choose a JPG, PNG, WEBP, GIF, MP4, WEBM or MOV file.")
            );
            return;
        }

        const extension = path.extname(file.originalname).toLowerCase();
        const allowedExtensions = new Set([
            ".jpg",
            ".jpeg",
            ".png",
            ".webp",
            ".gif",
            ".mp4",
            ".webm",
            ".mov"
        ]);

        if (!allowedExtensions.has(extension)) {
            callback(new Error("Choose a JPG, PNG, WEBP, GIF, MP4, WEBM or MOV file."));
            return;
        }

        callback(null, true);
    }
});

router.get(
    "/",
    requireActiveSubscription,
    getActiveStories
);

router.post(
    "/:id/like",
    requireActiveSubscription,
    toggleStoryLike
);

router.get(
    "/admin",
    requireAdmin,
    getAdminStories
);

router.post(
    "/",
    requireAdmin,
    (req, res, next) => {
        upload.single("media")(req, res, (error) => {
            if (!error) {
                next();
                return;
            }

            console.error("Story upload error:", error);

            if (error instanceof multer.MulterError) {
                const message =
                    error.code === "LIMIT_FILE_SIZE"
                        ? "Story media must not exceed 50 MB."
                        : `Story upload failed: ${error.message}`;

                return res.status(400).json({
                    success: false,
                    message
                });
            }

            return res.status(400).json({
                success: false,
                message: error.message || "Story upload failed."
            });
        });
    },
    createStory
);

router.delete(
    "/:id",
    requireAdmin,
    deleteStory
);

module.exports = router;
