const express = require("express");

const requireLogin =
    require("../middleware/requireLogin");

const {
    getPlans,
    getCurrentSubscription,
    getSubscriptionHistory,
    getSubscriptionById,
    subscribe
} = require("../controllers/subscriptionController");

const router = express.Router();


/*
    Public:
    Anyone can view the available plans.
*/
router.get(
    "/plans",
    getPlans
);


/*
    Logged-in user:
    View current subscription.
*/
router.get(
    "/current",
    requireLogin,
    getCurrentSubscription
);


/*
    Logged-in user:
    View subscription history.
*/
router.get(
    "/history",
    requireLogin,
    getSubscriptionHistory
);
router.get(
    "/:id",
    requireLogin,
    getSubscriptionById
);


/*
    Logged-in user:
    Start a subscription.
*/
router.post(
    "/subscribe",
    requireLogin,
    subscribe
);


module.exports = router;