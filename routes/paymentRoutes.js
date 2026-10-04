
const express = require("express");

const requireLogin =
    require("../middleware/requireLogin");

const {
    submitPayment,
    getPaymentHistory
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


module.exports = router;
