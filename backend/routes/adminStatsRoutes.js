const express = require("express");
const router = express.Router();
const adminStatsController = require("../controllers/adminStatsController");
const { authMiddleware, isadmin } = require("../middleware/authmiddleware");

router.get("/dashboard-stats", authMiddleware, isadmin, adminStatsController.getDashboardStats);

module.exports = router;
