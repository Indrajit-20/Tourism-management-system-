const BusRoute = require("../models/BusRoute");
const Bus = require("../models/Bus");
const BusSchedule = require("../models/BusSchedule");
const BusTrip = require("../models/BusTrip");

const parseTimeTo24 = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const hhmmMatch = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmmMatch) {
    const h = Number(hhmmMatch[1]);
    const m = Number(hhmmMatch[2]);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return { hour24: h, minute: m };
    }
    return null;
  }

  const ampmMatch = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!ampmMatch) return null;

  let h = Number(ampmMatch[1]);
  const m = Number(ampmMatch[2]);
  const meridiem = ampmMatch[3].toUpperCase();

  if (h < 1 || h > 12 || m < 0 || m > 59) return null;
  if (meridiem === "AM") {
    h = h === 12 ? 0 : h;
  } else {
    h = h === 12 ? 12 : h + 12;
  }

  return { hour24: h, minute: m };
};

const formatAs12Hour = (parts) => {
  if (!parts) return "";
  const { hour24, minute } = parts;
  const meridiem = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(
    2,
    "0"
  )} ${meridiem}`;
};

const normalizeRoutePayload = (body) => {
  const fromCity = String(body.boarding_from || "").trim();
  const toCity = String(body.destination || "").trim();

  return {
    route_name: String(body.route_name || "").trim(),
    boarding_state_id: body.boarding_state_id,
    boarding_city_id: body.boarding_city_id,
    boarding_from: fromCity,
    destination_state_id: body.destination_state_id,
    destination_city_id: body.destination_city_id,
    destination: toCity,
    status: body.status || "Active",
  };
};

const validateRoutePayload = (payload) => {
  if (!payload.route_name || !payload.boarding_from || !payload.destination) {
    return "route_name, boarding_from and destination are required";
  }
  return null;
};

// 1. Get All Routes
const getBusRoutes = async (req, res) => {
  try {
    const routes = await BusRoute.find()
      .populate("boarding_state_id", "state_name")
      .populate("boarding_city_id", "city_name")
      .populate("destination_state_id", "state_name")
      .populate("destination_city_id", "city_name");
    res.status(200).json(routes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching routes", error });
  }
};

// 2. Add a Bus Route
const addBusRoute = async (req, res) => {
  try {
    const payload = normalizeRoutePayload(req.body);
    const validationError = validateRoutePayload(payload);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const route = new BusRoute(payload);
    await route.save();
    res.status(201).json({ message: "Route added successfully", route });
  } catch (error) {
    res.status(500).json({ message: "Error adding route", error });
  }
}; // 3. Update a Bus Route
const updateBusRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await BusRoute.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Route not found" });
    }

    const payload = normalizeRoutePayload({
      ...existing.toObject(),
      ...req.body,
    });
    const validationError = validateRoutePayload(payload);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const route = await BusRoute.findByIdAndUpdate(id, payload, { new: true });
    res.status(200).json({ message: "Route updated successfully", route });
  } catch (error) {
    res.status(500).json({ message: "Error updating route", error });
  }
};

// 4. Delete a Bus Route (Admin)
const deleteBusRoute = async (req, res) => {
  try {
    const { id } = req.params;

    const linkedSchedules = await BusSchedule.find({ route_id: id }).select(
      "_id"
    );
    if (linkedSchedules.length > 0) {
      const scheduleIds = linkedSchedules.map((s) => s._id);
      const linkedTrips = await BusTrip.countDocuments({
        schedule_id: { $in: scheduleIds },
      });

      return res.status(400).json({
        message:
          linkedTrips > 0
            ? "Cannot delete route. It is linked with schedules and trips."
            : "Cannot delete route. It is linked with schedules.",
      });
    }

    await BusRoute.findByIdAndDelete(id);
    res.status(200).json({ message: "Route deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting route", error });
  }
};

module.exports = { getBusRoutes, addBusRoute, updateBusRoute, deleteBusRoute };
