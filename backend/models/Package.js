const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    package_name: { type: String, required: true },
    package_type: { type: String, required: true },

    hotel_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },

    price: { type: Number, required: true },
    duration: { type: String, required: true },
    image_url: { type: String },
    description: { type: String },

    bus_id: { type: mongoose.Schema.Types.ObjectId, ref: "Bus" },

    start_date: { type: Date },
    inclusive: { type: String },
    exclusive: { type: String },

    status: { type: String, default: "Active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Package", packageSchema);
