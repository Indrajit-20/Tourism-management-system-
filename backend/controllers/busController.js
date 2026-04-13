const Bus = require("../models/Bus");
const BusRoute = require("../models/BusRoute");

const Staff = require("../models/Staff");

// Converts incoming form values into an array of ids.
const parseIdList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch (error) {
        return [];
      }
    }
    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

// Ensures old single-driver payloads still work with the new driver_ids field.
const normalizeBusPayload = (body) => {
  const rawCategory = String(body.bus_category || "route")
    .trim()
    .toLowerCase();
  const busCategory = rawCategory === "tour" ? "tour" : "route";
  const busType = String(body.bus_type || "").trim();
  const layoutType = ["seater", "sleeper", "double_decker"].includes(
    String(body.layout_type || "")
      .trim()
      .toLowerCase()
  )
    ? String(body.layout_type).trim().toLowerCase()
    : "seater";
  const normalizedSeats = Number(body.total_seats || 0);

  return {
    ...body,
    bus_category: busCategory,
    bus_type: busType,
    layout_type: layoutType,
    total_seats: normalizedSeats,
  };
};

const validateBusPayload = async (payload, excludeBusId = null) => {
  if (!["route", "tour"].includes(payload.bus_category)) {
    return "Invalid bus category. Allowed values are route and tour";
  }

  if (!payload.bus_type) {
    return "Bus type is required";
  }

  if (payload.bus_type.length > 30) {
    return "Bus type should be 30 characters or less";
  }

  if (!["seater", "sleeper", "double_decker"].includes(payload.layout_type)) {
    return "layout_type must be one of: seater, sleeper, double_decker";
  }

  const totalSeats = Number(payload.total_seats);
  if (!Number.isInteger(totalSeats) || totalSeats < 1 || totalSeats > 150) {
    return "Total seats must be an integer between 1 and 150";
  }

  return null;
};

// 1. Get All Buses
const getBuses = async (req, res) => {
  try {
    const categoryQuery = String(
      req.query.category || req.query.bus_category || ""
    )
      .trim()
      .toLowerCase();

    const query = {};
    if (["route", "tour"].includes(categoryQuery)) {
      query.bus_category = categoryQuery;
    }

    const buses = await Bus.find(query);
    res.status(200).json(buses);
  } catch (error) {
    res.status(500).json({ message: "Error fetching buses", error });
  }
};

// 2. Add New Bus
const addBus = async (req, res) => {
  try {
    const payload = normalizeBusPayload(req.body);

    const validationError = await validateBusPayload(payload);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const newBus = new Bus(payload);
    await newBus.save();
    res.status(201).json({ message: "Bus added successfully", bus: newBus });
  } catch (error) {
    res.status(500).json({ message: "Error adding bus", error });
  }
};

// 3. Update Bus
const updateBus = async (req, res) => {
  try {
    const existingBus = await Bus.findById(req.params.id);
    if (!existingBus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    const payload = normalizeBusPayload({
      ...existingBus.toObject(),
      ...req.body,
    });

    const validationError = await validateBusPayload(payload, existingBus._id);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const updateBus = await Bus.findByIdAndUpdate(req.params.id, payload, {
      new: true,
    });
    res.status(200).json({ message: "Bus updated", bus: updateBus });
  } catch (error) {
    res.status(500).json({ message: "Error updating bus", error });
  }
};

// 4. Delete Bus
const deleteBus = async (req, res) => {
  try {
    const busId = req.params.id;

    // Check if any bus schedule uses this bus
    const BusSchedule = require("../models/BusSchedule");
    const activeSchedule = await BusSchedule.findOne({ bus_id: busId });
    if (activeSchedule) {
      return res.status(400).json({
        message:
          "Cannot delete bus. It is assigned to a bus schedule. Remove from schedules first.",
      });
    }

    // Check if any tour schedule uses this bus
    const TourSchedule = require("../models/TourSchedule");
    const activeTourSchedule = await TourSchedule.findOne({ bus_id: busId });
    if (activeTourSchedule) {
      return res.status(400).json({
        message:
          "Cannot delete bus. It is assigned to a tour schedule. Remove from schedules first.",
      });
    }

    await Bus.findByIdAndDelete(busId);
    res.status(200).json({ message: "Bus deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting bus", error });
  }
};

// --- BUS ROUTES LOGIC ---

module.exports = {
  getBuses,
  addBus,
  updateBus,
  deleteBus,
};
