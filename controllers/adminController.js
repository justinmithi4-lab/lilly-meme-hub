const { pool } = require("../config/database");


/* =========================================
   ADMIN DASHBOARD
========================================= */

async function getDashboard(req, res) {
    try {

        const [
            [memberStats],
            [paymentStats],
            [revenueByCurrency],
            [subscriptionStats],
            [memeStats],
            [recentPayments]
        ] = await Promise.all([

            pool.query(`
                SELECT
                    COUNT(*) AS total_members,

                    COALESCE(SUM(
                        CASE
                            WHEN status = 'active'
                            THEN 1
                            ELSE 0
                        END
                    ), 0) AS active_members,

                    COALESCE(SUM(
                        CASE
                            WHEN status = 'suspended'
                            THEN 1
                            ELSE 0
                        END
                    ), 0) AS suspended_members

                FROM users

                WHERE role = 'member'
            `),

            pool.query(`
                SELECT
                    COUNT(*) AS total_payments,

                    COALESCE(SUM(
                        CASE
                            WHEN status = 'pending'
                            THEN 1
                            ELSE 0
                        END
                    ), 0) AS pending_payments,

                    COALESCE(SUM(
                        CASE
                            WHEN status = 'successful'
                            THEN 1
                            ELSE 0
                        END
                    ), 0) AS successful_payments

                FROM payments
            `),

            pool.query(`
                SELECT
                    currency,
                    COALESCE(SUM(amount), 0) AS total_revenue
                FROM payments
                WHERE status = 'successful'
                GROUP BY currency
                ORDER BY currency
            `),

            pool.query(`
                SELECT
                    COUNT(*) AS total_subscriptions,

                    COALESCE(SUM(
                        CASE
                            WHEN status = 'active'
                            AND start_date <= NOW()
                            AND end_date > NOW()
                            THEN 1
                            ELSE 0
                        END
                    ), 0) AS active_subscriptions,

                    COALESCE(SUM(
                        CASE
                            WHEN status = 'pending'
                            THEN 1
                            ELSE 0
                        END
                    ), 0) AS pending_subscriptions

                FROM subscriptions
            `),

            pool.query(`
                SELECT
                    COUNT(*) AS total_memes,

                    COALESCE(SUM(
                        CASE
                            WHEN is_active = 1
                            THEN 1
                            ELSE 0
                        END
                    ), 0) AS active_memes

                FROM memes
            `),

            pool.query(`
                SELECT
                    p.id,
                    p.amount,
                    p.currency,
                    p.payment_method,
                    p.transaction_reference,
                    p.phone_number,
                    p.status,
                    p.created_at,

                    u.username,
                    u.full_name,

                    pl.name AS plan_name

                FROM payments p

                INNER JOIN users u
                    ON u.id = p.user_id

                LEFT JOIN subscriptions s
                    ON s.id = p.subscription_id

                LEFT JOIN plans pl
                    ON pl.id = s.plan_id

                ORDER BY p.created_at DESC

                LIMIT 10
            `)

        ]);


        res.json({
            success: true,

            statistics: {
                members: memberStats[0],
                payments: paymentStats[0],
                revenueByCurrency,
                subscriptions: subscriptionStats[0],
                memes: memeStats[0]
            },

            recentPayments

        });

    } catch (error) {

        console.error("Admin dashboard error:");
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to load admin dashboard."
        });
    }
}


