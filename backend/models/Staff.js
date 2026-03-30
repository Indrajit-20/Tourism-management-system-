const mongoose = require("mongoose");
const { DMY_REGEX } = require("../utils/dobHelper");

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    designation: {
      type: String,
      required: true,
      enum: ["driver", "guide"]
    },

    contact_no: { type: String, required: true },

    email_id: { type: String, required: true, unique: true },

    password: { type: String, required: true },

    dob: {
      type: String,
      required: true,
      validate: {
        validator: (value) => DMY_REGEX.test(String(value || "")),
        message: "dob must be in DD-MM-YYYY format",
      },
    },

    address: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Staff", staffSchema);