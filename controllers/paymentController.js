
const { pool } = require("../config/database");


/*
    Submit a payment for a pending subscription
*/
async function submitPayment(req, res) {
    try {
        const userId = req.session.user.id;

        const {
            subscription_id,
            payment_method,
            transaction_reference,
            phone_number
        } = req.body;


        /*
            Validate required fields
        */
        if (!subscription_id) {
            return res.status(400).json({
                success: false,
                message: "Subscription ID is required."
            });
        }

        if (!payment_method) {
            return res.status(400).json({
                success: false,
                message: "Please select a payment method."
            });
        }


        const allowedMethods = [
            "airtel_money",
            "tnm_mpamba"
        ];

        if (!allowedMethods.includes(payment_method)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment method."
            });
        }


        /*
            Find the user's pending subscription
        */
        const [subscriptions] = await pool.query(
            `
            SELECT
                s.id,
                s.user_id,
                s.status,
                s.plan_id,

                p.name AS plan_name,
                p.price,
                p.currency

            FROM subscriptions s

            INNER JOIN plans p
                ON s.plan_id = p.id

            WHERE s.id = ?
            AND s.user_id = ?

            LIMIT 1
            `,
            [
                subscription_id,
                userId
            ]
        );


        if (subscriptions.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Subscription not found."
            });
        }


        const subscription =
            subscriptions[0];


        /*
            Payment can only be submitted
            for a pending subscription.
        */
        if (subscription.status !== "pending") {
            return res.status(400).json({
                success: false,
                message:
                    "This subscription is no longer awaiting payment."
            });
        }


        /*
            Check whether a payment already exists
        */
        const [existingPayments] =
            await pool.query(
                `
                SELECT id
                FROM payments
                WHERE subscription_id = ?
                AND status = 'pending'
                LIMIT 1
                `,
                [subscription_id]
            );


        if (existingPayments.length > 0) {
            return res.status(400).json({
                success: false,
                message:
                    "A payment is already awaiting verification."
            });
        }


        /*
            Transaction reference is useful for
            Airtel Money, TNM Mpamba and Malipo.

            It is optional for manual/cash payments.
        */
        const reference =
            transaction_reference
                ? transaction_reference.trim()
                : null;


        const phone =
            phone_number
                ? phone_number.trim()
                : null;


        /*
            Create payment
        */
        const [result] = await pool.query(
            `
            INSERT INTO payments
            (
                user_id,
                subscription_id,
                amount,
                currency,
                payment_method,
                transaction_reference,
                phone_number,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
            `,
            [
                userId,
                subscription_id,
                subscription.price,
                subscription.currency,
                payment_method,
                reference,
                phone
            ]
        );


        res.status(201).json({
            success: true,
            message:
                "Payment submitted successfully. It is now awaiting verification.",
            payment_id: result.insertId
        });


    } catch (error) {

        console.error(
            "Submit payment error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to submit payment."
        });
    }
}


/*
    Get the user's payment history
*/
async function getPaymentHistory(req, res) {

    try {

        const userId =
            req.session.user.id;


        const [payments] =
            await pool.query(
                `
                SELECT
                    py.id,
                    py.amount,
                    py.currency,
                    py.payment_method,
                    py.transaction_reference,
                    py.phone_number,
                    py.status,
                    py.created_at,

                    p.name AS plan_name

                FROM payments py

                INNER JOIN subscriptions s
                    ON py.subscription_id = s.id

                INNER JOIN plans p
                    ON s.plan_id = p.id

                WHERE py.user_id = ?

                ORDER BY py.created_at DESC
                `,
                [userId]
            );


        res.json({
            success: true,
            payments
        });


    } catch (error) {

        console.error(
            "Payment history error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to load payment history."
        });
    }
}

async function getSubscriptionPaymentStatus(req, res) {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

    const subscriptionId = Number(req.params.subscriptionId);
    const userId = req.session.user.id;

    if (!Number.isInteger(subscriptionId) || subscriptionId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid subscription ID."
        });
    }

    try {
        const [payments] = await pool.execute(
            `
            SELECT
                p.id,
                p.status,
                s.status AS subscription_status
            FROM subscriptions s
            LEFT JOIN payments p
                ON p.subscription_id = s.id
               AND p.user_id = s.user_id
            WHERE s.id = ?
              AND s.user_id = ?
            ORDER BY p.created_at DESC
            LIMIT 1
            `,
            [subscriptionId, userId]
        );

        if (payments.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Subscription not found."
            });
        }

        return res.json({
            success: true,
            payment: payments[0].id
                ? payments[0]
                : null,
            subscription_status: payments[0].subscription_status
        });
    } catch (error) {
        console.error("Subscription payment status error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to check payment status."
        });
    }
}

