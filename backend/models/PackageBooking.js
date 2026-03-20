const mongoose = require("mongoose");
const Custmer = require("./Custmer");
const Package = require("./Package");

const packageBookingSchema = new mongoose.Schema(
  {
    Package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },
    Custmer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Custmer",
      required: true,
    },
    travellers: {
      type: Number,
      default: 1,
    },

    seat_numbers: {
      type: [String],
      default: [],
    },

    seat_price_details: {
      type: [
        {
          seat_number: String,
          age: Number,
          base_fare: Number,
          seat_surcharge: Number,
          final_fare: Number,
        },
      ],
      default: [],
    },

    price_per_person: {
      type: Number,
      required: true,
    },
    total_amount: {
      type: Number,
    },
    booking_date: {
      type: Date,
      default: Date.now,
    },
    other_travelers: {
      type: [String],
    },
    booking_status: {
      type: String,
      default: "Active",
    },
    feedback_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Feedback",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PackageBooking", packageBookingSchema);
