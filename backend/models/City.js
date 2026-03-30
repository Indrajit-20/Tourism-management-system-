const mongoose = require("mongoose");

const citySchema = new mongoose.Schema(
  {
    city_name: { type: String, required: true },
    state_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "State",
      required: false,
    },
    state: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("City", citySchema);
