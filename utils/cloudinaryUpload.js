const cloudinary = require("../config/cloudinary");

function uploadBuffer(buffer, options) {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        throw new Error("A non-empty upload buffer is required.");
    }

    const configuration = cloudinary.config();
    if (
        !configuration.cloud_name ||
        !configuration.api_key ||
        !configuration.api_secret
    ) {
        throw new Error(
            "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET."
        );
    }

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            options,
            (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }

                if (!result || !result.secure_url || !result.public_id) {
                    reject(new Error("Cloudinary returned an incomplete upload result."));
                    return;
                }

                resolve(result);
            }
        );

        stream.end(buffer);
    });
}

async function deleteCloudinaryAsset(publicId, resourceType = "image") {
    if (!publicId) {
        return;
    }

    const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true
    });

    if (result.result !== "ok" && result.result !== "not found") {
        throw new Error(
            `Cloudinary asset deletion failed: ${result.result || "unknown result"}.`
        );
    }
}

module.exports = {
    uploadBuffer,
    deleteCloudinaryAsset
};
