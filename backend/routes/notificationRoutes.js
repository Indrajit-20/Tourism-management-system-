const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authmiddleware");
const {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../controllers/notificationController");

router.get("/my", authMiddleware, getMyNotifications);
router.put("/:id/read", authMiddleware, markNotificationRead);
router.put("/mark-all-read", authMiddleware, markAllNotificationsRead);

module.exports = router;
