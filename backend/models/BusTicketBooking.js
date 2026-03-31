const mongoose = require("mongoose");

const busBookingSchema = new mongoose.Schema(
  {
    route_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusRoute",
    },

    trip_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusTrip",
      required: true,
    },

    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Custmer",
      required: true,
    },

    travel_date: { type: Date, required: true },

    // Each seat stores its own price (dynamic pricing)
    seat_numbers: { type: [String], required: true },

    // Store price per seat as array matching seat_numbers
    seat_prices: { type: [Number], default: [] },

    travellers: { type: Number, required: true },
    price_per_seat: { type: Number, required: true }, // average price
    total_amount: { type: Number, required: true },

    booking_status: {
      type: String,
      enum: ["Confirmed", "Cancelled"],
      default: "Confirmed",
    },

    cancellation_reason: {
      type: String,
      default: null,
      trim: true,
    },

    payment_status: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    payment_deadline: {
      type: Date,
      default: null,
    },

    payment_id: {
      type: String,
      default: null,
    },

    status: { type: String, default: "Active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BusTicketBooking", busBookingSchema);
