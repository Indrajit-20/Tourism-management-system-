const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    // Customer who gave feedback
    custmer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Custmer",
      required: true,
    },

    // LINKED TO PACKAGE MASTER — so all departures show same reviews
    package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },

    // Optional: which departure they travelled on (for reference/data)
    tour_schedule_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TourSchedule",
    },

    // Booking reference
    package_booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PackageBooking",
      required: true,
    },
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PackageBooking",
    },
    departure_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TourSchedule",
    },
    bus_booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusTicketBooking",
    },

    // Rating & Review
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    review_text: {
      type: String,
      required: true,
    },

    // Additional ratings (per guide)
    hotel_rating: { type: Number, min: 1, max: 5 },
    service_rating: { type: Number, min: 1, max: 5 },

    // Images
    images: [String],

    // Publication status
    is_published: { type: Boolean, default: true },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
