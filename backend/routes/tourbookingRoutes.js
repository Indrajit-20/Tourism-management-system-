const express = require("express");
const router = express.Router();

const {
  packageBooking,
  getPackageBookedSeats,
  getAllPackageBookings,
  updatePackageBookingStatus,
  getMyBookings,
  confirmPackagePayment,
} = require("../controllers/tourbookingController");
const { authMiddleware, isadmin } = require("../middleware/authmiddleware");

// User routes
router.get("/package-seats/:package_id", getPackageBookedSeats);
router.post("/book", authMiddleware, packageBooking);
router.post("/confirm-payment", authMiddleware, confirmPackagePayment);
router.get("/my-bookings", authMiddleware, getMyBookings);

// Admin routes
router.get("/all", authMiddleware, isadmin, getAllPackageBookings);
router.put(
  "/update-status/:id",
  authMiddleware,
  isadmin,
  updatePackageBookingStatus
);

module.exports = router;