/* =========================================
   ADMIN PAYMENT FUNCTIONS
========================================= */

async function getAdminPayments(req, res) {
    try {
        const [payments] = await pool.query(`
            SELECT
                p.id,
                p.user_id,
                p.subscription_id,
                p.amount,
                p.currency,
                p.payment_method,
                p.transaction_reference,
                p.phone_number,
                p.status,
                p.verified_by,
                p.verified_at,
                p.created_at,

                u.username,
                u.email,
                u.full_name,

                s.start_date,
                s.end_date,
                s.status AS subscription_status,

                pl.name AS plan_name,
                pl.duration_days

            FROM payments p

            INNER JOIN users u
                ON u.id = p.user_id

            INNER JOIN subscriptions s
                ON s.id = p.subscription_id

            INNER JOIN plans pl
                ON pl.id = s.plan_id

            ORDER BY
                p.created_at DESC
        `);

        res.json({
            success: true,
            payments
        });

    } catch (error) {
        console.error("Get admin payments error:");
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to load payments."
        });
    }
}


async function getAdminPaymentById(req, res) {
    try {
        const paymentId = Number(req.params.id);

        if (!Number.isInteger(paymentId) || paymentId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment ID."
            });
        }

        const [payments] = await pool.query(`
            SELECT
                p.id,
                p.user_id,
                p.subscription_id,
                p.amount,
                p.currency,
                p.payment_method,
                p.transaction_reference,
                p.phone_number,
                p.status,
                p.verified_by,
                p.verified_at,
                p.created_at,

                u.username,
                u.email,
                u.full_name,

                s.start_date,
                s.end_date,
                s.status AS subscription_status,

                pl.name AS plan_name,
                pl.duration_days

            FROM payments p

            INNER JOIN users u
                ON u.id = p.user_id

            INNER JOIN subscriptions s
                ON s.id = p.subscription_id

            INNER JOIN plans pl
                ON pl.id = s.plan_id

            WHERE p.id = ?
            LIMIT 1
        `, [paymentId]);

        if (payments.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Payment not found."
            });
        }

        res.json({
            success: true,
            payment: payments[0]
        });

    } catch (error) {
        console.error("Get admin payment error:");
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to load payment."
        });
    }
}

/* =========================================
   ADMIN APPROVE PAYMENT
========================================= */

async function approvePayment(req, res) {
    const paymentId =
        Number(req.params.id);

    const adminId =
        req.session.user.id;

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid payment ID."
        });
    }

    let connection;
    let transactionStarted = false;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;

        const [payments] = await connection.query(`
            SELECT
                p.id,
                p.user_id,
                p.subscription_id,
                p.amount,
                p.currency,
                p.status,

                s.status AS subscription_status,

                pl.name AS plan_name,
                pl.duration_days

            FROM payments p

            INNER JOIN subscriptions s
                ON s.id = p.subscription_id

            INNER JOIN plans pl
                ON pl.id = s.plan_id

            WHERE p.id = ?

            LIMIT 1
            FOR UPDATE
        `, [paymentId]);

        if (payments.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(404).json({
                success: false,
                message: "Payment not found."
            });
        }

        const payment = payments[0];

        if (payment.status !== "pending") {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message:
                    `This payment has already been ${payment.status}.`
            });
        }

        if (payment.subscription_status !== "pending") {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message:
                    "This subscription is no longer awaiting payment."
            });
        }

        const [accountRows] = await connection.query(
            "SELECT id, status FROM users WHERE id = ? FOR UPDATE",
            [payment.user_id]
        );

        if (accountRows.length === 0 || accountRows[0].status === "suspended") {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message: "This member account cannot be activated."
            });
        }

        const [activeSubscriptions] = await connection.query(`
            SELECT
                DATE_FORMAT(
                    GREATEST(
                        NOW(),
                        COALESCE(MAX(end_date), NOW())
                    ),
                    '%Y-%m-%d %H:%i:%s'
                ) AS start_date
            FROM subscriptions
            WHERE user_id = ?
              AND status = 'active'
              AND end_date > NOW()
        `, [payment.user_id]);

        const subscriptionStartDate =
            activeSubscriptions[0].start_date;

        const [paymentResult] = await connection.query(`
            UPDATE payments

            SET
                status = 'successful',
                verified_by = ?,
                verified_at = NOW()

            WHERE id = ?
            AND status = 'pending'
        `, [adminId, paymentId]);

        if (paymentResult.affectedRows !== 1) {
            throw new Error("Payment status changed during approval.");
        }

        const [subscriptionResult] = await connection.query(`
            UPDATE subscriptions

            SET
                status = 'active',
                start_date = ?,
                end_date = DATE_ADD(
                    ?,
                    INTERVAL ? DAY
                )

            WHERE id = ?
            AND status = 'pending'
        `, [
            subscriptionStartDate,
            subscriptionStartDate,
            payment.duration_days,
            payment.subscription_id
        ]);

        if (subscriptionResult.affectedRows !== 1) {
            throw new Error("Subscription status changed during approval.");
        }

        await connection.query(
            `
            UPDATE users
            SET status = 'active'
            WHERE id = ?
              AND status = 'pending'
            `,
            [payment.user_id]
        );

        await connection.query(`
            INSERT INTO notifications
            (
                user_id,
                type,
                title,
                message,
                related_id
            )

            VALUES
            (
                ?,
                'subscription',
                'Payment Approved',
                ?,
                ?
            )
        `, [
            payment.user_id,
            `Your ${payment.plan_name} subscription has been activated successfully.`,
            payment.subscription_id
        ]);

        await connection.query(`
            INSERT INTO admin_logs
            (
                admin_id,
                action,
                description,
                ip_address
            )

            VALUES
            (
                ?,
                'payment_approved',
                ?,
                ?
            )
        `, [
            adminId,
            `Approved payment #${payment.id} for ${payment.plan_name} (${payment.amount} ${payment.currency}).`,
            req.ip
        ]);

        await connection.commit();
        transactionStarted = false;

        return res.json({
            success: true,
            message: "Payment approved and subscription activated."
        });

    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Approve payment rollback error:");
                console.error(rollbackError);
            }
        }

        console.error("Approve payment error:");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to approve payment."
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
}


