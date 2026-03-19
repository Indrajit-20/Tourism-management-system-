const express = require("express");
const router = express.Router();
const { authMiddleware, isadmin } = require("../middleware/authmiddleware");
const {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
} = require("../controllers/busTripController");

// Admin routes
router.post("/", authMiddleware, isadmin, createTrip);
router.get("/", getTrips); // Public route (customers can view trips)
router.get("/:id", getTripById);
router.put("/:id", authMiddleware, isadmin, updateTrip);
router.delete("/:id", authMiddleware, isadmin, deleteTrip);

module.exports = router;
