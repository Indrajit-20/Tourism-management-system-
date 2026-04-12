const mongoose = require("mongoose");

const busSchema = new mongoose.Schema(
  {
    bus_number: { type: String, required: true, unique: true },
    bus_name: { type: String, required: true },
    bus_category: {
      type: String,
      enum: ["route", "tour"],
      default: "route",
      required: true,
    },
    bus_type: { type: String, required: true },
    layout_type: {
      type: String,
      enum: ["seater", "sleeper", "double_decker"],
      default: "seater",
      required: true,
    },
    total_seats: { type: Number, required: true },
    status: { type: String, default: "Active" },
  },
  { timestamps: true }
);
      
module.exports = mongoose.model("Bus", busSchema);
