const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema({
  seat_number: { type: String, required: true },
  row: { type: Number },
  column: { type: Number },
  type: { type: String, default: "seat" },
  is_booked: { type: Boolean, default: false },
  booked_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PackageBooking",
    default: null,
  },
  price: { type: Number, default: 0 },
});

const tourScheduleSchema = new mongoose.Schema(
  {
    // Link to Package Master (template)
    package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },

    // Specific departure date for this tour run
    start_date: { type: Date, required: true },
    end_date: { type: Date },
    departure_time: { type: String, trim: true },

    // Bus assigned to this departure
    bus_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bus",
      required: true,
    },

    // Driver assigned to this specific tour run
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },

    // Tour guide assigned to this specific tour run (optional but helpful)
    guide_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },

    // Price for this specific schedule
    price: { type: Number },

    // Legacy field kept for backward compatibility during transition.
    price_per_person: { type: Number },

    // Seat management
    total_seats: { type: Number, required: true },
    available_seats: { type: Number, required: true },
    seats: [seatSchema],

    // Schedule status lifecycle
    // Draft -> admin is preparing schedule
    // Open -> visible and bookable
    // BookingFull -> no seats left
    // Completed -> schedule end date passed
    // Archived -> hidden from users/admin lists
    departure_status: {
      type: String,
      enum: ["Draft", "Open", "BookingFull", "Completed", "Archived"],
      default: "Draft",
    },

    // Track if any booking has been made
    has_bookings: { type: Boolean, default: false },

    // Optional: admin notes for this specific departure
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TourSchedule", tourScheduleSchema);
