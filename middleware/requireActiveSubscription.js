const { pool } = require("../config/database");

async function requireActiveSubscription(req, res, next) {
    try {
        // User must be logged in
        if (!req.session || !req.session.user) {
            return res.status(401).json({
                success: false,
                message: "Please log in first.",
                code: "LOGIN_REQUIRED"
            });
        }

        // Only members can use member features
        if (req.session.user.role !== "member") {
            return res.status(403).json({
                success: false,
                message: "Member access required.",
                code: "MEMBER_REQUIRED"
            });
        }

        const userId = req.session.user.id;

        // Automatically mark expired subscriptions as expired
        await pool.execute(
            `
            UPDATE subscriptions
            SET status = 'expired'
            WHERE user_id = ?
              AND status = 'active'
              AND end_date <= NOW()
            `,
            [userId]
        );

        // Find the user's current active subscription
        const [subscriptions] = await pool.execute(
            `
            SELECT
                s.id,
                s.user_id,
                s.plan_id,
                s.start_date,
                s.end_date,
                s.status,
                p.name AS plan_name,
                p.price,
                p.duration_days
            FROM subscriptions s
            INNER JOIN plans p
                ON p.id = s.plan_id
            WHERE s.user_id = ?
              AND s.status = 'active'
              AND s.start_date <= NOW()
              AND s.end_date > NOW()
            ORDER BY s.end_date DESC
            LIMIT 1
            `,
            [userId]
        );

        if (subscriptions.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You need an active subscription to access this feature.",
                code: "SUBSCRIPTION_REQUIRED"
            });
        }

        // Make subscription information available to controllers
        req.subscription = subscriptions[0];

        next();

    } catch (error) {
        console.error("Subscription middleware error:");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Unable to verify your subscription."
        });
    }
}

module.exports = requireActiveSubscription;