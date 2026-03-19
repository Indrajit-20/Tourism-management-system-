const mongoose = require("mongoose");

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

    dob: { type: Date, required: true },

    address: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Staff", staffSchema);