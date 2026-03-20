const mongoose = require("mongoose");

const busSchema = new mongoose.Schema(
  {
    bus_number: { type: String, required: true },
    bus_name: { type: String, required: true },
    bus_type: { type: String, required: true },
    total_seats: { type: Number, required: true },
    driver_ids: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Staff" }],
      validate: {
        validator: (value) =>
          Array.isArray(value) && value.length >= 1 && value.length <= 2,
        message: "Driver count must be between 1 and 2",
      },
      required: true,
    },
    // Legacy field kept for compatibility with modules that still read single driver.
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: false,
    },
    status: { type: String, default: "Active" },
  },
  { timestamps: true }
);
      
module.exports = mongoose.model("Bus", busSchema);
