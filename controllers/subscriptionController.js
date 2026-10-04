
const { pool } = require("../config/database");

/*
|--------------------------------------------------------------------------
| GET ALL ACTIVE PLANS
|--------------------------------------------------------------------------
*/
async function getPlans(req, res) {
    try {
        const [plans] = await pool.query(`
            SELECT
                id,
                name,
                description,
                price,
                currency,
                duration_days
            FROM plans
            WHERE is_active = TRUE
            ORDER BY duration_days ASC
        `);

        res.json({
            success: true,
            plans
        });
    } catch (error) {
        console.error("Get plans error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load membership plans."
        });
    }
}


/*
|--------------------------------------------------------------------------
| GET CURRENT / LATEST SUBSCRIPTION
|--------------------------------------------------------------------------
*/
async function getCurrentSubscription(req, res) {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

    try {
        const userId = req.session.user.id;

        const [subscriptions] = await pool.query(`
            SELECT
                s.id,
                s.start_date,
                s.end_date,
                s.status,
                p.id AS plan_id,
                p.name AS plan_name,
                p.description,
                p.price,
                p.currency,
                p.duration_days
            FROM subscriptions s
            INNER JOIN plans p
                ON s.plan_id = p.id
            WHERE s.user_id = ?
            ORDER BY
                CASE
                    WHEN s.status = 'active'
                     AND s.start_date <= NOW()
                     AND s.end_date > NOW()
                    THEN 0
                    WHEN s.status = 'pending'
                    THEN 1
                    WHEN s.status = 'active'
                     AND s.start_date > NOW()
                    THEN 2
                    ELSE 3
                END,
                s.created_at DESC
            LIMIT 1
        `, [userId]);

        if (subscriptions.length === 0) {
            return res.json({
                success: true,
                subscription: null
            });
        }

        const subscription = subscriptions[0];

        /*
        |--------------------------------------------------------------------------
        | Automatically mark expired subscriptions
        |--------------------------------------------------------------------------
        */

        if (
            subscription.status === "active" &&
            subscription.end_date &&
            new Date(subscription.end_date) <= new Date()
        ) {
            await pool.query(
                `
                UPDATE subscriptions
                SET status = 'expired'
                WHERE id = ?
                `,
                [subscription.id]
            );

            subscription.status = "expired";
        }

        res.json({
            success: true,
            subscription
        });

    } catch (error) {
        console.error("Get current subscription error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load your subscription."
        });
    }
}


/*
|--------------------------------------------------------------------------
| GET SUBSCRIPTION BY ID
|--------------------------------------------------------------------------
| Used by subscribe.html after a user selects a membership plan.
|--------------------------------------------------------------------------
*/
async function getSubscriptionById(req, res) {
    try {
        const userId = req.session.user.id;
        const subscriptionId = req.params.id;

        const [subscriptions] = await pool.query(`
            SELECT
                s.id,
                s.user_id,
                s.start_date,
                s.end_date,
                s.status,
                p.id AS plan_id,
                p.name AS plan_name,
                p.description,
                p.price,
                p.currency,
                p.duration_days
            FROM subscriptions s
            INNER JOIN plans p
                ON s.plan_id = p.id
            WHERE s.id = ?
            AND s.user_id = ?
            LIMIT 1
        `, [
            subscriptionId,
            userId
        ]);

        if (subscriptions.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Subscription not found."
            });
        }

        res.json({
            success: true,
            subscription: subscriptions[0]
        });

    } catch (error) {
        console.error("Get subscription by ID error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load subscription."
        });
    }
}


/*
|--------------------------------------------------------------------------
| GET SUBSCRIPTION HISTORY
|--------------------------------------------------------------------------
*/
async function getSubscriptionHistory(req, res) {
    try {
        const userId = req.session.user.id;

        const [subscriptions] = await pool.query(`
            SELECT
                s.id,
                s.start_date,
                s.end_date,
                s.status,
                s.created_at,
                p.name AS plan_name,
                p.price,
                p.currency,
                p.duration_days
            FROM subscriptions s
            INNER JOIN plans p
                ON s.plan_id = p.id
            WHERE s.user_id = ?
            ORDER BY s.created_at DESC
        `, [userId]);

        res.json({
            success: true,
            subscriptions
        });

    } catch (error) {
        console.error("Subscription history error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load subscription history."
        });
    }
}


/*
|--------------------------------------------------------------------------
| CREATE SUBSCRIPTION
|--------------------------------------------------------------------------
| Creates a pending subscription.
| Payment verification happens separately.
|--------------------------------------------------------------------------
*/
async function subscribe(req, res) {
    try {
        const userId = req.session.user.id;
        const { plan_id } = req.body;

        if (!plan_id) {
            return res.status(400).json({
                success: false,
                message: "Please select a membership plan."
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Check that the selected plan exists
        |--------------------------------------------------------------------------
        */

        const [plans] = await pool.query(`
            SELECT
                id,
                name,
                description,
                price,
                currency,
                duration_days
            FROM plans
            WHERE id = ?
            AND is_active = TRUE
            LIMIT 1
        `, [plan_id]);

        if (plans.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Membership plan not found."
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Check for an existing active subscription
        |--------------------------------------------------------------------------
        */

        const [activeSubscriptions] = await pool.query(`
            SELECT id
            FROM subscriptions
            WHERE user_id = ?
            AND status = 'active'
            AND end_date > NOW()
            LIMIT 1
        `, [userId]);

        if (activeSubscriptions.length > 0) {
            return res.status(400).json({
                success: false,
                message: "You already have an active subscription."
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Check for an existing pending subscription
        |--------------------------------------------------------------------------
        */

        const [pendingSubscriptions] = await pool.query(`
            SELECT id
            FROM subscriptions
            WHERE user_id = ?
            AND status = 'pending'
            LIMIT 1
        `, [userId]);

        if (pendingSubscriptions.length > 0) {
            return res.status(400).json({
                success: false,
                message: "You already have a pending subscription."
            });
        }

        const plan = plans[0];

        /*
        |--------------------------------------------------------------------------
        | Create pending subscription
        |--------------------------------------------------------------------------
        */

        const [result] = await pool.query(`
            INSERT INTO subscriptions
            (
                user_id,
                plan_id,
                status
            )
            VALUES (?, ?, 'pending')
        `, [
            userId,
            plan.id
        ]);

        res.status(201).json({
            success: true,
            message: "Subscription created. Please complete your payment.",
            subscription_id: result.insertId,
            plan
        });

    } catch (error) {
        console.error("Create subscription error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to create your subscription."
        });
    }
}


/*
|--------------------------------------------------------------------------
| EXPORT CONTROLLER FUNCTIONS
|--------------------------------------------------------------------------
*/

module.exports = {
    getPlans,
    getCurrentSubscription,
    getSubscriptionById,
    getSubscriptionHistory,
    subscribe
};
