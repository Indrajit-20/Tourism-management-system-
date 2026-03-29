const Notification = require("../models/Notification");

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unread_count = notifications.filter((item) => !item.is_read).length;
    res.status(200).json({ notifications, unread_count });
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications", error: error.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user_id: req.user.id },
      { $set: { is_read: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json({ message: "Notification marked as read", notification });
  } catch (error) {
    return res.status(500).json({ message: "Error updating notification", error: error.message });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user_id: req.user.id, is_read: false },
      { $set: { is_read: true } }
    );

    return res.status(200).json({
      message: "All notifications marked as read",
      modified: result.modifiedCount || 0,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error updating notifications", error: error.message });
  }
};

module.exports = {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
