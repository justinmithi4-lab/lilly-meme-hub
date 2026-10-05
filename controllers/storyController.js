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
                s.user_id,
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
                ) AS view_count,
                (
                    SELECT COUNT(*)
                    FROM story_likes sl
                    WHERE sl.story_id = s.id
                ) AS like_count,
                EXISTS (
                    SELECT 1
                    FROM story_likes sl
                    WHERE sl.story_id = s.id
                      AND sl.user_id = ?
                ) AS user_liked
            FROM stories s
            INNER JOIN users u
                ON u.id = s.user_id
            WHERE s.is_active = 1
              AND s.expires_at > NOW()
            ORDER BY s.created_at DESC
            LIMIT 50
        `, [req.session.user.id]);

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

async function toggleStoryLike(req, res) {
    const storyId = Number(req.params.id);

    if (!Number.isInteger(storyId) || storyId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid story ID."
        });
    }

    let connection;
    let transactionStarted = false;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;

        const [stories] = await connection.execute(
            `
            SELECT id
            FROM stories
            WHERE id = ?
              AND is_active = 1
              AND expires_at > NOW()
            LIMIT 1
            FOR UPDATE
            `,
            [storyId]
        );

        if (!stories.length) {
            await connection.rollback();
            transactionStarted = false;
            return res.status(404).json({
                success: false,
                message: "Story not found or expired."
            });
        }

        const userId = req.session.user.id;
        const [existing] = await connection.execute(
            `
            SELECT id
            FROM story_likes
            WHERE story_id = ?
              AND user_id = ?
            LIMIT 1
            `,
            [storyId, userId]
        );

        let liked;
        if (existing.length) {
            await connection.execute(
                `
                DELETE FROM story_likes
                WHERE story_id = ?
                  AND user_id = ?
                `,
                [storyId, userId]
            );
            liked = false;
        } else {
            await connection.execute(
                `
                INSERT INTO story_likes (story_id, user_id)
                VALUES (?, ?)
                `,
                [storyId, userId]
            );
            liked = true;
        }

        const [likeRows] = await connection.execute(
            `
            SELECT COUNT(*) AS like_count
            FROM story_likes
            WHERE story_id = ?
            `,
            [storyId]
        );

        await connection.commit();
        transactionStarted = false;

        return res.json({
            success: true,
            liked,
            like_count: Number(likeRows[0].like_count)
        });
    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Story like rollback error:", rollbackError);
            }
        }

        console.error("Toggle story like error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to save story like."
        });
    } finally {
        if (connection) {
            connection.release();
        }
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

async function deleteStory(req, res) {
    const storyId = Number(req.params.id);

    if (!Number.isInteger(storyId) || storyId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid story ID."
        });
    }

    let connection;
    let transactionStarted = false;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;

        const [stories] = await connection.execute(
            `
            SELECT id, caption, cloudinary_public_id, media_type
            FROM stories
            WHERE id = ?
            LIMIT 1
            FOR UPDATE
            `,
            [storyId]
        );

        if (stories.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(404).json({
                success: false,
                message: "Story not found."
            });
        }

        const story = stories[0];

        await connection.execute(
            "DELETE FROM stories WHERE id = ?",
            [storyId]
        );

        await connection.execute(
            `
            INSERT INTO admin_logs
                (admin_id, action, description, ip_address)
            VALUES (?, 'story_deleted', ?, ?)
            `,
            [
                req.session.user.id,
                `Deleted story #${storyId}${story.caption ? `: ${story.caption}` : "."}`,
                req.ip
            ]
        );

        await connection.commit();
        transactionStarted = false;

        if (story.cloudinary_public_id) {
            try {
                await deleteCloudinaryAsset(
                    story.cloudinary_public_id,
                    story.media_type
                );
            } catch (cleanupError) {
                console.error(
                    "Story deleted but Cloudinary media cleanup failed:",
                    cleanupError
                );
                return res.status(500).json({
                    success: false,
                    message: "Story deleted, but its Cloudinary media could not be removed."
                });
            }
        }

        return res.json({
            success: true,
            message: "Story deleted successfully."
        });
    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Delete story rollback error:", rollbackError);
            }
        }

        console.error("Delete story error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete story."
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

module.exports = {
    getActiveStories,
    toggleStoryLike,
    getAdminStories,
    createStory,
    deleteStory
};
