const express = require("express");
const { authMiddleware } = require("../middleware/authmiddleware");
const { generateTicketPDF } = require("../controllers/ticketController");

const router = express.Router();

// Generate and download ticket
// GET /api/tickets/:booking_id/download
router.get("/:booking_id/download", authMiddleware, generateTicketPDF);

module.exports = router;
