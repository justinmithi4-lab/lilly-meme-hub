const express = require("express");

const {
    getNotifications,
    getUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead
} = require("../controllers/notificationController");

const requireLogin = require("../middleware/requireLogin");

const router = express.Router();

router.get("/", requireLogin, getNotifications);

router.get("/unread-count", requireLogin, getUnreadCount);

router.put("/read-all", requireLogin, markAllNotificationsAsRead);

router.put("/:id/read", requireLogin, markNotificationAsRead);

module.exports = router;