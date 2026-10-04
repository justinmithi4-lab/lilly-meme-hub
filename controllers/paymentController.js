
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
            "tnm_mpamba",
            "malipo",
            "bank",
            "cash",
            "manual"
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


module.exports = {
    submitPayment,
    getPaymentHistory
};
