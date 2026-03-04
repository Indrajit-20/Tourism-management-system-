const BusRoute = require("../models/BusRoute");

// 1. Get All Routes
const getBusRoutes = async (req, res) => {
  try {
    const routes = await BusRoute.find().populate(
      "bus_id",
      "bus_number bus_type total_seats"
    );
    res.status(200).json(routes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching routes", error });
  }
};

// 2. Add a Bus Route (Admin)
const addBusRoute = async (req, res) => {
  try {
    const route = new BusRoute(req.body);
    await route.save();
    res.status(201).json({ message: "Route added successfully", route });
  } catch (error) {
    res.status(500).json({ message: "Error adding route", error });
  }
};

module.exports = { getBusRoutes, addBusRoute };
