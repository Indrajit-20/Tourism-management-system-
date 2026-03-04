const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoice_number: {
      type: String,
      unique: true,
    },
    custmer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Custmer",
      required: true,
    },
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    booking_type: {
      type: String,
      enum: ["Package", "Bus"],
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
    bus_details: {
      type: String,
    },

    // For Package bookings
    package_duration: {
      type: String,
    },

    // Payment Info
    amount: {
      type: Number,
      required: true,
    },
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
