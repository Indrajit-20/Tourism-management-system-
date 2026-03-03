const express = require("express");
const router = express.Router();

const {
  packageBooking,
  getAllPackageBookings,
  updatePackageBookingStatus,
} = require("../controllers/tourbookingController");
const { authMiddleware, isadmin } = require("../middleware/authmiddleware");

// User routes
router.post("/book", authMiddleware, packageBooking);

// Admin routes
router.get("/all", authMiddleware, isadmin, getAllPackageBookings);
router.put( "/update-status/:id", authMiddleware,isadmin,updatePackageBookingStatus);

module.exports = router;
