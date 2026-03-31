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
      validate: {
        validator: function (value) {
          if (!value) return true;
          return /^\d{12}$/.test(String(value));
        },
        message: "Aadhaar number must be exactly 12 digits",
      },
    },
    aadhaar_photo: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Passenger", PassengerSchema);
