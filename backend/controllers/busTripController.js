const mongoose = require("mongoose");
const BusTrip = require("../models/BusTrip");
const BusSchedule = require("../models/BusSchedule");
const Bus = require("../models/Bus");
const TourSchedule = require("../models/TourSchedule");
const { buildSeatLayout } = require("../utils/seatLayoutHelper");

const parseTimeToMinutes = (value) => {
  const text = String(value || "")
    .trim()
    .toUpper_CASE();
  if (!text) return null;

  const hhmm = text.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmm) {
    const h = Number(hhmm[1]);
    const m = Number(hhmm[2]);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) return h * 60 + m;
    return null;
  }

  const ampm = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!ampm) return null;

  let h = Number(ampm[1]);
  const m = Number(ampm[2]);
  const meridiem = ampm[3];

  if (h < 1 || h > 12 || m < 0 || m > 59) return null;
  h = h % 12;
  if (meridiem === "PM") h += 12;
  return h * 60 + m;
};

// ✅ NEW: Check if driver has 2-hour rest between trips
const checkDriverAvailability = async (
  driver_id,
  trip_date,
  trip_start_time,
  trip_end_time,
  excludeTripId = null // Exclude current trip from check when updating
) => {
  if (!driver_id) return { available: true }; // No driver assigned yet

  const tripDate = new Date(trip_date);
  tripDate.setHours(0, 0, 0, 0);

  // Check trips on the same day
  const query = {
    driver_id,
    trip_date: {
      $gte: tripDate,
      $lt: new Date(tripDate.getTime() + 86400000),
    },
    status: { $in: ["Scheduled", "Running"] },
  };

  // Exclude the current trip if updating (convert to ObjectId for comparison)
  if (excludeTripId) {
    query._id = { $ne: new mongoose.Types.ObjectId(excludeTripId) };
  }

  const sameDayTrips = await BusTrip.find(query).populate({
    path: "schedule_id",
    populate: { path: "route_id" },
  });

  // Check if driver is already running a trip
  const runningTrip = sameDayTrips.find((t) => t.status === "Running");
  if (runningTrip) {
    return {
      available: false,
      message: `Driver is already running trip. Cannot assign until current trip is completed.`,
    };
  }

  // Driver should not be assigned to a tour on the same day.
  const activeTours = await TourSchedule.find({
    $or: [{ driver_id }, { guide_id: driver_id }],
    departure_status: { $nin: ["Completed", "Archived"] },
  })
    .populate("package_id", "package_name")
    .lean();

  const conflictingTour = activeTours.find((tour) => {
    const tourStart = new Date(tour.start_date);
    const tourEnd = tour.end_date ? new Date(tour.end_date) : tourStart;
    const tripDay = new Date(tripDate);
    tripDay.setHours(0, 0, 0, 0);
    return tripDay >= new Date(tourStart.setHours(0, 0, 0, 0)) && tripDay <= new Date(tourEnd.setHours(0, 0, 0, 0));
  });

  if (conflictingTour) {
    return {
      available: false,
      message: `Driver is already assigned to tour '${
        conflictingTour.package_id?.package_name || conflictingTour._id
      }' for this date range.`,
    };
  }

  // Check if there's enough gap between trips (2 hours minimum rest)
  const MIN_REST_MINUTES = 120; // 2 hours

  for (let existingTrip of sameDayTrips) {
    const existingEnd =
      existingTrip.schedule_id?.route_id?.arrival_time || "17:00";
    const existingEndMinutes = parseTimeToMinutes(existingEnd);
    const newStartMinutes = parseTimeToMinutes(trip_start_time);

    if (existingEndMinutes && newStartMinutes) {
      const restGap = newStartMinutes - existingEndMinutes;
      if (restGap > 0 && restGap < MIN_REST_MINUTES) {
        return {
          available: false,
          message: `Insufficient rest time. Driver needs minimum 2 hours rest. Current gap: ${restGap} minutes.`,
        };
      }
    }
  }

  return { available: true };
};

