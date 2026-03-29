const express = require("express");
const router = express.Router();
const { authMiddleware, isadmin } = require("../middleware/authmiddleware");

const {
  createTourDeparture,
  getAllDepartures,
  getPackageDepartures,
  getTourDeparture,
  updateTourDeparture,
  openDeparture,
  lockDeparture,
  deleteTourSchedule,
  getDepartureSeats,
} = require("../controllers/tourScheduleController");

// Admin routes - manage departures
router.post("/", authMiddleware, isadmin, createTourDeparture);
router.get("/", authMiddleware, isadmin, getAllDepartures);
router.get("/:id", getTourDeparture); // Public - get single departure
router.get("/:id/seats", getDepartureSeats); // Public - get seat status
router.put("/:id", authMiddleware, isadmin, updateTourDeparture);
router.delete("/:id", authMiddleware, isadmin, deleteTourSchedule);
router.post("/:id/open", authMiddleware, isadmin, openDeparture);
router.post("/:id/lock", authMiddleware, isadmin, lockDeparture);

// Package routes - get departures for a package
router.get("/package/:package_id/departures", getPackageDepartures);
router.get("/package/:package_id/schedules", getPackageDepartures);

module.exports = router;
