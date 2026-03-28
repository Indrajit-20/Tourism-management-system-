// filepath: backend/routes/feedbackRoutes.js
const express = require("express");
const router = express.Router();
const { authMiddleware, isadmin } = require("../middleware/authmiddleware");
const {
  submitFeedback,
  getFeedbackByPackage,
  getFeedbackByRoute,
  getPackageRating,
  getRouteRating,
  getAllFeedback,
} = require("../controllers/feedbackController");

// 1. Submit Feedback (Logged-in user)
router.post("/submit", authMiddleware, submitFeedback);

// 2. Get Feedback for Package (Public)
router.get("/package/:package_id", getFeedbackByPackage);

// 3. Get Feedback for Route (Public)
router.get("/route/:route_id", getFeedbackByRoute);

// 4. Get Average Rating for Package (Public)
router.get("/rating/package/:package_id", getPackageRating);

// 5. Get Average Rating for Route (Public)
router.get("/rating/route/:route_id", getRouteRating);

// 6. Get All Feedback (Admin Only)
router.get("/admin/all", authMiddleware, isadmin, getAllFeedback);

module.exports = router;
