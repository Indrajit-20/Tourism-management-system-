const express = require("express");
const router = express.Router();
const { authMiddleware, isadmin } = require("../middleware/authmiddleware");
const {
  createInvoice,
  getMyInvoices,
  getInvoiceById,
  getAllInvoices,
  downloadInvoice,
  markAsRefunded,
} = require("../controllers/invoiceController");

// Admin routes (must be before /:id)
router.get("/admin/all", authMiddleware, isadmin, getAllInvoices);
router.put("/admin/mark-refunded", authMiddleware, isadmin, markAsRefunded);

// User routes
router.post("/create", authMiddleware, createInvoice);
router.get("/my-invoices", authMiddleware, getMyInvoices);
router.get("/:id/download", authMiddleware, downloadInvoice);
router.get("/:id", authMiddleware, getInvoiceById);

module.exports = router;
