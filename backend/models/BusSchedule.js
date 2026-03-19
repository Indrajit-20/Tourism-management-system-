const mongoose = require("mongoose");

const BusScheduleSchema = new mongoose.Schema(
  {
    // A human-friendly name/title for this schedule (e.g., "Ahmedabad → Rajkot Morning")
    title: { type: String, required: true },

    // The route that will be used for each generated trip
    route_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusRoute",
      required: true,
    },

    bus_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bus",
      required: true,
    },
    // Optional preferred driver for this schedule.
    // This will be used when a trip is auto-generated for a date.
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },

    // The time of day this schedule runs (e.g., "08:00")
    departure_time: { type: String, required: true },
    arrival_time: { type: String, required: true },

    // Frequency rule describing which days this schedule runs
    frequency: {
      type: String,
      enum: ["Daily", "Weekdays", "Weekends", "Custom"],
      default: "Daily",
    },

    // When frequency is "Custom", specify which days of the week (0=Sunday..6=Saturday)
    days_of_week: [{ type: Number }],

    // Default boarding points for this schedule
    boarding_points: [String],

    // Base seat price / default fare (can be overridden per trip)
    base_price: { type: Number, default: 0 },

    // Active / Inactive schedule
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BusSchedule", BusScheduleSchema);
