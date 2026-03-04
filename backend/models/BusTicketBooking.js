const mongoose = require("mongoose");

const busBookingSchema = new mongoose.Schema(
  {
    route_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusRoute",
      required: true,
    },

    custmer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Custmer",
      required: true,
    },

    travel_date: { type: Date, required: true },
    seat_numbers: { type: [String], required: true }, // e.g. ["1A", "1B"]
    travellers: { type: Number, required: true },
    price_per_seat: { type: Number, required: true },
    total_amount: { type: Number, required: true },
    booking_status: { type: String, default: "Confirmed" },
    status: { type: String, default: "Active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BusTicketBooking", busBookingSchema);