// ✅ NEW: Helper to calculate return trip time by adding 2 hours to arrival time
const addHoursToTime = (timeStr, hoursToAdd) => {
  if (!timeStr) return null;
  const minutes = parseTimeToMinutes(timeStr);
  if (minutes === null) return null;

  const totalMinutes = minutes + hoursToAdd * 60;
  const hours = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

// ✅ NEW: Create return trip (e.g., Vadodara→CMC after CMC→Vadodara)
const createReturnTrip = async (
  originalTrip,
  originalSchedule,
  returnScheduleId
) => {
  try {
    if (!returnScheduleId) {
      console.log("⚠️ Return schedule not linked, skipping auto return trip");
      return null;
    }

    const returnSchedule = await BusSchedule.findById(
      returnScheduleId
    ).populate("route_id");
    if (!returnSchedule) {
      console.log("⚠️ Return schedule not found");
      return null;
    }

    // Check if return trip already exists for same day
    const existingReturn = await BusTrip.findOne({
      schedule_id: returnScheduleId,
      trip_date: originalTrip.trip_date,
      status: { $in: ["Scheduled", "Running", "Completed"] },
    });

    if (existingReturn) {
      console.log("✓ Return trip already exists");
      return existingReturn;
    }

    // Create return trip with 2-hour rest
    const returnTrip = new BusTrip({
      schedule_id: returnScheduleId,
      bus_id: originalTrip.bus_id,
      driver_id: originalTrip.driver_id,
      trip_date: originalTrip.trip_date,
      boarding_points: returnSchedule.boarding_points || [],
      drop_points: returnSchedule.drop_points || [],
      is_return_trip: true,
      related_trip_id: originalTrip._id,
      seats: buildSeatLayout({
        totalSeats:
          (await Bus.findById(originalTrip.bus_id))?.total_seats || 35,
        layoutType: (await Bus.findById(originalTrip.bus_id))?.layout_type,
        busType: (await Bus.findById(originalTrip.bus_id))?.bus_type,
        basePrice: returnSchedule.route_id?.price_per_seat || 500,
        includeAvailability: true,
      }),
    });

    await returnTrip.save();
    console.log("✓ Return trip created:", returnTrip._id);
    return returnTrip;
  } catch (error) {
    console.error("Error creating return trip:", error.message);
    return null;
  }
};

// HELPER: Does this schedule run on this date?

const scheduleRunsOnDate = (schedule, date) => {
  if (!schedule) return false;
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  switch (schedule.frequency) {
    case "Daily":
      return true;
    case "Weekdays":
      return day >= 1 && day <= 5;
    case "Weekends":
      return day === 0 || day === 6;
    case "Custom":
      return (schedule.days_of_week || []).includes(day);
    default:
      return true;
  }
};

// ─────────────────────────────────────────────
// AUTO GENERATE TRIPS for next 30 days
// Called when admin creates a schedule
// ─────────────────────────────────────────────
const autoGenerateTrips = async (schedule, bus) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tripsCreated = [];

  // Loop through next 30 days
  for (let i = 0; i < 30; i++) {
    const tripDate = new Date(today);
    tripDate.setDate(today.getDate() + i);

    // Check if schedule runs on this day
    if (!scheduleRunsOnDate(schedule, tripDate)) continue;

    // Check if trip already exists for this schedule + date
    const exists = await BusTrip.findOne({
      schedule_id: schedule._id,
      trip_date: {
        $gte: tripDate,
        $lt: new Date(tripDate.getTime() + 86400000),
      },
    });

    // Skip if already exists
    if (exists) continue;

    // Get base price from route
    const basePrice =
      schedule.route_id?.price_per_seat || schedule.base_price || 500;

    // Create the trip
    const newTrip = new BusTrip({
      schedule_id: schedule._id,
      bus_id: bus._id,
      driver_id:
        schedule.driver_ids?.[0] || schedule.driver_id || bus.driver_id,
      trip_date: tripDate,
      boarding_points: schedule.boarding_points || [],
      drop_points: schedule.drop_points || [],
      seats: buildSeatLayout({
        totalSeats: bus.total_seats,
        layoutType: bus.layout_type,
        busType: bus.bus_type,
        basePrice,
        includeAvailability: true,
      }),
    });

    await newTrip.save();
    tripsCreated.push(newTrip);
  }

  return tripsCreated;
};

