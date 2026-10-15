
const { pool } = require("../config/database");
const crypto = require("crypto");
const {
    createCheckout,
    verifyTransaction
} = require("../utils/paychangu");


/*
    Create or resume a PayChangu checkout for a pending subscription
*/
async function submitPayment(req, res) {
    const userId = req.session.user.id;
    const subscriptionId = Number(req.body.subscription_id);
    const paymentMethod = req.body.payment_method || "paychangu";
    const allowedMethods = [
        "paychangu",
        "airtel_money",
        "tnm_mpamba"
    ];

    if (!Number.isInteger(subscriptionId) || subscriptionId <= 0) {
        return res.status(400).json({
            success: false,
            message: "A valid subscription ID is required."
        });
    }

    if (!allowedMethods.includes(paymentMethod)) {
        return res.status(400).json({
            success: false,
            message: "Invalid payment method."
        });
    }

    let connection;
    let payment;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [subscriptions] = await connection.query(
            `
            SELECT
                s.id,
                s.user_id,
                s.status,
                p.name AS plan_name,
                p.price,
                p.currency,
                u.email,
                u.username,
                u.full_name
            FROM subscriptions s
            INNER JOIN plans p ON p.id = s.plan_id
            INNER JOIN users u ON u.id = s.user_id
            WHERE s.id = ?
              AND s.user_id = ?
            LIMIT 1
            FOR UPDATE
            `,
            [subscriptionId, userId]
        );

        if (subscriptions.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: "Subscription not found."
            });
        }

        const subscription =
            subscriptions[0];

        if (subscription.status !== "pending") {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message:
                    "This subscription is no longer awaiting payment."
            });
        }

        const [existingPayments] = await connection.query(
            `
            SELECT id, payment_method, checkout_url
            FROM payments
            WHERE subscription_id = ?
              AND status = 'pending'
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [subscriptionId]
        );

        if (existingPayments.length > 0) {
            await connection.commit();
            connection.release();
            connection = null;

            const existingPayment = existingPayments[0];

            if (
                existingPayment.payment_method === "paychangu" &&
                existingPayment.checkout_url
            ) {
                return res.json({
                    success: true,
                    checkout_url: existingPayment.checkout_url
                });
            }

            return res.status(400).json({
                success: false,
                message:
                    "A payment for this subscription is already awaiting verification."
            });
        }

        const amount = Number(subscription.price);
        const currency = String(subscription.currency).toUpperCase();

        if (paymentMethod === "paychangu" && (
            !Number.isSafeInteger(amount) ||
            amount <= 0 ||
            !["MWK", "USD"].includes(currency)
        )) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message:
                    "This plan has an amount or currency that PayChangu cannot process."
            });
        }

        if (paymentMethod !== "paychangu") {
            const reference =
                typeof req.body.transaction_reference === "string"
                    ? req.body.transaction_reference.trim() || null
                    : null;
            const phone =
                typeof req.body.phone_number === "string"
                    ? req.body.phone_number.trim() || null
                    : null;

            const [result] = await connection.query(
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
                    subscriptionId,
                    subscription.price,
                    subscription.currency,
                    paymentMethod,
                    reference,
                    phone
                ]
            );

            await connection.commit();
            connection.release();
            connection = null;

            return res.status(201).json({
                success: true,
                message:
                    "Payment submitted successfully. It is now awaiting verification.",
                payment_id: result.insertId
            });
        }

        const txRef = `lilly-${crypto.randomUUID()}`;
        const [result] = await connection.query(
            `
            INSERT INTO payments
            (
                user_id,
                subscription_id,
                amount,
                currency,
                payment_method,
                transaction_reference,
                status
            )
            VALUES (?, ?, ?, ?, 'paychangu', ?, 'pending')
            `,
            [
                userId,
                subscriptionId,
                amount,
                currency,
                txRef
            ]
        );

        await connection.commit();
        connection.release();
        connection = null;

        payment = {
            id: result.insertId,
            txRef,
            amount,
            currency,
            subscription
        };

        const customerName =
            String(subscription.full_name || "").trim() ||
            subscription.username;
        const [firstName, ...lastNameParts] =
            customerName.split(/\s+/);

        const checkoutUrl = await createCheckout({
            amount,
            currency,
            email: subscription.email,
            firstName,
            lastName: lastNameParts.join(" "),
            planName: subscription.plan_name,
            subscriptionId,
            txRef
        });

        await pool.query(
            `
            UPDATE payments
            SET checkout_url = ?
            WHERE id = ?
              AND status = 'pending'
            `,
            [checkoutUrl, payment.id]
        );

        return res.status(201).json({
            success: true,
            checkout_url: checkoutUrl
        });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Start payment rollback error:", rollbackError);
            }
        }

        if (payment) {
            try {
                await pool.query(
                    `
                    UPDATE payments
                    SET status = 'failed',
                        verified_at = NOW()
                    WHERE id = ?
                      AND status = 'pending'
                    `,
                    [payment.id]
                );
            } catch (updateError) {
                console.error("Failed to record PayChangu checkout error:", updateError);
            }
        }

        console.error("Submit PayChangu payment error:", error);

        return res.status(502).json({
            success: false,
            message:
                "Unable to start PayChangu checkout. Please try again."
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

async function applyPaychanguVerification(txRef, verification) {
    const transaction = verification.data || {};
    const transactionStatus =
        String(transaction.status || "").toLowerCase();

    if (transaction.tx_ref !== txRef) {
        throw new Error("PayChangu transaction reference did not match.");
    }

    if (transactionStatus === "failed") {
        await pool.query(
            `
            UPDATE payments
            SET status = 'failed'
            WHERE transaction_reference = ?
              AND payment_method = 'paychangu'
              AND status = 'pending'
            `,
            [txRef]
        );

        return "failed";
    }

    if (transactionStatus !== "success") {
        return transactionStatus || "pending";
    }

    let connection;
    let transactionStarted = false;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;

        const [payments] = await connection.query(
            `
            SELECT
                p.id,
                p.user_id,
                p.subscription_id,
                p.amount,
                p.currency,
                p.payment_method,
                p.status,
                s.status AS subscription_status,
                pl.name AS plan_name,
                pl.duration_days
            FROM payments p
            INNER JOIN subscriptions s ON s.id = p.subscription_id
            INNER JOIN plans pl ON pl.id = s.plan_id
            WHERE p.transaction_reference = ?
              AND p.payment_method = 'paychangu'
            LIMIT 1
            FOR UPDATE
            `,
            [txRef]
        );

        if (payments.length === 0) {
            throw new Error("PayChangu payment reference was not found.");
        }

        const payment = payments[0];

        if (
            String(transaction.currency).toUpperCase() !==
                String(payment.currency).toUpperCase() ||
            !Number.isFinite(Number(transaction.amount)) ||
            Number(transaction.amount) < Number(payment.amount)
        ) {
            throw new Error(
                "PayChangu payment amount or currency did not match the order."
            );
        }

        if (payment.status !== "pending") {
            await connection.commit();
            transactionStarted = false;
            return payment.status;
        }

        const [accounts] = await connection.query(
            "SELECT id, status FROM users WHERE id = ? FOR UPDATE",
            [payment.user_id]
        );

        await connection.query(
            `
            UPDATE payments
            SET status = 'successful',
                verified_by = NULL,
                verified_at = NOW()
            WHERE id = ?
              AND status = 'pending'
            `,
            [payment.id]
        );

        if (
            payment.subscription_status === "pending" &&
            accounts.length > 0 &&
            accounts[0].status !== "suspended"
        ) {
            const [activeSubscriptions] = await connection.query(`
                SELECT
                    DATE_FORMAT(
                        GREATEST(NOW(), COALESCE(MAX(end_date), NOW())),
                        '%Y-%m-%d %H:%i:%s'
                    ) AS start_date
                FROM subscriptions
                WHERE user_id = ?
                  AND status = 'active'
                  AND end_date > NOW()
            `, [payment.user_id]);

            const startDate = activeSubscriptions[0].start_date;
            const [subscriptionResult] = await connection.query(
                `
                UPDATE subscriptions
                SET status = 'active',
                    start_date = ?,
                    end_date = DATE_ADD(?, INTERVAL ? DAY)
                WHERE id = ?
                  AND status = 'pending'
                `,
                [
                    startDate,
                    startDate,
                    payment.duration_days,
                    payment.subscription_id
                ]
            );

            if (subscriptionResult.affectedRows !== 1) {
                throw new Error(
                    "Subscription status changed during payment verification."
                );
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

            await connection.query(
                `
                INSERT INTO notifications
                (
                    user_id,
                    type,
                    title,
                    message,
                    related_id
                )
                VALUES (?, 'subscription', 'Payment Approved', ?, ?)
                `,
                [
                    payment.user_id,
                    `Your ${payment.plan_name} subscription has been activated successfully.`,
                    payment.subscription_id
                ]
            );
        }

        await connection.commit();
        transactionStarted = false;
        return "success";
    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("PayChangu verification rollback error:", rollbackError);
            }
        }

        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

async function verifyPaychanguPayment(txRef) {
    const verification = await verifyTransaction(txRef);
    return applyPaychanguVerification(txRef, verification);
}

async function handlePaychanguCallback(req, res) {
    const txRef = String(
        req.query.tx_ref ||
        req.body?.tx_ref ||
        req.body?.data?.tx_ref ||
        ""
    ).trim();

    if (!txRef) {
        return res.status(400).send("Missing PayChangu transaction reference.");
    }

    let subscriptionId;

    try {
        const [payments] = await pool.query(
            `
            SELECT subscription_id
            FROM payments
            WHERE transaction_reference = ?
              AND payment_method = 'paychangu'
            LIMIT 1
            `,
            [txRef]
        );

        if (payments.length === 0) {
            return res.status(404).send("Payment not found.");
        }

        subscriptionId = payments[0].subscription_id;

        try {
            await verifyPaychanguPayment(txRef);
        } catch (error) {
            console.error("PayChangu callback verification error:", error);
            if (req.method === "GET") {
                return res.redirect(
                    303,
                    `/subscribe.html?subscription_id=${encodeURIComponent(
                        subscriptionId
                    )}`
                );
            }

            throw error;
        }

        if (req.method === "POST") return res.sendStatus(200);

        return res.redirect(
            303,
            `/subscribe.html?subscription_id=${encodeURIComponent(
                subscriptionId
            )}`
        );
    } catch (error) {
        console.error("PayChangu callback error:", error);
        if (req.method === "GET" && subscriptionId) {
            return res.redirect(
                303,
                `/subscribe.html?subscription_id=${encodeURIComponent(
                    subscriptionId
                )}`
            );
        }

        return res.status(500).send("Unable to process the payment callback.");
    }
}

async function handlePaychanguWebhook(req, res) {
    const webhookSecret = process.env.PAYCHANGU_WEBHOOK_SECRET;
    const signature = req.get("Signature");

    if (!webhookSecret) {
        console.error("PAYCHANGU_WEBHOOK_SECRET is not configured.");
        return res.sendStatus(500);
    }

    if (!signature || !Buffer.isBuffer(req.rawBody)) {
        return res.sendStatus(401);
    }

    const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(req.rawBody)
        .digest();
    const receivedSignature = Buffer.from(signature, "hex");

    if (
        receivedSignature.length !== expectedSignature.length ||
        !crypto.timingSafeEqual(receivedSignature, expectedSignature)
    ) {
        return res.sendStatus(401);
    }

    const txRef = String(
        req.body?.tx_ref || req.body?.data?.tx_ref || ""
    ).trim();

    if (!txRef) {
        return res.sendStatus(200);
    }

    try {
        const [payments] = await pool.query(
            `
            SELECT id
            FROM payments
            WHERE transaction_reference = ?
              AND payment_method = 'paychangu'
            LIMIT 1
            `,
            [txRef]
        );

        if (payments.length > 0) {
            await verifyPaychanguPayment(txRef);
        }

        return res.sendStatus(200);
    } catch (error) {
        console.error("PayChangu webhook processing error:", error);
        return res.sendStatus(500);
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
        const [subscriptions] = await pool.execute(
            `
            SELECT id, status
            FROM subscriptions
            WHERE id = ?
              AND user_id = ?
            LIMIT 1
            `,
            [subscriptionId, userId]
        );

        if (subscriptions.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Subscription not found."
            });
        }

        let [payments] = await pool.execute(
            `
            SELECT
                id,
                status,
                payment_method,
                transaction_reference,
                checkout_url
            FROM payments
            WHERE subscription_id = ?
              AND user_id = ?
            ORDER BY created_at DESC
            LIMIT 1
            `,
            [subscriptionId, userId]
        );

        if (
            payments.length > 0 &&
            payments[0].status === "pending" &&
            payments[0].payment_method === "paychangu" &&
            payments[0].transaction_reference
        ) {
            await verifyPaychanguPayment(
                payments[0].transaction_reference
            );

            [payments] = await pool.execute(
                `
                SELECT
                    id,
                    status,
                    payment_method,
                    transaction_reference,
                    checkout_url
                FROM payments
                WHERE subscription_id = ?
                  AND user_id = ?
                ORDER BY created_at DESC
                LIMIT 1
                `,
                [subscriptionId, userId]
            );
        }

        let subscriptionStatus = subscriptions[0].status;

        if (
            payments.length > 0 &&
            payments[0].payment_method === "paychangu"
        ) {
            const [updatedSubscriptions] = await pool.execute(
                `
                SELECT status
                FROM subscriptions
                WHERE id = ?
                  AND user_id = ?
                LIMIT 1
                `,
                [subscriptionId, userId]
            );
            subscriptionStatus = updatedSubscriptions[0].status;
        }

        return res.json({
            success: true,
            payment: payments[0] || null,
            subscription_status: subscriptionStatus
        });
    } catch (error) {
        console.error("Subscription payment status error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to verify payment status."
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
                p.payment_method,
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

        if (payment.payment_method === "paychangu") {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message:
                    "PayChangu payments are verified automatically and cannot be manually approved."
            });
        }

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
                p.payment_method,
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

        if (payment.payment_method === "paychangu") {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message:
                    "PayChangu payments cannot be manually rejected."
            });
        }

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
    handlePaychanguCallback,
    handlePaychanguWebhook,
    getAdminPayments,
    getAdminPaymentById,
    approvePayment,
    rejectPayment
};
