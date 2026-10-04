const { pool } = require("../config/database");

async function sendMessage(req, res) {
    const body = req.body || {};
    const subject = String(body.subject || "").trim();
    const message = String(body.message || "").trim();

    if (!subject || !message) {
        return res.status(400).json({
            success: false,
            message: "Please enter both a subject and a message."
        });
    }

    if (subject.length > 120) {
        return res.status(400).json({
            success: false,
            message: "Subject cannot exceed 120 characters."
        });
    }

    if (message.length > 2000) {
        return res.status(400).json({
            success: false,
            message: "Message cannot exceed 2,000 characters."
        });
    }

    try {
        const [result] = await pool.execute(
            `
            INSERT INTO member_messages (user_id, subject, message)
            VALUES (?, ?, ?)
            `,
            [req.session.user.id, subject, message]
        );

        return res.status(201).json({
            success: true,
            message: "Your message was sent to the admin.",
            messageId: result.insertId
        });
    } catch (error) {
        console.error("Send member message error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to send your message. Please try again."
        });
    }
}

async function getMemberMessages(req, res) {
    try {
        const [messages] = await pool.query(`
            SELECT
                m.id,
                m.subject,
                m.message,
                m.created_at,
                u.id AS user_id,
                u.username,
                u.full_name,
                u.email
            FROM member_messages m
            INNER JOIN users u
                ON u.id = m.user_id
            ORDER BY m.created_at DESC, m.id DESC
        `);

        return res.json({
            success: true,
            messages
        });
    } catch (error) {
        console.error("Get member messages error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to load member messages."
        });
    }
}

module.exports = {
    sendMessage,
    getMemberMessages
};