async function getMembers(req, res) {
    try {
        const [members] = await pool.execute(`
            SELECT
                u.id,
                u.username,
                u.email,
                u.full_name,
                u.profile_image,
                u.role,
                u.status,
                u.email_verified,
                u.created_at,

                s.id AS subscription_id,
                s.status AS subscription_status,
                s.start_date,
                s.end_date,

                p.name AS plan_name

            FROM users u

            LEFT JOIN subscriptions s
                ON s.user_id = u.id
                AND s.id = (
                    SELECT s2.id
                    FROM subscriptions s2
                    WHERE s2.user_id = u.id
                    ORDER BY
                        CASE
                            WHEN s2.status = 'active'
                             AND s2.start_date <= NOW()
                             AND s2.end_date > NOW()
                            THEN 0
                            WHEN s2.status = 'active'
                             AND s2.end_date > NOW()
                            THEN 1
                            WHEN s2.status = 'cancelled'
                             AND s2.end_date > NOW()
                            THEN 2
                            WHEN s2.status = 'pending'
                            THEN 3
                            ELSE 4
                        END,
                        s2.end_date DESC,
                        s2.created_at DESC
                    LIMIT 1
                )

            LEFT JOIN plans p
                ON p.id = s.plan_id

            WHERE u.role = 'member'

            ORDER BY u.created_at DESC
        `);

        return res.json({
            success: true,
            members
        });

    } catch (error) {
        console.error("Get members error:");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to load members."
        });
    }
}


async function verifyMember(req, res) {
    const memberId = Number(req.params.id);

    if (!Number.isInteger(memberId) || memberId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid member ID."
        });
    }

    let connection;
    let transactionStarted = false;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;

        const [members] = await connection.execute(
            `
            SELECT id, username, email, full_name, role, status
            FROM users
            WHERE id = ?
            LIMIT 1
            FOR UPDATE
            `,
            [memberId]
        );

        if (members.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(404).json({
                success: false,
                message: "Member not found."
            });
        }

        const member = members[0];

        if (member.role !== "member") {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message: "This account is not a member account."
            });
        }

        if (member.status === "active") {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message: "This member is already active."
            });
        }

        await connection.execute(
            `
            UPDATE users
            SET status = 'active'
            WHERE id = ?
            `,
            [memberId]
        );

        await connection.execute(
            `
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                related_id
            )
            VALUES (?, 'account', 'Account Verified', ?, ?)
            `,
            [
                memberId,
                "Your Lilly Memes account has been verified. You can now use your member account.",
                memberId
            ]
        );

        await connection.execute(
            `
            INSERT INTO admin_logs (
                admin_id,
                action,
                description,
                ip_address
            )
            VALUES (?, 'member_verified', ?, ?)
            `,
            [
                req.session.user.id,
                `Verified member #${memberId} (${member.username})`,
                req.ip
            ]
        );

        await connection.commit();
        transactionStarted = false;

        return res.json({
            success: true,
            message: "Member verified successfully."
        });

    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Verify member rollback error:");
                console.error(rollbackError);
            }
        }

        console.error("Verify member error:");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to verify member."
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
}


async function rejectMember(req, res) {
    const memberId = Number(req.params.id);

    if (!Number.isInteger(memberId) || memberId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid member ID."
        });
    }

    let connection;
    let transactionStarted = false;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;

        const [members] = await connection.execute(
            `
            SELECT id, username, role, status
            FROM users
            WHERE id = ?
            LIMIT 1
            FOR UPDATE
            `,
            [memberId]
        );

        if (members.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(404).json({
                success: false,
                message: "Member not found."
            });
        }

        const member = members[0];

        if (member.role !== "member") {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message: "This account is not a member account."
            });
        }

        await connection.execute(
            `
            UPDATE users
            SET status = 'suspended'
            WHERE id = ?
            `,
            [memberId]
        );

        await connection.execute(
            `
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                related_id
            )
            VALUES (?, 'account', 'Account Verification Rejected', ?, ?)
            `,
            [
                memberId,
                "Your Lilly Memes account verification was not approved. Please contact the administrator.",
                memberId
            ]
        );

        await connection.execute(
            `
            INSERT INTO admin_logs (
                admin_id,
                action,
                description,
                ip_address
            )
            VALUES (?, 'member_rejected', ?, ?)
            `,
            [
                req.session.user.id,
                `Rejected member verification for #${memberId} (${member.username})`,
                req.ip
            ]
        );

        await connection.commit();
        transactionStarted = false;

        return res.json({
            success: true,
            message: "Member verification rejected."
        });

    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Reject member rollback error:");
                console.error(rollbackError);
            }
        }

        console.error("Reject member error:");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to reject member."
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
}


