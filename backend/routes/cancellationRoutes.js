// filepath: backend/routes/cancellationRoutes.js
const express = require("express");
const router = express.Router();
const { authMiddleware, isadmin } = require("../middleware/authmiddleware");
const {
  cancelBooking,
  getAllCancellations,
  markRefundDone,
  getMyCancellations,
} = require("../controllers/cancellationController");

// User cancels booking
router.post("/cancel", authMiddleware, cancelBooking);

// User: Get their own cancellations
router.get("/my-cancellations", authMiddleware, getMyCancellations);

// Admin: Get all cancellations
router.get("/admin/all", authMiddleware, isadmin, getAllCancellations);

// Admin: Mark refund done
router.put("/admin/mark-done/:id", authMiddleware, isadmin, markRefundDone);

module.exports = router;
