const mongoose = require("mongoose");

const busRouteSchema = new mongoose.Schema({
  route_name: { type: String, required: true },

  // Foreign Key linking to the  bus 
  bus_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bus",
    required: true,
  },

  boarding_from: { type: String, required: true },
  destination: { type: String, required: true },

  departure_time: { type: String, required: true }, 
  arrival_time: { type: String, required: true },
  price_per_seat: { type: Number, required: true },
  status: { type: String, default: "Active" },
});

module.exports = mongoose.model("BusRoute", busRouteSchema);