async function cancelMemberSubscription(req, res) {
    const memberId = Number(req.params.id);

    if (!Number.isInteger(memberId) || memberId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid member ID."
        });
    }

    let connection;
    let transactionStarted = false;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;

        const [members] = await connection.execute(
            `
            SELECT id, username, role
            FROM users
            WHERE id = ?
            LIMIT 1
            FOR UPDATE
            `,
            [memberId]
        );

        if (members.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(404).json({
                success: false,
                message: "Member not found."
            });
        }

        const member = members[0];

        if (member.role !== "member") {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message: "This account is not a member account."
            });
        }

        const [subscriptionResult] =
            await connection.execute(
                `
                UPDATE subscriptions
                SET status = 'cancelled'
                WHERE user_id = ?
                  AND status = 'active'
                  AND end_date > NOW()
                `,
                [memberId]
            );

        if (subscriptionResult.affectedRows === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message: "This member has no active subscription to cancel."
            });
        }

        await connection.execute(
            `
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                related_id
            )
            VALUES (?, 'subscription', 'Subscription Cancelled', ?, ?)
            `,
            [
                memberId,
                "Your subscription has been cancelled by an administrator, and access has ended.",
                memberId
            ]
        );

        await connection.execute(
            `
            INSERT INTO admin_logs (
                admin_id,
                action,
                description,
                ip_address
            )
            VALUES (?, 'subscription_cancelled', ?, ?)
            `,
            [
                req.session.user.id,
                `Cancelled ${subscriptionResult.affectedRows} active subscription(s) for member #${memberId} (${member.username}).`,
                req.ip
            ]
        );

        await connection.commit();
        transactionStarted = false;

        return res.json({
            success: true,
            message: "Member subscription cancelled."
        });

    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Cancel subscription rollback error:");
                console.error(rollbackError);
            }
        }

        console.error("Cancel member subscription error:");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to cancel member subscription."
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
}


async function reactivateMemberSubscription(req, res) {
    const memberId = Number(req.params.id);

    if (!Number.isInteger(memberId) || memberId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid member ID."
        });
    }

    let connection;
    let transactionStarted = false;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;

        const [members] = await connection.execute(
            `
            SELECT id, username, role
            FROM users
            WHERE id = ?
            LIMIT 1
            FOR UPDATE
            `,
            [memberId]
        );

        if (members.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(404).json({
                success: false,
                message: "Member not found."
            });
        }

        const member = members[0];

        if (member.role !== "member") {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message: "This account is not a member account."
            });
        }

        const [activeSubscriptions] =
            await connection.execute(
                `
                SELECT id
                FROM subscriptions
                WHERE user_id = ?
                  AND status = 'active'
                  AND start_date <= NOW()
                  AND end_date > NOW()
                LIMIT 1
                FOR UPDATE
                `,
                [memberId]
            );

        if (activeSubscriptions.length > 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message: "This member already has an active subscription."
            });
        }

        const [subscriptions] =
            await connection.execute(
                `
                SELECT id
                FROM subscriptions
                WHERE user_id = ?
                  AND status = 'cancelled'
                  AND end_date > NOW()
                ORDER BY end_date DESC, created_at DESC
                LIMIT 1
                FOR UPDATE
                `,
                [memberId]
            );

        if (subscriptions.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message: "No cancelled subscription remains within its original term."
            });
        }

        const subscriptionId =
            subscriptions[0].id;

        const [subscriptionResult] =
            await connection.execute(
                `
                UPDATE subscriptions
                SET status = 'active'
                WHERE id = ?
                  AND user_id = ?
                  AND status = 'cancelled'
                  AND end_date > NOW()
                `,
                [subscriptionId, memberId]
            );

        if (subscriptionResult.affectedRows !== 1) {
            throw new Error("Subscription status changed during reactivation.");
        }

        await connection.execute(
            `
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                related_id
            )
            VALUES (?, 'subscription', 'Subscription Reactivated', ?, ?)
            `,
            [
                memberId,
                "Your subscription has been reactivated. Access is restored until its original expiry date.",
                subscriptionId
            ]
        );

        await connection.execute(
            `
            INSERT INTO admin_logs (
                admin_id,
                action,
                description,
                ip_address
            )
            VALUES (?, 'subscription_reactivated', ?, ?)
            `,
            [
                req.session.user.id,
                `Reactivated subscription #${subscriptionId} for member #${memberId} (${member.username}).`,
                req.ip
            ]
        );

        await connection.commit();
        transactionStarted = false;

        return res.json({
            success: true,
            message: "Member subscription reactivated until its original expiry."
        });

    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Reactivate subscription rollback error:");
                console.error(rollbackError);
            }
        }

        console.error("Reactivate member subscription error:");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to reactivate member subscription."
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
}


