const mongoose = require("mongoose");

const busRouteSchema = new mongoose.Schema({
  route_name: { type: String, required: true },

  boarding_state_id: { type: mongoose.Schema.Types.ObjectId, ref: "State" },
  boarding_city_id: { type: mongoose.Schema.Types.ObjectId, ref: "City" },
  boarding_from: { type: String, required: true },

  destination_state_id: { type: mongoose.Schema.Types.ObjectId, ref: "State" },
  destination_city_id: { type: mongoose.Schema.Types.ObjectId, ref: "City" },
  destination: { type: String, required: true },

  status: { type: String, default: "Active" },
});

module.exports = mongoose.model("BusRoute", busRouteSchema);
