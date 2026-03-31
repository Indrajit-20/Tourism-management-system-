const express = require("express");
const { authMiddleware, isadmin } = require("../middleware/authmiddleware");
const router = express.Router();
const {
  bookBusTicket,
  getAllBookings,
  updateBookingStatus,
  getBookedSeats,
  confirmPayment,
  getMyBookings,
  cancelBooking, // ✅ NEW
} = require("../controllers/busBookingController");

// 1. Book a Bus Ticket (Customer Only)
router.post("/book", authMiddleware, bookBusTicket);

// 2. Confirm Payment after Razorpay success
router.post("/confirm-payment", authMiddleware, confirmPayment);

// 3. ✅ NEW: Cancel booking (Customer Only)
router.post("/cancel/:id", authMiddleware, cancelBooking);

// 4. Cancel unpaid booking if payment fails
router.post("/cancel-unpaid", authMiddleware);

// 5. Get user's own bookings
router.get("/my-bookings", authMiddleware, getMyBookings);

// 6. Get All Bookings (Admin Only)
router.get("/all", authMiddleware, isadmin, getAllBookings);

// 7. Update Booking Status (Admin Only: Cancelled)
router.put("/status/:id", authMiddleware, isadmin, updateBookingStatus);

// 8. Get Booked Seats (Public)
router.get("/seats", getBookedSeats);

module.exports = router;
