const Bus = require("../models/Bus");
const BusRoute = require("../models/BusRoute");
const BusTicketBooking = require("../models/BusTicketBooking");

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

  return {
    ...body,
    driver_ids: driverIds,
    // Keep first driver in legacy field for compatibility.
    driver_id: driverIds[0] || body.driver_id,
  };
};

// 1. Get All Buses
const getBuses = async (req, res) => {
  try {
    const buses = await Bus.find()
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

    // Business rule: bus must have 1 or 2 drivers.
    if (!payload.driver_ids.length) {
      return res.status(400).json({ message: "At least one driver is required" });
    }
    if (payload.driver_ids.length > 2) {
      return res.status(400).json({ message: "Maximum 2 drivers are allowed" });
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

    const payload = normalizeBusPayload(req.body);

    // If update payload omits drivers, keep existing assignment.
    if (!payload.driver_ids.length) {
      payload.driver_ids = existingBus.driver_ids?.length
        ? existingBus.driver_ids
        : existingBus.driver_id
        ? [existingBus.driver_id]
        : [];
      payload.driver_id = payload.driver_ids[0];
    }

    if (!payload.driver_ids.length) {
      return res.status(400).json({ message: "At least one driver is required" });
    }
    if (payload.driver_ids.length > 2) {
      return res.status(400).json({ message: "Maximum 2 drivers are allowed" });
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