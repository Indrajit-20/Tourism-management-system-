const express = require("express");
const router = express.Router();
const { authMiddleware, isadmin } = require("../middleware/authmiddleware");
const {
  createSchedule,
  getSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
} = require("../controllers/busScheduleController");

// Admin routes for schedule management
router.post("/", authMiddleware, isadmin, createSchedule);
router.get("/", getSchedules);
router.get("/:id", getScheduleById);
router.put("/:id", authMiddleware, isadmin, updateSchedule);
router.delete("/:id", authMiddleware, isadmin, deleteSchedule);

module.exports = router;