async function extendMemberSubscription(req, res) {
    const memberId = Number(req.params.id);
    const days = Number(req.body && req.body.days);

    if (!Number.isInteger(memberId) || memberId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid member ID."
        });
    }

    if (!Number.isInteger(days) || days < 1 || days > 3650) {
        return res.status(400).json({
            success: false,
            message: "Extension must be between 1 and 3650 whole days."
        });
    }

    let connection;
    let transactionStarted = false;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;

        const [members] = await connection.execute(
            `
            SELECT id, username, role
            FROM users
            WHERE id = ?
            LIMIT 1
            FOR UPDATE
            `,
            [memberId]
        );

        if (members.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(404).json({
                success: false,
                message: "Member not found."
            });
        }

        const member = members[0];

        if (member.role !== "member") {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message: "This account is not a member account."
            });
        }

        const [subscriptions] =
            await connection.execute(
                `
                SELECT id
                FROM subscriptions
                WHERE user_id = ?
                  AND status = 'active'
                  AND end_date > NOW()
                ORDER BY end_date DESC, created_at DESC
                LIMIT 1
                FOR UPDATE
                `,
                [memberId]
            );

        if (subscriptions.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message: "This member has no active subscription to extend."
            });
        }

        const subscriptionId =
            subscriptions[0].id;

        const [subscriptionResult] =
            await connection.execute(
                `
                UPDATE subscriptions
                SET end_date = DATE_ADD(end_date, INTERVAL ? DAY)
                WHERE id = ?
                  AND user_id = ?
                  AND status = 'active'
                  AND end_date > NOW()
                `,
                [days, subscriptionId, memberId]
            );

        if (subscriptionResult.affectedRows !== 1) {
            throw new Error("Subscription changed during extension.");
        }

        await connection.execute(
            `
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                related_id
            )
            VALUES (?, 'subscription', 'Subscription Extended', ?, ?)
            `,
            [
                memberId,
                `Your subscription has been extended by ${days} day${days === 1 ? "" : "s"}.`,
                subscriptionId
            ]
        );

        await connection.execute(
            `
            INSERT INTO admin_logs (
                admin_id,
                action,
                description,
                ip_address
            )
            VALUES (?, 'subscription_extended', ?, ?)
            `,
            [
                req.session.user.id,
                `Extended subscription #${subscriptionId} for member #${memberId} (${member.username}) by ${days} day${days === 1 ? "" : "s"}.`,
                req.ip
            ]
        );

        await connection.commit();
        transactionStarted = false;

        return res.json({
            success: true,
            message: `Member subscription extended by ${days} day${days === 1 ? "" : "s"}.`
        });

    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Extend subscription rollback error:");
                console.error(rollbackError);
            }
        }

        console.error("Extend member subscription error:");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to extend member subscription."
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
}


module.exports = {
    getDashboard,
    getMembers,
    verifyMember,
    rejectMember,
    cancelMemberSubscription,
    reactivateMemberSubscription,
    extendMemberSubscription
};
