const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoice_number: {
      type: String,
      unique: true,
      required: true,
    },
    custmer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Custmer",
      required: true,
    },
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "booking_type",
      required: true,
    },
    booking_type: {
      type: String,
      enum: ["PackageBooking", "BusTicketBooking"],
      required: true,
    },

    // Booking Details
    description: {
      type: String,
      required: true,
    },
    booking_date: {
      type: Date,
    },
    travel_date: {
      type: Date,
    },
    travellers: {
      type: Number,
      default: 1,
    },

    // For Bus bookings
    seat_numbers: {
      type: [String],
    },

    // Financial Breakdown
    base_fare: {
      type: Number,
      default: 0,
    },
    child_discount: {
      type: Number,
      default: 0,
    },
    amount: {
      type: Number,
      required: true,
    },

    // Payment Info
    payment_method: {
      type: String,
      default: "Online (Razorpay)",
    },
    transaction_id: {
      type: String,
    },

    status: {
      type: String,
      enum: ["Pending", "Paid", "Refunded"],
      default: "Paid",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);