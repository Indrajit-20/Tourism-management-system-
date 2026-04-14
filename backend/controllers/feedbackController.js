// filepath: backend/controllers/feedbackController.js
const Feedback = require("../models/Feedback");
const Package = require("../models/Package");
const PackageBooking = require("../models/PackageBooking");
const BusTicketBooking = require("../models/BusTicketBooking");
const TourSchedule = require("../models/TourSchedule");

// 1. Submit Feedback (Customer after booking)
const submitFeedback = async (req, res) => {
  try {
    const {
      rating,
      review_text,
      package_booking_id,
      bus_booking_id,
      package_id,
      route_id: routeIdFromReq,
    } = req.body;
    const custmer_id = req.user.id; // From token

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1-5" });
    }

    if (!review_text || review_text.trim() === "") {
      return res.status(400).json({ message: "Review text is required" });
    }

    // Step 1: Identify package/route being reviewed.
    let targetPackageId = package_id || null;
    let route_id = routeIdFromReq || null;
    let effectivePackageBookingId = package_booking_id || null;
    let effectiveDepartureId = null;
    let isRouteFeedback = false;

    if (package_booking_id) {
      const booking = await PackageBooking.findById(package_booking_id);
      if (!booking) {
        return res.status(404).json({ message: "Package booking not found" });
      }
      if (String(booking.customer_id) !== String(custmer_id)) {
        return res
          .status(403)
          .json({ message: "You can review only your own booking" });
      }
      targetPackageId = booking.package_id;
      effectivePackageBookingId = booking._id;
      effectiveDepartureId = booking.tour_schedule_id || null;
    }

    if (!targetPackageId) {
      if (!route_id && bus_booking_id) {
        const busBooking = await BusTicketBooking.findById(
          bus_booking_id
        ).populate({
          path: "trip_id",
          populate: { path: "schedule_id", populate: { path: "route_id" } },
        });
        if (!busBooking) {
          return res.status(404).json({ message: "Bus booking not found" });
        }
        route_id = busBooking.trip_id?.schedule_id?.route_id?._id || null;
      }

      if (!route_id) {
        return res.status(400).json({
          message:
            "Either package booking or bus route information should be provided",
        });
      }
      isRouteFeedback = true;
    }

    // Step 2: For package reviews, ensure booked user + completed tour schedule.
    if (targetPackageId) {
      const bookingDoc = await PackageBooking.findById(
        effectivePackageBookingId
      );
      if (!bookingDoc) {
        return res
          .status(404)
          .json({ message: "Package booking not found for rating" });
      }

      const schedule = bookingDoc.tour_schedule_id
        ? await TourSchedule.findById(
            bookingDoc.tour_schedule_id,
            "departure_status end_date"
          )
        : null;

      const isCompletedSchedule =
        schedule &&
        (schedule.departure_status === "Completed" ||
          (schedule.end_date && new Date(schedule.end_date) < new Date()));

      if (!isCompletedSchedule) {
        return res.status(400).json({
          message:
            "You can submit or update review only after tour is completed",
        });
      }

      if (bookingDoc.review_submitted) {
        const existingFeedback = await Feedback.findOne({
          package_booking_id: bookingDoc._id,
        }).lean();
        if (existingFeedback) {
          return res.status(400).json({
            message: "You have already submitted a review for this booking",
          });
        }
      }
    }

    // Step 3: Upsert review so customer can update later.
    const filter = targetPackageId
      ? { package_booking_id: effectivePackageBookingId }
      : { custmer_id, route_id };

    const feedback = await Feedback.findOneAndUpdate(
      filter,
      {
        $set: {
          package_booking_id: effectivePackageBookingId,
          booking_id: effectivePackageBookingId,
          departure_id: effectiveDepartureId,
          bus_booking_id: bus_booking_id || null,
          package_id: targetPackageId || null,
          route_id: route_id || null,
          rating,
          review_text,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (feedback?.package_booking_id) {
      await PackageBooking.findByIdAndUpdate(feedback.package_booking_id, {
        $set: {
          review_submitted: true,
          feedback_id: feedback._id,
          review_id: feedback._id,
        },
      });
    }

    return res.status(201).json({
      message: "Feedback saved successfully",
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