/* =========================================
   ADMIN REJECT PAYMENT
========================================= */

async function rejectPayment(req, res) {
    const paymentId =
        Number(req.params.id);

    const adminId =
        req.session.user.id;

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid payment ID."
        });
    }

    let connection;
    let transactionStarted = false;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;

        const [payments] = await connection.query(`
            SELECT
                p.id,
                p.user_id,
                p.subscription_id,
                p.status,

                s.status AS subscription_status

            FROM payments p

            INNER JOIN subscriptions s
                ON s.id = p.subscription_id

            WHERE p.id = ?

            LIMIT 1
            FOR UPDATE
        `, [paymentId]);

        if (payments.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(404).json({
                success: false,
                message: "Payment not found."
            });
        }

        const payment = payments[0];

        if (payment.status !== "pending") {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message:
                    `This payment has already been ${payment.status}.`
            });
        }

        if (payment.subscription_status !== "pending") {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message:
                    "This subscription is no longer awaiting payment."
            });
        }

        const [paymentResult] = await connection.query(`
            UPDATE payments

            SET
                status = 'rejected',
                verified_by = ?,
                verified_at = NOW()

            WHERE id = ?
            AND status = 'pending'
        `, [
            adminId,
            paymentId
        ]);

        if (paymentResult.affectedRows !== 1) {
            throw new Error("Payment status changed during rejection.");
        }

        const [subscriptionResult] = await connection.query(`
            UPDATE subscriptions

            SET status = 'rejected'

            WHERE id = ?
            AND status = 'pending'
        `, [
            payment.subscription_id
        ]);

        if (subscriptionResult.affectedRows !== 1) {
            throw new Error("Subscription status changed during rejection.");
        }

        await connection.query(`
            INSERT INTO notifications
            (
                user_id,
                type,
                title,
                message,
                related_id
            )

            VALUES
            (
                ?,
                'subscription',
                'Payment Rejected',
                ?,
                ?
            )
        `, [
            payment.user_id,
            "Your subscription payment was rejected. Please check your payment details and submit another payment.",
            payment.subscription_id
        ]);

        await connection.query(`
            INSERT INTO admin_logs
            (
                admin_id,
                action,
                description,
                ip_address
            )

            VALUES
            (
                ?,
                'payment_rejected',
                ?,
                ?
            )
        `, [
            adminId,
            `Rejected payment #${payment.id}.`,
            req.ip
        ]);

        await connection.commit();
        transactionStarted = false;

        return res.json({
            success: true,
            message: "Payment rejected successfully."
        });

    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Reject payment rollback error:");
                console.error(rollbackError);
            }
        }

        console.error("Reject payment error:");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to reject payment."
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
}


module.exports = {
    submitPayment,
    getPaymentHistory,
    getSubscriptionPaymentStatus,
    getAdminPayments,
    getAdminPaymentById,
    approvePayment,
    rejectPayment
};
