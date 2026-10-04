const { pool } = require("../config/database");
const {
    deleteCloudinaryAsset,
    uploadBuffer
} = require("../utils/cloudinaryUpload");

async function getActiveStories(req, res) {
    try {
        const [stories] = await pool.execute(`
            SELECT
                s.id,
                s.media,
                s.media_type,
                s.caption,
                s.expires_at,
                s.created_at,
                u.username,
                (
                    SELECT COUNT(DISTINCT sv.user_id)
                    FROM story_views sv
                    WHERE sv.story_id = s.id
                ) AS view_count
            FROM stories s
            INNER JOIN users u
                ON u.id = s.user_id
            WHERE s.is_active = 1
              AND s.expires_at > NOW()
            ORDER BY s.created_at DESC
            LIMIT 50
        `);

        return res.json({
            success: true,
            stories
        });
    } catch (error) {
        console.error("Get active stories error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load stories."
        });
    }
}

async function getAdminStories(req, res) {
    try {
        const [stories] = await pool.execute(`
            SELECT
                s.id,
                s.media,
                s.media_type,
                s.caption,
                s.expires_at,
                s.is_active,
                s.created_at,
                u.username,
                (
                    SELECT COUNT(DISTINCT sv.user_id)
                    FROM story_views sv
                    WHERE sv.story_id = s.id
                ) AS view_count
            FROM stories s
            INNER JOIN users u
                ON u.id = s.user_id
            ORDER BY s.created_at DESC
            LIMIT 100
        `);

        return res.json({
            success: true,
            stories
        });
    } catch (error) {
        console.error("Get admin stories error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load stories."
        });
    }
}

async function createStory(req, res) {
    const caption =
        String((req.body || {}).caption || "").trim();
    const durationHours =
        Number((req.body || {}).durationHours || 24);

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "Choose an image or video for the story."
        });
    }

    if (caption.length > 500) {
        return res.status(400).json({
            success: false,
            message: "Story caption cannot exceed 500 characters."
        });
    }

    if (
        !Number.isInteger(durationHours) ||
        durationHours < 1 ||
        durationHours > 168
    ) {
        return res.status(400).json({
            success: false,
            message: "Story duration must be between 1 and 168 hours."
        });
    }

    const mediaType =
        req.file.mimetype.startsWith("video/")
            ? "video"
            : "image";

    let connection;
    let transactionStarted = false;
    let storyId;
    let uploadedAsset;

    try {
        uploadedAsset = await uploadBuffer(
            req.file.buffer,
            {
                folder: "lilly-memes/stories",
                resource_type: "auto"
            }
        );

        connection = await pool.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;

        const [result] = await connection.execute(
            `
            INSERT INTO stories
                (
                    user_id,
                    media_type,
                    media,
                    cloudinary_public_id,
                    caption,
                    expires_at,
                    is_active
                )
            VALUES (
                ?, ?, ?, ?, ?,
                DATE_ADD(NOW(), INTERVAL ? HOUR),
                1
            )
            `,
            [
                req.session.user.id,
                mediaType,
                uploadedAsset.secure_url,
                uploadedAsset.public_id,
                caption || null,
                durationHours
            ]
        );

        storyId = result.insertId;

        await connection.execute(
            `
            INSERT INTO admin_logs
                (admin_id, action, description, ip_address)
            VALUES (?, 'story_created', ?, ?)
            `,
            [
                req.session.user.id,
                `Published ${mediaType} story #${storyId}, expires in ${durationHours} hours.`,
                req.ip
            ]
        );

        await connection.commit();
        transactionStarted = false;

        return res.status(201).json({
            success: true,
            message: "Story published successfully.",
            story: {
                id: storyId,
                media: uploadedAsset.secure_url,
                media_type: mediaType,
                caption: caption || null,
                duration_hours: durationHours
            }
        });
    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Create story rollback error:", rollbackError);
            }
        }

        if (uploadedAsset) {
            try {
                await deleteCloudinaryAsset(
                    uploadedAsset.public_id,
                    mediaType
                );
            } catch (cleanupError) {
                console.error(
                    "Could not remove failed Cloudinary story upload:",
                    cleanupError
                );
            }
        }

        console.error("Create story error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to publish story."
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

module.exports = {
    getActiveStories,
    getAdminStories,
    createStory
};
