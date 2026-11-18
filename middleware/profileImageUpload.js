const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const PROFILE_IMAGE_DIRECTORY = path.resolve(
    __dirname,
    "..",
    "uploads",
    "profiles"
);

const MIME_TYPES_BY_EXTENSION = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp"
};

fs.mkdirSync(PROFILE_IMAGE_DIRECTORY, { recursive: true });

const storage = multer.diskStorage({
    destination: PROFILE_IMAGE_DIRECTORY,
    filename: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        callback(
            null,
            `${crypto.randomBytes(16).toString("hex")}${extension}`
        );
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    },
    fileFilter: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const expectedMimeType = MIME_TYPES_BY_EXTENSION[extension];

        if (!expectedMimeType || file.mimetype !== expectedMimeType) {
            const error = new Error(
                "Choose a JPG, JPEG, PNG, or WEBP image with a matching file type."
            );
            error.code = "INVALID_PROFILE_IMAGE";
            return callback(error);
        }

        callback(null, true);
    }
});

function profileImageUpload(req, res, next) {
    upload.single("profileImage")(req, res, error => {
        if (!error) {
            return next();
        }

        if (
            error instanceof multer.MulterError &&
            error.code === "LIMIT_FILE_SIZE"
        ) {
            return res.status(413).json({
                success: false,
                message: "Profile pictures must be 5 MB or smaller."
            });
        }

        if (
            error instanceof multer.MulterError ||
            error.code === "INVALID_PROFILE_IMAGE"
        ) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        next(error);
    });
}

function detectImageMimeType(buffer) {
    if (
        buffer.length >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
    ) {
        return "image/jpeg";
    }

    if (
        buffer.length >= 8 &&
        buffer.subarray(0, 8).equals(
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
        )
    ) {
        return "image/png";
    }

    if (
        buffer.length >= 12 &&
        buffer.toString("ascii", 0, 4) === "RIFF" &&
        buffer.toString("ascii", 8, 12) === "WEBP"
    ) {
        return "image/webp";
    }

    return null;
}

async function validateProfileImage(file) {
    const handle = await fs.promises.open(file.path, "r");

    try {
        const header = Buffer.alloc(12);
        const { bytesRead } = await handle.read(header, 0, header.length, 0);
        const detectedMimeType = detectImageMimeType(
            header.subarray(0, bytesRead)
        );
        const extension = path.extname(file.filename).toLowerCase();

        return Boolean(
            detectedMimeType &&
            detectedMimeType === file.mimetype &&
            MIME_TYPES_BY_EXTENSION[extension] === detectedMimeType
        );
    } finally {
        await handle.close();
    }
}

function isManagedProfileImage(filename) {
    return (
        typeof filename === "string" &&
        /^[a-f0-9]{32}\.(?:jpg|jpeg|png|webp)$/i.test(filename)
    );
}

async function deleteManagedProfileImage(filename) {
    if (!isManagedProfileImage(filename)) {
        return;
    }

    const filePath = path.resolve(PROFILE_IMAGE_DIRECTORY, filename);
    if (path.dirname(filePath) !== PROFILE_IMAGE_DIRECTORY) {
        return;
    }

    try {
        await fs.promises.unlink(filePath);
    } catch (error) {
        if (error.code !== "ENOENT") {
            throw error;
        }
    }
}

module.exports = {
    profileImageUpload,
    validateProfileImage,
    deleteManagedProfileImage
};
