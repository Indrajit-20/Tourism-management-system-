const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    package_name: { type: String, required: true },
    package_type: { type: String, required: true },
    source_city: { type: String, default: "Ahmedabad" },
    destination: { type: String, required: true },

    // References to State and City
    state_id: { type: mongoose.Schema.Types.ObjectId, ref: "State" },
    city_id: { type: mongoose.Schema.Types.ObjectId, ref: "City" },
    places_visited: [{ type: mongoose.Schema.Types.ObjectId, ref: "City" }],

    // Update to support multiple hotels
    hotels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hotel",
      },
    ],

    duration: { type: String, required: true },

    // Support multiple images
    image_urls: [{ type: String }],

    description: { type: String },

    // Tour Guide (optional)
    tour_guide: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },

    // Package-level inclusions/exclusions (not departure-specific)
    inclusive: { type: String },
    exclusive: { type: String },

    // Admin manually adds boarding points properly
    boarding_points: [{ type: String }],

    // Sightseeing list and itinerary
    sightseeing: [{ type: String }],
    itinerary: { type: String },

    status: { type: String, default: "Active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Package", packageSchema);
