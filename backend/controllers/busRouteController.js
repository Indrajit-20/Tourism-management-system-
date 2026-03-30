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
  return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${meridiem}`;
};

const normalizeRoutePayload = (body) => {
  const departure = parseTimeTo24(body.departure_time);
  const arrival = parseTimeTo24(body.arrival_time);
  const fromCity = String(body.boarding_from || "").trim();
  const toCity = String(body.destination || "").trim();
  const boardPoint = String(body.board_point || fromCity || "").trim();
  const dropPoint = String(body.drop_point || toCity || "").trim();

  return {
    route_name: String(body.route_name || "").trim(),
    bus_id: body.bus_id,
    boarding_from: fromCity,
    board_point: boardPoint,
    destination: toCity,
    drop_point: dropPoint,
    departure_time: formatAs12Hour(departure),
    arrival_time: formatAs12Hour(arrival),
    price_per_seat: Number(body.price_per_seat),
    status: body.status || "Active",
  };
};

const validateRoutePayload = (payload) => {
  if (
    !payload.route_name ||
    !payload.bus_id ||
    !payload.boarding_from ||
    !payload.destination
  ) {
    return "route_name, bus_id, boarding_from and destination are required";
  }
  if (!payload.departure_time || !payload.arrival_time) {
    return "departure_time and arrival_time must be valid times";
  }
  if (!Number.isFinite(payload.price_per_seat) || payload.price_per_seat <= 0) {
    return "price_per_seat must be greater than 0";
  }
  return null;
};

// 1. Get All Routes
const getBusRoutes = async (req, res) => {
  try {
    const routes = await BusRoute.find().populate(
      "bus_id",
      "bus_name bus_number bus_type layout_type total_seats"
    );
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

    const bus = await Bus.findById(payload.bus_id).select("bus_category");
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }
    if (String(bus.bus_category || "route") !== "route") {
      return res.status(400).json({
        message: "Only route category buses can be assigned to bus routes",
      });
    }

    const route = new BusRoute(payload);
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

    if (payload.bus_id) {
      const bus = await Bus.findById(payload.bus_id).select("bus_category");
      if (!bus) {
        return res.status(404).json({ message: "Bus not found" });
      }
      if (String(bus.bus_category || "route") !== "route") {
        return res.status(400).json({
          message: "Only route category buses can be assigned to bus routes",
        });
      }
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

    const linkedSchedules = await BusSchedule.find({ route_id: id }).select("_id");
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
