const express = require("express");
const { authMiddleware } = require("../middleware/authmiddleware");
const {
  getStaffDashboard,
  getTripDetails,
  getTourDetails, // ✅ Newly added
  updateTripStatus,
  getStaffSchedule,
} = require("../controllers/staffDashboardController");

const router = express.Router();

// ✅ 1. Get Staff Dashboard (assigned trips + schedule)
router.get("/dashboard", authMiddleware, getStaffDashboard);

// ✅ 2. Get Specific Trip Details with Passengers
router.get("/trip/:trip_id", authMiddleware, getTripDetails);

// ✅ NEW: Get Specific Tour Details with Tourists & Hotels
router.get("/tour/:tour_id", authMiddleware, getTourDetails);

// ✅ 3. Update Trip Status (Scheduled → Running → Completed)
router.put("/trip/:trip_id/status", authMiddleware, updateTripStatus);

// ✅ 4. Get Weekly Schedule
router.get("/schedule", authMiddleware, getStaffSchedule);

module.exports = router;
