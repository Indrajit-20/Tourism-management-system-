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
  const driverIds = [...new Set(parseIdList(body.driver_ids))];
  if (!driverIds.length && body.driver_id) {
    driverIds.push(body.driver_id);
  }

  const rawCategory = String(body.bus_category || "route").trim().toLowerCase();
  const busCategory = rawCategory === "tour" ? "tour" : "route";
  const busType = String(body.bus_type || "").trim();
  const layoutType = ["seater", "sleeper", "double_decker"].includes(
    String(body.layout_type || "").trim().toLowerCase(),
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
    driver_ids: driverIds,
    // Keep first driver in legacy field for compatibility.
    driver_id: driverIds[0] || body.driver_id,
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

  if (payload.driver_ids.length < 1 || payload.driver_ids.length > 2) {
    return "Please select at least 1 and at most 2 drivers";
  }

  const validDriverCount = await Staff.countDocuments({
    _id: { $in: payload.driver_ids },
    designation: "driver",
  });

  if (validDriverCount !== payload.driver_ids.length) {
    return "All selected driver IDs must belong to staff with designation driver";
  }

  const inUseDriverQuery = {
    $or: [
      { driver_ids: { $in: payload.driver_ids } },
      { driver_id: { $in: payload.driver_ids } },
    ],
  };

  if (excludeBusId) {
    inUseDriverQuery._id = { $ne: excludeBusId };
  }

  const alreadyAssigned = await Bus.findOne(inUseDriverQuery).select(
    "bus_number bus_name",
  );

  if (alreadyAssigned) {
    return `One or more selected drivers are already assigned to bus ${alreadyAssigned.bus_number}`;
  }

  return null;
};

// 1. Get All Buses
const getBuses = async (req, res) => {
  try {
    const categoryQuery = String(
      req.query.category || req.query.bus_category || "",
    )
      .trim()
      .toLowerCase();

    const query = {};
    if (["route", "tour"].includes(categoryQuery)) {
      query.bus_category = categoryQuery;
    }

    const buses = await Bus.find(query)
      .populate("driver_ids", "name designation")
      .populate("driver_id", "name designation");
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

    // If update payload omits drivers, keep existing assignment.
    if (!payload.driver_ids.length) {
      payload.driver_ids = existingBus.driver_ids?.length
        ? existingBus.driver_ids
        : existingBus.driver_id
        ? [existingBus.driver_id]
        : [];
      payload.driver_id = payload.driver_ids[0];
    }

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
    await Bus.findByIdAndDelete(req.params.id);
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