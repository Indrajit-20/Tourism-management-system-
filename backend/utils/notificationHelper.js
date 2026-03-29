const Notification = require("../models/Notification");

const createNotification = async ({ userId, title, message, type = "system", meta = {} }) => {
  if (!userId || !title || !message) return null;

  try {
    return await Notification.create({
      user_id: userId,
      title,
      message,
      type,
      meta,
    });
  } catch (error) {
    console.error("Notification create failed:", error.message);
    return null;
  }
};

module.exports = {
  createNotification,
};
