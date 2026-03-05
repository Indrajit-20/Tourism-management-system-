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

// 2. Add a Bus Route 
const addBusRoute = async (req, res) => {
  try {
    const route = new BusRoute(req.body);
    await route.save();
    res.status(201).json({ message: "Route added successfully", route });
  } catch (error) {
    res.status(500).json({ message: "Error adding route", error });
  }
};

// 3. Update a Bus Route 
const updateBusRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const route = await BusRoute.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ message: "Route updated successfully", route });
  } catch (error) {
    res.status(500).json({ message: "Error updating route", error });
  }
};

// 4. Delete a Bus Route (Admin)
const deleteBusRoute = async (req, res) => {
  try {
    const { id } = req.params;
    await BusRoute.findByIdAndDelete(id);
    res.status(200).json({ message: "Route deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting route", error });
  }
};

module.exports = { getBusRoutes, addBusRoute, updateBusRoute, deleteBusRoute };
