const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    package_name: { type: String, required: true },
    package_type: { type: String, required: true },
    source_city: { type: String, default: "Ahmedabad" },
    destination: { type: String, required: true },

    // Update to support multiple hotels
    hotels: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
    }],

    // Deprecated package-level price. Pricing is managed on TourSchedule.
    price: { type: Number },
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
    // Keep for backward compatibility. Use boarding_points as the single source.
    pickup_points: [{ type: String }],
    
    // Sightseeing list and itinerary
    sightseeing: [{ type: String }],
    itinerary: { type: String },

    status: { type: String, default: "Active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Package", packageSchema);
