// filepath: backend/models/Cancellation.js
const mongoose = require("mongoose");

const cancellationSchema = new mongoose.Schema(
  {
    custmer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Custmer",
      required: true,
    },
    booking_id: {
      type: String, // Can be package or bus booking ID
      required: true,
    },
    booking_type: {
      type: String,
      enum: ["Package", "Bus"],
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