// ─────────────────────────────────────────────
// 1. CREATE TRIP manually (admin)
// ─────────────────────────────────────────────
const createTrip = async (req, res) => {
  try {
    const {
      schedule_id,
      bus_id,
      driver_id,
      trip_date,
      boarding_points,
      create_return_trip,
    } = req.body;

    if (!schedule_id || !bus_id || !trip_date) {
      return res
        .status(400)
        .json({ message: "schedule_id, bus_id and trip_date are required" });
    }

    const schedule = await BusSchedule.findById(schedule_id).populate(
      "route_id"
    );
    if (!schedule)
      return res.status(404).json({ message: "Schedule not found" });

    const bus = await Bus.findById(bus_id);
    if (!bus) return res.status(404).json({ message: "Bus not found" });

    // Prevent past dates
    const requestedDate = new Date(trip_date);
    requestedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (requestedDate < today) {
      return res
        .status(400)
        .json({ message: "Trip date must be today or future." });
    }

    // ✅ Check driver availability (2-hour rest requirement)
    const assignedDriver = driver_id || schedule.driver_id || bus.driver_id;
    if (assignedDriver) {
      const driverCheck = await checkDriverAvailability(
        assignedDriver,
        trip_date,
        schedule.route_id?.departure_time,
        schedule.route_id?.arrival_time
      );
      if (!driverCheck.available) {
        return res.status(400).json({ message: driverCheck.message });
      }
    }

    const basePrice =
      schedule.route_id?.price_per_seat || schedule.base_price || 500;

    const trip = new BusTrip({
      schedule_id,
      bus_id,
      driver_id: assignedDriver,
      trip_date,
      boarding_points: boarding_points || schedule.boarding_points || [],
      drop_points: schedule.drop_points || [],
      seats: buildSeatLayout({
        totalSeats: bus.total_seats,
        layoutType: bus.layout_type,
        busType: bus.bus_type,
        basePrice,
        includeAvailability: true,
      }),
    });

    await trip.save();

    // ✅ NEW: Auto-create return trip if requested
    let returnTrip = null;
    if (create_return_trip && schedule.return_schedule_id) {
      returnTrip = await createReturnTrip(
        trip,
        schedule,
        schedule.return_schedule_id
      );
    }

    res.status(201).json({
      message: "Trip created successfully",
      trip,
      returnTrip: returnTrip || undefined,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating trip", error: error.message });
  }
};

// 2. GET TRIPS (with auto-create if not exists)

const getTrips = async (req, res) => {
  try {
    const { schedule_id, route_id, date } = req.query;

    // If schedule_id + date given → find or create trip for this schedule
    if (schedule_id && date) {
      const tripDate = new Date(date);
      tripDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (tripDate < today) return res.status(200).json([]);

      const schedule = await BusSchedule.findById(schedule_id)
        .populate({ path: "route_id" })
        .populate({ path: "bus_id" })
        .populate("driver_ids");

      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      const bus = schedule.bus_id;
      if (!bus) return res.status(404).json({ message: "Bus not found" });

      // Check if trip already exists for this schedule + date
      const existing = await BusTrip.findOne({
        schedule_id,
        trip_date: {
          $gte: tripDate,
          $lt: new Date(tripDate.getTime() + 86400000),
        },
      })
        .populate({ path: "schedule_id", populate: { path: "route_id" } })
        .populate("bus_id")
        .populate("driver_id", "name");

      if (existing) return res.status(200).json([existing]);

      // Check if schedule runs on this day
      if (!scheduleRunsOnDate(schedule, tripDate)) {
        console.log(`⚠️ Schedule doesn't run on ${tripDate}`);
        return res.status(200).json([]);
      }

      // Check if departure time has passed today
      const now = new Date();
      const isToday = tripDate.toDateString() === now.toDateString();
      if (isToday) {
        const departureMinutes = parseTimeToMinutes(schedule.departure_time);
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        if (departureMinutes !== null && nowMinutes >= departureMinutes) {
          return res.status(200).json([]);
        }
      }

      // Auto create trip if not exists
      const basePrice = schedule.base_price || 500;
      const newTrip = new BusTrip({
        schedule_id,
        bus_id: bus._id,
        driver_id:
          schedule.driver_ids?.[0] || schedule.driver_id || bus.driver_id,
        trip_date: tripDate,
        boarding_points: schedule.boarding_points || [],
        drop_points: schedule.drop_points || [],
        seats: buildSeatLayout({
          totalSeats: bus.total_seats,
          layoutType: bus.layout_type,
          busType: bus.bus_type,
          basePrice,
          includeAvailability: true,
        }),
      });
      await newTrip.save();

      const saved = await BusTrip.findById(newTrip._id)
        .populate({ path: "schedule_id", populate: { path: "route_id" } })
        .populate("bus_id")
        .populate("driver_id", "name");

      console.log(`✅ Trip auto-created for ${tripDate}`);
      return res.status(200).json([saved]);
    }

    // If route_id + date given → find or create trip for user booking (legacy)
    if (route_id && date) {
      const tripDate = new Date(date);
      tripDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (tripDate < today) return res.status(200).json([]);

      const BusRoute = require("../models/BusRoute");
      const route = await BusRoute.findById(route_id);
      if (!route) return res.status(404).json({ message: "Route not found" });

      // Find matching schedule for this route + date
      const schedules = await BusSchedule.find({
        route_id,
        status: "Active",
      })
        .populate("route_id")
        .populate("bus_id")
        .populate("driver_ids");

      if (schedules.length === 0) {
        console.log(`⚠️ No active schedules found for route ${route_id}`);
        return res.status(200).json([]);
      }

      const matching = schedules.filter((s) => scheduleRunsOnDate(s, tripDate));
      if (matching.length === 0) {
        console.log(`⚠️ Schedule doesn't run on ${tripDate}`);
        return res.status(200).json([]);
      }

      const schedule = matching[0];

      // If selected date is today and departure time is already passed, no booking should be allowed.
      const now = new Date();
      const isToday = tripDate.toDateString() === now.toDateString();
      if (isToday) {
        const departureMinutes = parseTimeToMinutes(schedule.departure_time);
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        if (departureMinutes !== null && nowMinutes >= departureMinutes) {
          return res.status(200).json([]);
        }
      }

      // Check if trip already exists
      const existing = await BusTrip.findOne({
        schedule_id: schedule._id,
        trip_date: {
          $gte: tripDate,
          $lt: new Date(tripDate.getTime() + 86400000),
        },
      })
        .populate({ path: "schedule_id", populate: { path: "route_id" } })
        .populate("bus_id")
        .populate("driver_id", "name");

      if (existing) return res.status(200).json([existing]);

      // Auto create if not exists
      const bus = schedule.bus_id;
      if (!bus) return res.status(404).json({ message: "Bus not found" });

      const basePrice = schedule.base_price || 500;
      const newTrip = new BusTrip({
        schedule_id: schedule._id,
        bus_id: bus._id,
        driver_id:
          schedule.driver_ids?.[0] || schedule.driver_id || bus.driver_id,
        trip_date: tripDate,
        boarding_points: schedule.boarding_points || [],
        drop_points: schedule.drop_points || [],
        seats: buildSeatLayout({
          totalSeats: bus.total_seats,
          layoutType: bus.layout_type,
          busType: bus.bus_type,
          basePrice,
          includeAvailability: true,
        }),
      });
      await newTrip.save();

      const saved = await BusTrip.findById(newTrip._id)
        .populate("schedule_id")
        .populate("bus_id")
        .populate("driver_id", "name");

      console.log(`✅ Trip auto-created for ${tripDate}`);
      return res.status(200).json([saved]);
    }

    // No filters → return all trips
    const trips = await BusTrip.find()
      .populate({ path: "schedule_id", populate: { path: "route_id" } })
      .populate("bus_id")
      .populate("driver_id", "name");

    res.status(200).json(trips);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching trips", error: error.message });
  }
};

// 3. GET TRIP BY ID

const getTripById = async (req, res) => {
  try {
    const trip = await BusTrip.findById(req.params.id)
      .populate({ path: "schedule_id", populate: { path: "route_id" } })
      .populate("bus_id")
      .populate("driver_id", "name");

    if (!trip) return res.status(404).json({ message: "Trip not found" });
    res.status(200).json(trip);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching trip", error: error.message });
  }
};

// 4. UPDATE TRIP (admin — change driver/status)

const updateTrip = async (req, res) => {
  try {
    console.log("🔧 UPDATE TRIP - Trip ID:", req.params.id);
    console.log("🔧 UPDATE TRIP - Updates:", req.body);

    const trip = await BusTrip.findById(req.params.id).populate({
      path: "schedule_id",
      populate: { path: "route_id" },
    });

    if (!trip) return res.status(404).json({ message: "Trip not found" });

    const updates = { ...req.body };

    // ✅ NEW: If updating driver, validate 2-hour rest requirement
    if (updates.driver_id && updates.driver_id.trim()) {
      const currentDriverId = trip.driver_id ? trip.driver_id.toString() : null;
      const newDriverId = updates.driver_id.toString();

      console.log(
        `🔧 Driver validation: Current=${currentDriverId}, New=${newDriverId}`
      );

      // Only check availability if driver is actually changing to a different one
      if (currentDriverId && currentDriverId !== newDriverId) {
        try {
          console.log("🔧 Running availability check...");

          const driverCheck = await checkDriverAvailability(
            updates.driver_id,
            trip.trip_date,
            trip.schedule_id?.route_id?.departure_time,
            trip.schedule_id?.route_id?.arrival_time,
            req.params.id // Exclude this trip from the check
          );

          console.log("🔧 Availability result:", driverCheck);

          if (!driverCheck.available) {
            return res.status(400).json({ message: driverCheck.message });
          }
        } catch (checkError) {
          console.error("❌ Availability check failed:", checkError.message);
          return res.status(400).json({
            message: "Driver availability check failed: " + checkError.message,
          });
        }
      }
    }

    // Only allow seat update if no bookings exist yet
    if (updates.seats) {
      const BusTicketBooking = require("../models/BusTicketBooking");
      const hasBookings = await BusTicketBooking.findOne({
        trip_id: req.params.id,
      });
      if (hasBookings) delete updates.seats;
    }

    const updatedTrip = await BusTrip.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    )
      .populate({ path: "schedule_id", populate: { path: "route_id" } })
      .populate("bus_id")
      .populate("driver_id", "name contact_no");

    console.log("✅ Trip updated successfully");
    res.status(200).json({ message: "Trip updated", trip: updatedTrip });
  } catch (error) {
    console.error("❌ Update error:", error.message);
    res.status(500).json({
      message: "Error updating trip",
      error: error.message,
    });
  }
};

// 5. DELETE TRIP

const deleteTrip = async (req, res) => {
  try {
    const trip = await BusTrip.findByIdAndDelete(req.params.id);
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    res.status(200).json({ message: "Trip deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting trip", error: error.message });
  }
};

module.exports = {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  autoGenerateTrips,
};
