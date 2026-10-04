const express = require("express");

const router = express.Router();

const requireAdmin =
    require("../middleware/requireAdmin");

const {
    getDashboard,
    getMembers,
    verifyMember,
    rejectMember,
    cancelMemberSubscription,
    reactivateMemberSubscription,
    extendMemberSubscription
} = require("../controllers/adminController");


/* =========================================
   ADMIN DASHBOARD
========================================= */

router.get(
    "/dashboard",
    requireAdmin,
    getDashboard
);


router.get(
    "/members",
    requireAdmin,
    getMembers
);

router.put(
    "/members/:id/verify",
    requireAdmin,
    verifyMember
);

router.put(
    "/members/:id/reject",
    requireAdmin,
    rejectMember
);

router.put(
    "/members/:id/cancel-subscription",
    requireAdmin,
    cancelMemberSubscription
);

router.put(
    "/members/:id/reactivate-subscription",
    requireAdmin,
    reactivateMemberSubscription
);

router.put(
    "/members/:id/extend-subscription",
    requireAdmin,
    extendMemberSubscription
);


module.exports = router;
