// filepath: backend/routes/cancellationRoutes.js
const express = require("express");
const router = express.Router();
const { authMiddleware, isadmin } = require("../middleware/authmiddleware");
const {
  getPackageCancellationPreview,
  cancelBooking,
  getAllCancellations,
  processRefund,
  markRefundDone,
  getMyCancellations,
} = require("../controllers/cancellationController");

// User cancels booking
router.post("/preview", authMiddleware, getPackageCancellationPreview);
router.post("/cancel", authMiddleware, cancelBooking);

// User: Get their own cancellations
router.get("/my-cancellations", authMiddleware, getMyCancellations);

// Admin: Get all cancellations
router.get("/admin/all", authMiddleware, isadmin, getAllCancellations);

// ✅ Admin: Process refund (manually enter amount and mark done)
router.put("/admin/process-refund/:id", authMiddleware, isadmin, processRefund);

// Admin: Mark refund as done (deprecated)
router.put("/admin/mark-done/:id", authMiddleware, isadmin, markRefundDone);

module.exports = router;
