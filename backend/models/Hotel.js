const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
      location: { type: String, required: true },
    hotel_type: {
      type: String,
    },
    description: { type: String },
     status: {
      type: String,
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Hotel", hotelSchema);
