const mongoose = require("mongoose");

const stateSchema = new mongoose.Schema(
  {
    state_name: { type: String, required: true, unique: true, trim: true },
    status: { type: String, default: "Active", enum: ["Active", "Inactive"] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("State", stateSchema);