const mongoose = require("mongoose");
const Custmer = require("./Custmer");
const Package = require("./Package");

const packageBookingSchema = new mongoose.Schema(
  {
    // Link to Package Master (template)
    package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },

    // Link to specific TourSchedule (departure)
    tour_schedule_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TourSchedule",
    },

    // Customer
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Custmer",
      required: true,
    },

    // Passenger count
    travellers: {
      type: Number,
      default: 1,
    },

    // Selected seats
    seat_numbers: {
      type: [String],
      default: [],
    },

    // Pickup location chosen by customer from package boarding points
    pickup_location: {
      type: String,
    },

    // Price breakdown per seat
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

    // Pricing (snapshot at booking time - never changes)
    price_per_person: {
      type: Number,
      required: true,
    },
    total_amount: {
      type: Number,
    },

    // Booking dates
    booking_date: {
      type: Date,
      default: Date.now,
    },

    // Passenger list (backward compat)
    other_travelers: {
      type: [String],
    },

    // BOOKING STATUS — per guide:
    // pending → awaiting admin approval (48hr deadline)
    // approved → admin approved, awaiting payment (24hr deadline)
    // confirmed → payment received, booking locked
    // completed → travel date passed
    // cancelled → user or admin cancelled
    booking_status: {
      type: String,
      enum: ["pending", "approved", "rejected", "confirmed", "completed", "cancelled"],
      default: "pending",
    },

    // PAYMENT STATUS
    payment_status: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },

    // Razorpay fields
    razorpay_order_id: { type: String },
    razorpay_payment_id: { type: String },

    // Time limits (per guide)
    approval_deadline: { type: Date },
    payment_deadline: { type: Date },

    // Admin fields
    admin_note: { type: String },
    approved_at: { type: Date },
    rejected_at: { type: Date },

    // Cancellation fields
    cancelled_by: { type: String, enum: ["customer", "admin", "system"] },
    cancellation_reason: { type: String },
    cancelled_at: { type: Date },

    // Refund fields
    refund_amount: { type: Number, default: 0 },
    refund_status: {
      type: String,
      enum: ["none", "pending", "completed"],
      default: "none",
    },

    // Feedback (review)
    review_submitted: { type: Boolean, default: false },
    review_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Feedback",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PackageBooking", packageBookingSchema);
