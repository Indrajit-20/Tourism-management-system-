const mongoose = require("mongoose");

const PassengerSchema = new mongoose.Schema(
  {
    p_booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PackageBooking",
    },
    b_booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusBooking",
    },
    passenger_name: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    is_lead: {
      type: Boolean,
      default: false,
    },
    aadhaar_number: {
      type: String,
    },
    aadhaar_photo: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Passenger", PassengerSchema);
