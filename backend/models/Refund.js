const mongoose = require("mongoose");

const refundSchema = new mongoose.Schema(
  {
    refund_id: {
      type: String,
      unique: true,
    },
    cancellation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cancellation",
      required: true,
    },
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
      required: true,
    },
    refund_mode: {
      type: String,
      enum: ["Online", "Bank Transfer", "Original Payment Method"],
      default: "Online",
    },
    refund_date: {
      type: Date,
    },
    refund_status: {
      type: String,
      enum: ["Initiated", "Processing", "Completed", "Failed"],
      default: "Initiated",
    },
    transaction_id: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Refund", refundSchema);
