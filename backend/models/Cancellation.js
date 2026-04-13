// filepath: backend/models/Cancellation.js
const mongoose = require("mongoose");

const cancellationSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Custmer",
      required: true,
    },
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "booking_type", // Use refPath for polymorphic references
      required: true,
    },
    booking_type: {
      type: String,
      enum: ["PackageBooking", "BusTicketBooking"],
      required: true,
    },
    refund_amount: {
      type: Number,
      required: true, // 100% of original amount
    },
    cancellation_reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Cancelled", "Refund Done"],
      default: "Cancelled",
    },
    cancelled_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cancellation", cancellationSchema);
