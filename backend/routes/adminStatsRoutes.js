const express = require("express");
const router = express.Router();
const adminStatsController = require("../controllers/adminStatsController");

router.get("/dashboard-stats", adminStatsController.getDashboardStats);

module.exports = router;
