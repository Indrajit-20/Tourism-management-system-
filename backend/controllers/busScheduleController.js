const BusSchedule = require("../models/BusSchedule");
const Bus         = require("../models/Bus");
const { autoGenerateTrips } = require("./busTripController");

// 1. CREATE SCHEDULE + AUTO GENERATE 30 TRIPS

const createSchedule = async (req, res) => {
  try {
    const { driver_id, ...rest } = req.body;

    const schedule = new BusSchedule({
      ...rest,
      driver_id: driver_id || undefined,
    });
    await schedule.save();

   // Auto generate trips for next 30 days
    // We need the bus — get it from route
    let tripsCreated = 0;
    try {
      // Populate route to get bus_id
      const populatedSchedule = await BusSchedule.findById(schedule._id)
        .populate({ path: "route_id", populate: { path: "bus_id" } });

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
      message:      `Schedule created. ${tripsCreated} trips auto-generated for next 30 days.`,
      schedule,
      trips_created: tripsCreated,
    });

  } catch (error) {
    res.status(500).json({ message: "Error creating schedule", error: error.message });
  }
};

// 2. GET ALL SCHEDULES

const getSchedules = async (req, res) => {
  try {
    const schedules = await BusSchedule.find()
      .populate("route_id")
      // ✅ FIX: Staff model uses 'name' not 'first_name last_name'
      .populate("driver_id", "name contact_no");

    res.status(200).json(schedules);
  } catch (error) {
    res.status(500).json({ message: "Error fetching schedules", error: error.message });
  }
};


// 3. GET SCHEDULE BY ID

const getScheduleById = async (req, res) => {
  try {
    // ✅ FIX: populate route and driver
    const schedule = await BusSchedule.findById(req.params.id)
      .populate("route_id")
      .populate("driver_id", "name");

    if (!schedule) return res.status(404).json({ message: "Schedule not found" });
    res.status(200).json(schedule);
  } catch (error) {
    res.status(500).json({ message: "Error fetching schedule", error: error.message });
  }
};


// 4. UPDATE SCHEDULE

const updateSchedule = async (req, res) => {
  try {
    const { driver_id, ...rest } = req.body;

    const schedule = await BusSchedule.findByIdAndUpdate(
      req.params.id,
      { ...rest, driver_id: driver_id || undefined },
      { new: true }
    );

    if (!schedule) return res.status(404).json({ message: "Schedule not found" });
    res.status(200).json({ message: "Schedule updated", schedule });
  } catch (error) {
    res.status(500).json({ message: "Error updating schedule", error: error.message });
  }
};


// 5. DELETE SCHEDULE

const deleteSchedule = async (req, res) => {
  try {
    const schedule = await BusSchedule.findByIdAndDelete(req.params.id);
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });
    res.status(200).json({ message: "Schedule deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting schedule", error: error.message });
  }
};

module.exports = {
  createSchedule,
  getSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
};
