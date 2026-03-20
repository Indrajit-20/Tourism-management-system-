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

    price: { type: Number, required: true },
    duration: { type: String, required: true },
    
    // Support multiple images
    image_urls: [{ type: String }],
    
    description: { type: String },

    // Linking 1 Bus and 1 Tour Guide
    bus_id: { type: mongoose.Schema.Types.ObjectId, ref: "Bus" },
    tour_guide: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },

    start_date: { type: Date },
    end_date: { type: Date },
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
    
    // Tour Lifecycle
    tour_status: { 
      type: String, 
      enum: ["Scheduled", "Running", "Completed"], 
      default: "Scheduled" 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Package", packageSchema);
