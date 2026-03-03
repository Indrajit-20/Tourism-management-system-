// filepath: backend/controllers/feedbackController.js
const Feedback = require("../models/Feedback");

// 1. Submit Feedback (Customer after booking)
const submitFeedback = async (req, res) => {
  try {
    const { rating, review_text, package_booking_id, bus_booking_id, package_id, route_id } = req.body;
    const custmer_id = req.user.id; // From token

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1-5" });
    }

    if (!review_text || review_text.trim() === "") {
      return res.status(400).json({ message: "Review text is required" });
    }

    // Create feedback
    const feedback = new Feedback({
      custmer_id,
      package_booking_id: package_booking_id || null,
      bus_booking_id: bus_booking_id || null,
      package_id: package_id || null,
      route_id: route_id || null,
      rating,
      review_text,
    });

    await feedback.save();

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback,
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({
      message: "Error submitting feedback",
      error: error.message,
    });
  }
};

// 2. Get All Feedback for a Package
const getFeedbackByPackage = async (req, res) => {
  try {
    const { package_id } = req.params;

    const feedback = await Feedback.find({ package_id })
      .populate("custmer_id", "first_name last_name email")
      .sort({ createdAt: -1 });

    res.status(200).json(feedback);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching feedback",
      error: error.message,
    });
  }
};

// 3. Get All Feedback for a Bus Route
const getFeedbackByRoute = async (req, res) => {
  try {
    const { route_id } = req.params;

    const feedback = await Feedback.find({ route_id })
      .populate("custmer_id", "first_name last_name email")
      .sort({ createdAt: -1 });

    res.status(200).json(feedback);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching feedback",
      error: error.message,
    });
  }
};

// 4. Get Average Rating for a Package
const getPackageRating = async (req, res) => {
  try {
    const { package_id } = req.params;

    const feedback = await Feedback.find({ package_id });

    if (feedback.length === 0) {
      return res.status(200).json({
        average_rating: 0,
        total_reviews: 0,
      });
    }

    const total = feedback.reduce((sum, f) => sum + f.rating, 0);
    const average = (total / feedback.length).toFixed(1);

    res.status(200).json({
      average_rating: parseFloat(average),
      total_reviews: feedback.length,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching rating",
      error: error.message,
    });
  }
};

// 5. Get Average Rating for a Route
const getRouteRating = async (req, res) => {
  try {
    const { route_id } = req.params;

    const feedback = await Feedback.find({ route_id });

    if (feedback.length === 0) {
      return res.status(200).json({
        average_rating: 0,
        total_reviews: 0,
      });
    }

    const total = feedback.reduce((sum, f) => sum + f.rating, 0);
    const average = (total / feedback.length).toFixed(1);

    res.status(200).json({
      average_rating: parseFloat(average),
      total_reviews: feedback.length,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching rating",
      error: error.message,
    });
  }
};

// 6. Get All Feedback (Admin View)
const getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate("custmer_id", "first_name last_name email")
      .populate("package_id", "package_name")
      .populate("route_id", "boarding_from destination")
      .sort({ createdAt: -1 });

    res.status(200).json(feedback);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching feedback",
      error: error.message,
    });
  }
};

// 7. Delete Feedback (Admin Only)
const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Feedback.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    res.status(200).json({ message: "Feedback deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting feedback",
      error: error.message,
    });
  }
};

module.exports = {
  submitFeedback,
  getFeedbackByPackage,
  getFeedbackByRoute,
  getPackageRating,
  getRouteRating,
  getAllFeedback,
  deleteFeedback,
};
