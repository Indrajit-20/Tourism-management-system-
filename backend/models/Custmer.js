const mongoose = require("mongoose");
const { DMY_REGEX } = require("../utils/dobHelper");

const custmerSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },
    dob: {
      type: String,
      required: true,
      validate: {
        validator: (value) => DMY_REGEX.test(String(value || "")),
        message: "dob must be in DD-MM-YYYY format",
      },
    },
    phone_no: {
      type: Number,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    address: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Custmer", custmerSchema);
