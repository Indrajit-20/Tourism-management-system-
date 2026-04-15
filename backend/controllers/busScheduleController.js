const BusSchedule = require("../models/BusSchedule");
const Bus = require("../models/Bus");
const BusRoute = require("../models/BusRoute");
const Staff = require("../models/Staff");
const { autoGenerateTrips } = require("./busTripController");

const normalizeSinglePoint = (value) => {
  if (Array.isArray(value)) {
    const first = value.map((item) => String(item || "").trim()).find(Boolean);
    return first ? [first] : [];
  }
  const text = String(value || "").trim();
  return text ? [text] : [];
};

const validateOverrideDriver = async (driverId, routeBusId) => {
  if (!driverId) return null;

  const staff = await Staff.findById(driverId).select("designation name");
  if (
    !staff ||
    !String(staff.designation || "")
      .toLowerCase()
      .includes("driver")
  ) {
    return "Selected staff is not a valid driver";
  }

  const inUse = await Bus.findOne({
    _id: { $ne: routeBusId },
    $or: [{ driver_ids: driverId }, { driver_id: driverId }],
  }).select("bus_number");

  if (inUse) {
    return `Selected driver is already assigned to bus ${inUse.bus_number}`;
  }

  return null;
};

// 1. CREATE SCHEDULE + AUTO GENERATE 30 TRIPS

const createSchedule = async (req, res) => {
  try {
    const { driver_ids, ...rest } = req.body;

    const route = await BusRoute.findById(rest.route_id).select(
      "bus_id departure_time arrival_time price_per_seat"
    );
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    // ✅ Validate driver_ids (both drivers if provided)
    const validatedDriverIds = [];
    if (driver_ids && Array.isArray(driver_ids)) {
      for (const driverId of driver_ids) {
        if (driverId && driverId.trim()) {
          const validationError = await validateOverrideDriver(
            driverId,
            route.bus_id
          );
          if (validationError) {
            return res.status(400).json({ message: validationError });
          }
          validatedDriverIds.push(driverId);
        }
      }
    }

    const schedule = new BusSchedule({
      ...rest,
      bus_id: route.bus_id,
      // departure_time and arrival_time now come from req.body (rest)
      base_price: rest.base_price || Number(route.price_per_seat || 0),
      boarding_points: normalizeSinglePoint(rest.boarding_points),
      drop_points: normalizeSinglePoint(rest.drop_points),
      driver_ids:
        validatedDriverIds.length > 0 ? validatedDriverIds : undefined,
    });
    await schedule.save();

    // Auto generate trips for next 30 days
    // We need the bus — get it from route
    let tripsCreated = 0;
    try {
      // Populate route to get bus_id
      const populatedSchedule = await BusSchedule.findById(
        schedule._id
      ).populate({ path: "route_id", populate: { path: "bus_id" } });

      const bus = populatedSchedule.route_id?.bus_id;

      if (bus) {
        const trips = await autoGenerateTrips(populatedSchedule, bus);
        tripsCreated = trips.length;
      }
    } catch (tripErr) {
      // Don't fail schedule creation if trip generation fails
      console.error("Trip auto-generation error:", tripErr.message);
    }

    res.status(201).json({
      message: `Schedule created. ${tripsCreated} trips auto-generated for next 30 days.`,
      schedule,
      trips_created: tripsCreated,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating schedule", error: error.message });
  }
};

// 2. GET ALL SCHEDULES

const getSchedules = async (req, res) => {
  try {
    const schedules = await BusSchedule.find()
      .populate("route_id")
      .populate("bus_id")
      // ✅ FIX: Staff model uses 'name' not 'first_name last_name', populate both driver_id and driver_ids
      .populate("driver_id", "name contact_no")
      .populate("driver_ids", "name contact_no");

    res.status(200).json(schedules);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching schedules", error: error.message });
  }
};

// 3. GET SCHEDULE BY ID

const getScheduleById = async (req, res) => {
  try {
    // ✅ FIX: populate route, bus, and drivers
    const schedule = await BusSchedule.findById(req.params.id)
      .populate("route_id")
      .populate("bus_id")
      .populate("driver_id", "name")
      .populate("driver_ids", "name");

    if (!schedule)
      return res.status(404).json({ message: "Schedule not found" });
    res.status(200).json(schedule);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching schedule", error: error.message });
  }
};

// 4. UPDATE SCHEDULE

const updateSchedule = async (req, res) => {
  try {
    const { driver_ids, ...rest } = req.body;

    const existing = await BusSchedule.findById(req.params.id);
    if (!existing)
      return res.status(404).json({ message: "Schedule not found" });

    const routeId = rest.route_id || existing.route_id;
    const route = await BusRoute.findById(routeId).select(
      "bus_id departure_time arrival_time price_per_seat"
    );
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    // ✅ Validate driver_ids (both drivers if provided)
    const validatedDriverIds = [];
    if (driver_ids && Array.isArray(driver_ids)) {
      for (const driverId of driver_ids) {
        if (driverId && driverId.trim()) {
          const validationError = await validateOverrideDriver(
            driverId,
            route.bus_id
          );
          if (validationError) {
            return res.status(400).json({ message: validationError });
          }
          validatedDriverIds.push(driverId);
        }
      }
    }

    const schedule = await BusSchedule.findByIdAndUpdate(
      req.params.id,
      {
        ...rest,
        bus_id: route.bus_id,
        // departure_time and arrival_time now come from req.body (rest)
        base_price: rest.base_price || Number(route.price_per_seat || 0),
        boarding_points: normalizeSinglePoint(rest.boarding_points),
        drop_points: normalizeSinglePoint(rest.drop_points),
        driver_ids:
          validatedDriverIds.length > 0 ? validatedDriverIds : undefined,
      },
      { new: true }
    );
    res.status(200).json({ message: "Schedule updated", schedule });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating schedule", error: error.message });
  }
};

// 5. DELETE SCHEDULE

const deleteSchedule = async (req, res) => {
  try {
    const schedule = await BusSchedule.findByIdAndDelete(req.params.id);
    if (!schedule)
      return res.status(404).json({ message: "Schedule not found" });
    res.status(200).json({ message: "Schedule deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting schedule", error: error.message });
  }
};

module.exports = {
  createSchedule,
  getSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
};
