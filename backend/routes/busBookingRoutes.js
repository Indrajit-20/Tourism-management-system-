const express = require("express");
const { authMiddleware, isadmin } = require("../middleware/authmiddleware");
const router = express.Router();
const {
  bookBusTicket,
  getAllBookings,
  updateBookingStatus,
  getBookedSeats,
  confirmPayment,
  cancelUnpaidBooking,
  getMyBookings,
} = require("../controllers/busBookingController");

// 1. Book a Bus Ticket (Customer Only)
router.post("/book", authMiddleware, bookBusTicket);

// 2. Confirm Payment after Razorpay success
router.post("/confirm-payment", authMiddleware, confirmPayment);

// 3. Cancel unpaid booking if payment fails
router.post("/cancel-unpaid", authMiddleware, cancelUnpaidBooking);

// 4. Get user's own bookings
router.get("/my-bookings", authMiddleware, getMyBookings);

// 5. Get All Bookings (Admin Only)
router.get("/all", authMiddleware, isadmin, getAllBookings);

// 6. Approve/Reject Booking (Admin Only)
router.put("/status/:id", authMiddleware, isadmin, updateBookingStatus);

// 7. Get Booked Seats (Public)
router.get("/seats", getBookedSeats); 

module.exports = router;
