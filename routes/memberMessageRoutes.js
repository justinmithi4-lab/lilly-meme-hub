const express = require("express");
const requireAdmin = require("../middleware/requireAdmin");
const requireMember = require("../middleware/requireMember");
const {
    getMemberMessages,
    sendMessage
} = require("../controllers/memberMessageController");

const router = express.Router();

router.post("/", requireMember, sendMessage);
router.get("/admin", requireAdmin, getMemberMessages);

module.exports = router;
