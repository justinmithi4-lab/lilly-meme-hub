
const express = require("express");

const requireLogin =
    require("../middleware/requireLogin");

const requireAdmin =
    require("../middleware/requireAdmin");

const {
    submitPayment,
    getPaymentHistory,
    getSubscriptionPaymentStatus,
    getAdminPayments,
    getAdminPaymentById,
    approvePayment,
    rejectPayment
} = require("../controllers/paymentController");

const router = express.Router();


/*
    Submit a payment
*/
router.post(
    "/",
    requireLogin,
    submitPayment
);


/*
    Get logged-in user's payment history
*/
router.get(
    "/history",
    requireLogin,
    getPaymentHistory
);

router.get(
    "/subscription/:subscriptionId/status",
    requireLogin,
    getSubscriptionPaymentStatus
);

/*
    Admin payment listing and detail
*/
router.get(
    "/admin",
    requireAdmin,
    getAdminPayments
);

router.get(
    "/admin/:id",
    requireAdmin,
    getAdminPaymentById
);

router.put(
    "/admin/:id/approve",
    requireAdmin,
    approvePayment
);

router.put(
    "/admin/:id/reject",
    requireAdmin,
    rejectPayment
);


module.exports = router;
