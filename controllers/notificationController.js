const { pool } = require("../config/database");

async function getNotifications(req, res) {
    try {
        const userId = req.session.user.id;

        const [notifications] = await pool.execute(
            `
            SELECT
                notifications.id,
                notifications.type,
                notifications.title,
                notifications.message,
                notifications.related_id,
                COALESCE(
                    notifications.related_comment_id,
                    CASE
                        WHEN notifications.type = 'comment_like'
                            THEN notifications.related_id
                        WHEN notifications.type = 'comment_reply'
                            AND notifications.title = 'Someone replied to your comment'
                            THEN notifications.related_id
                    END
                ) AS related_comment_id,
                COALESCE(
                    related_comment.meme_id,
                    CASE
                        WHEN notifications.type = 'meme_comment'
                            THEN notifications.related_id
                        WHEN notifications.type = 'comment_reply'
                            AND notifications.title = 'Someone replied to a comment'
                            THEN notifications.related_id
                    END
                ) AS related_meme_id,
                notifications.is_read,
                notifications.created_at
            FROM notifications
            LEFT JOIN comments AS related_comment
                ON related_comment.id = COALESCE(
                    notifications.related_comment_id,
                    CASE
                        WHEN notifications.type = 'comment_like'
                            THEN notifications.related_id
                        WHEN notifications.type = 'comment_reply'
                            AND notifications.title = 'Someone replied to your comment'
                            THEN notifications.related_id
                    END
                )
                AND related_comment.is_deleted = FALSE
            WHERE notifications.user_id = ?
            ORDER BY notifications.created_at DESC
            LIMIT 50
            `,
            [userId]
        );

        res.json({
            success: true,
            notifications
        });
    } catch (error) {
        console.error("Get notifications error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load notifications."
        });
    }
}


async function getUnreadCount(req, res) {
    try {
        const userId = req.session.user.id;

        const [rows] = await pool.execute(
            `
            SELECT COUNT(*) AS unread_count
            FROM notifications
            WHERE user_id = ?
            AND is_read = 0
            `,
            [userId]
        );

        res.json({
            success: true,
            unread_count: Number(rows[0].unread_count)
        });
    } catch (error) {
        console.error("Get unread notification count error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get notification count."
        });
    }
}


async function markNotificationAsRead(req, res) {
    try {
        const userId = req.session.user.id;
        const notificationId = Number(req.params.id);

        if (!Number.isInteger(notificationId) || notificationId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification ID."
            });
        }

        const [result] = await pool.execute(
            `
            UPDATE notifications
            SET is_read = 1
            WHERE id = ?
            AND user_id = ?
            `,
            [notificationId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Notification not found."
            });
        }

        res.json({
            success: true,
            message: "Notification marked as read."
        });
    } catch (error) {
        console.error("Mark notification as read error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update notification."
        });
    }
}


async function markAllNotificationsAsRead(req, res) {
    try {
        const userId = req.session.user.id;

        await pool.execute(
            `
            UPDATE notifications
            SET is_read = 1
            WHERE user_id = ?
            AND is_read = 0
            `,
            [userId]
        );

        res.json({
            success: true,
            message: "All notifications marked as read."
        });
    } catch (error) {
        console.error("Mark all notifications as read error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update notifications."
        });
    }
}


module.exports = {
    getNotifications,
    getUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead
};