const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    // Customer who gave feedback
    custmer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Custmer",
      required: true,
    },

    // Booking reference (can be package or bus booking)
    package_booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PackageBooking",
    },
    bus_booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusTicketBooking",
    },

    // What they're reviewing (optional for categorization)
    package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
    },
    route_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusRoute",
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

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
