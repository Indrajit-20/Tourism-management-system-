const express = require("express");
const router = express.Router();
const { authMiddleware, isadmin } = require("../middleware/authmiddleware");
const {
  getAllRefunds,
  getMyRefunds,
  createRefund,
} = require("../controllers/refundController");

// Admin: Get all refunds
router.get("/all", authMiddleware, isadmin, getAllRefunds);

// User: Get my refunds
router.get("/my-refunds", authMiddleware, getMyRefunds);

// Admin: Create refund record
router.post("/create", authMiddleware, isadmin, createRefund);

module.exports = router;
