const TourSchedule = require("../models/TourSchedule");
const Package = require("../models/Package");
const Bus = require("../models/Bus");
const BusTrip = require("../models/BusTrip");
const { autoCompleteTours } = require("../utils/autoCompleteHelper");
const { buildSeatLayout } = require("../utils/seatLayoutHelper");

const SCHEDULE_STATUS = {
  DRAFT: "Draft",
  OPEN: "Open",
  BOOKING_FULL: "BookingFull",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

const MIN_ADMIN_SCHEDULE_LEAD_DAYS = 0;

const DEPARTURE_TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const toDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDayStart = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const isBeforeToday = (value) => {
  if (!value) return false;
  return toDayStart(value) < toDayStart(new Date());
};

const isValidPositiveAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
};

const normalizeDepartureTime = (value) => {
  const text = String(value || "").trim();
  return text;
};

const isValidDepartureTime = (value) => {
  return DEPARTURE_TIME_REGEX.test(String(value || "").trim());
};

const getDayDifference = (fromDate, toDate) => {
  const msInDay = 24 * 60 * 60 * 1000;
  return Math.round((toDayStart(toDate) - toDayStart(fromDate)) / msInDay);
};

const extractDurationDays = (durationText) => {
  const match = String(durationText || "").match(/(\d+)/);
  return match ? Number(match[1]) : 0;
};

const deriveEndDate = (startDate, endDate, packageDuration) => {
  if (endDate) return endDate;
  const days = extractDurationDays(packageDuration);
  if (!days || !startDate) return startDate;
  const derived = new Date(startDate);
  derived.setDate(derived.getDate() + Math.max(days - 1, 0));
  return derived;
};

const hasRangeOverlap = (aStart, aEnd, bStart, bEnd) => {
  return aStart <= bEnd && aEnd >= bStart;
};

const ensureBusAvailability = async ({
  busId,
  startDate,
  endDate,
  excludeScheduleId = null,
}) => {
  const scheduleQuery = {
    bus_id: busId,
    departure_status: {
      $nin: [SCHEDULE_STATUS.COMPLETED, SCHEDULE_STATUS.ARCHIVED],
    },
  };

  if (excludeScheduleId) {
    scheduleQuery._id = { $ne: excludeScheduleId };
  }

  const existingSchedules = await TourSchedule.find(
    scheduleQuery,
    "start_date end_date"
  ).lean();
  const conflictingSchedule = existingSchedules.find((item) => {
    const itemStart = new Date(item.start_date);
    const itemEnd = item.end_date ? new Date(item.end_date) : itemStart;
    return hasRangeOverlap(startDate, endDate, itemStart, itemEnd);
  });

  if (conflictingSchedule) {
    return {
      ok: false,
      message:
        "Selected bus is already assigned to another tour schedule in this date range",
    };
  }

  const conflictingTrip = await BusTrip.findOne({
    bus_id: busId,
    status: { $in: ["Scheduled", "Running"] },
    trip_date: { $gte: startDate, $lte: endDate },
  }).lean();

  if (conflictingTrip) {
    return {
      ok: false,
      message:
        "Selected bus is already assigned to a bus trip in this date range",
    };
  }

  return { ok: true };
};

const ensureGuideAvailability = async ({
  guideId,
  startDate,
  endDate,
  excludeScheduleId = null,
}) => {
  if (!guideId) {
    return { ok: true };
  }

  const scheduleQuery = {
    departure_status: {
      $nin: [SCHEDULE_STATUS.COMPLETED, SCHEDULE_STATUS.ARCHIVED],
    },
  };

  if (excludeScheduleId) {
    scheduleQuery._id = { $ne: excludeScheduleId };
  }

  const schedules = await TourSchedule.find(
    scheduleQuery,
    "start_date end_date package_id"
  )
    .populate("package_id", "package_name tour_guide")
    .lean();

  const conflict = schedules.find((item) => {
    const itemGuideId = item.package_id?.tour_guide;
    if (!itemGuideId || String(itemGuideId) !== String(guideId)) {
      return false;
    }

    const itemStart = new Date(item.start_date);
    const itemEnd = item.end_date ? new Date(item.end_date) : itemStart;
    return hasRangeOverlap(startDate, endDate, itemStart, itemEnd);
  });

  if (conflict) {
    return {
      ok: false,
      message:
        "Selected guide is already assigned to another tour schedule in this date range",
    };
  }

  return { ok: true };
};

const ensureStaffAvailability = async ({
  staffId,
  designation,
  startDate,
  endDate,
  excludeScheduleId = null,
}) => {
  if (!staffId) {
    return { ok: true };
  }

  // 1. Check Tour Schedules
  const tourQuery = {
    $or: [{ driver_id: staffId }, { guide_id: staffId }],
    departure_status: {
      $nin: [SCHEDULE_STATUS.COMPLETED, SCHEDULE_STATUS.ARCHIVED],
    },
  };

  if (excludeScheduleId) {
    tourQuery._id = { $ne: excludeScheduleId };
  }

  const existingTours = await TourSchedule.find(tourQuery).lean();
  for (const tour of existingTours) {
    const itemStart = new Date(tour.start_date);
    const itemEnd = tour.end_date ? new Date(tour.end_date) : itemStart;
    if (hasRangeOverlap(startDate, endDate, itemStart, itemEnd)) {
      return {
        ok: false,
        message: `Selected ${designation} is already assigned to another tour (${
          tour.notes || tour._id
        }) in this date range`,
      };
    }
  }

  // 2. Check Bus Trips (only for drivers)
  if (String(designation).toLowerCase().includes("driver")) {
    const busTrips = await BusTrip.find({
      driver_id: staffId,
      trip_date: { $gte: startDate, $lte: endDate },
    }).lean();

    if (busTrips.length > 0) {
      return {
        ok: false,
        message: `Selected driver has a scheduled bus trip on ${new Date(
          busTrips[0].trip_date
        ).toLocaleDateString()}. Cannot assign to tour.`,
      };
    }
  }

  return { ok: true };
};

const recalculateScheduleStatus = (schedule) => {
  const today = toDayStart(new Date());
  const endDate = schedule.end_date
    ? new Date(schedule.end_date)
    : new Date(schedule.start_date);
  const scheduleEndDay = toDayStart(endDate);

  if (scheduleEndDay < today) {
    schedule.departure_status = SCHEDULE_STATUS.COMPLETED;
    return;
  }

  if (schedule.available_seats <= 0) {
    schedule.departure_status = SCHEDULE_STATUS.BOOKING_FULL;
    return;
  }

  const current = String(schedule.departure_status || "");
  if (
    current !== SCHEDULE_STATUS.DRAFT &&
    current !== SCHEDULE_STATUS.ARCHIVED
  ) {
    schedule.departure_status = SCHEDULE_STATUS.OPEN;
  }
};

/**
 * Create a new tour schedule (admin only)
 */
const createTourDeparture = async (req, res) => {
  try {
    const {
      package_id,
      start_date,
      end_date,
      bus_id,
      driver_id, // ✅ added driver_id
      guide_id, // ✅ added guide_id
      price,
      price_per_person,
      departure_time,
      notes,
      departure_status,
    } = req.body;

    const rawPrice = price ?? price_per_person;
    const schedulePrice = Number(rawPrice);

    if (
      !package_id ||
      !start_date ||
      !bus_id ||
      rawPrice === undefined ||
      rawPrice === null ||
      rawPrice === ""
    ) {
      return res.status(400).json({
        message: "package_id, start_date, bus_id, and price are required",
      });
    }

    const nextDepartureTime = normalizeDepartureTime(departure_time);
    if (!nextDepartureTime) {
      return res
        .status(400)
        .json({ message: "departure_time is required in HH:mm format" });
    }

    if (!isValidDepartureTime(nextDepartureTime)) {
      return res
        .status(400)
        .json({ message: "departure_time must be in HH:mm format" });
    }

    if (!isValidPositiveAmount(schedulePrice)) {
      return res.status(400).json({ message: "price must be greater than 0" });
    }

    const pkg = await Package.findById(package_id);
    if (!pkg) {
      return res.status(404).json({ message: "Package not found" });
    }

    const startDate = toDate(start_date);
    const proposedEndDate = toDate(end_date);
    if (!startDate) {
      return res.status(400).json({ message: "Invalid start_date" });
    }

    if (isBeforeToday(startDate)) {
      return res.status(400).json({
        message: "start_date cannot be in the past",
      });
    }

    const leadDays = getDayDifference(new Date(), startDate);
    if (leadDays < MIN_ADMIN_SCHEDULE_LEAD_DAYS) {
      return res.status(400).json({
        message: `start_date must be at least ${MIN_ADMIN_SCHEDULE_LEAD_DAYS} days from today`,
      });
    }

    const finalEndDate = deriveEndDate(
      startDate,
      proposedEndDate,
      pkg.duration
    );
    if (!finalEndDate) {
      return res.status(400).json({ message: "Unable to derive end_date" });
    }

    if (finalEndDate < startDate) {
      return res.status(400).json({
        message: "end_date cannot be earlier than start_date",
      });
    }

    const bus = await Bus.findById(bus_id);
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    const busCheck = await ensureBusAvailability({
      busId: bus_id,
      startDate,
      endDate: finalEndDate,
    });

    // Validate driver availability
    if (driver_id) {
      const driverCheck = await ensureStaffAvailability({
        staffId: driver_id,
        designation: "driver",
        startDate,
        endDate: finalEndDate,
      });
      if (!driverCheck.ok) {
        return res.status(400).json({ message: driverCheck.message });
      }
    }

    // Validate guide availability
    if (guide_id) {
      const guideCheck = await ensureStaffAvailability({
        staffId: guide_id,
        designation: "guide",
        startDate,
        endDate: finalEndDate,
      });
      if (!guideCheck.ok) {
        return res.status(400).json({ message: guideCheck.message });
      }
    }

    const guideCheck = await ensureGuideAvailability({
      guideId: pkg.tour_guide,
      startDate,
      endDate: finalEndDate,
    });
    if (!guideCheck.ok) {
      return res.status(400).json({ message: guideCheck.message });
    }

    if (!busCheck.ok) {
      return res.status(400).json({ message: busCheck.message });
    }

    const totalSeats = bus.total_seats || 0;
    if (!totalSeats) {
      return res
        .status(400)
        .json({ message: "Bus must have total_seats configured" });
    }

    // Use the same seat-map generator as route buses so both flows stay consistent.
    const seats = buildSeatLayout({
      totalSeats,
      layoutType: bus.layout_type,
      busType: bus.bus_type,
      basePrice: schedulePrice,
      includeBookingFields: true,
    });

    const requestedStatus =
      departure_status &&
      [SCHEDULE_STATUS.DRAFT, SCHEDULE_STATUS.OPEN].includes(departure_status)
        ? departure_status
        : SCHEDULE_STATUS.DRAFT;

    const newDeparture = new TourSchedule({
      package_id,
      start_date: startDate,
      end_date: finalEndDate,
      bus_id,
      driver_id: driver_id || null, // ✅ Save driver_id
      guide_id: guide_id || null, // ✅ Save guide_id
      price: schedulePrice,
      price_per_person: schedulePrice,
      departure_time: nextDepartureTime,
      total_seats: totalSeats,
      available_seats: totalSeats,
      seats,
      departure_status: requestedStatus,
      notes,
    });

    recalculateScheduleStatus(newDeparture);

    await newDeparture.save();

    res.status(201).json({
      message: "Tour schedule created successfully",
      schedule: newDeparture,
    });
  } catch (error) {
    console.error("Error creating tour schedule:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * Get all schedules for a package
 */
const getPackageDepartures = async (req, res) => {
  try {
    const { package_id } = req.params;
    const { status } = req.query;

    if (!package_id) {
      return res.status(400).json({ message: "package_id is required" });
    }

    const query = { package_id };

    if (status) {
      const statuses = String(status)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      if (statuses.length > 0) {
        query.departure_status =
          statuses.length === 1 ? statuses[0] : { $in: statuses };
      }
    } else {
      query.departure_status = { $in: [SCHEDULE_STATUS.OPEN] };

      query.departure_status = {
        $in: [SCHEDULE_STATUS.OPEN, SCHEDULE_STATUS.LOCKED_LEGACY],
      };
    }

    const departures = await TourSchedule.find(query)
      .populate(
        "bus_id",
        "bus_name bus_number bus_type layout_type total_seats"
      )
      .populate("driver_id", "name contact_no") // ✅ Get driving staff
      .populate("guide_id", "name contact_no") // ✅ Get guide staff
      .populate({
        path: "package_id",
        select: "package_name source_city destination duration tour_guide",
        populate: { path: "tour_guide", select: "name designation" },
      })
      .sort({ start_date: 1 });

    for (const schedule of departures) {
      const previousStatus = schedule.departure_status;
      recalculateScheduleStatus(schedule);
      if (previousStatus !== schedule.departure_status) {
        await schedule.save();
      }
    }

    const sanitizedDepartures = departures.map((item) => {
      const departure = item.toObject();
      delete departure.departure_time;
      return departure;
    });

    res.status(200).json(sanitizedDepartures);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching departures",
      error: error.message,
    });
  }
};

const getAllDepartures = async (req, res) => {
  try {
    const departures = await TourSchedule.find({})
      .populate(
        "bus_id",
        "bus_name bus_number bus_type layout_type total_seats"
      )
      .populate("driver_id", "name contact_no") // ✅ Show driver
      .populate("guide_id", "name contact_no") // ✅ Show guide
      .populate({
        path: "package_id",
        select: "package_name source_city destination duration",
      })
      .sort({ start_date: 1 });

    for (const schedule of departures) {
      const previousStatus = schedule.departure_status;
      recalculateScheduleStatus(schedule);
      if (previousStatus !== schedule.departure_status) {
        await schedule.save();
      }
    }

    res.status(200).json(departures);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching departures",
      error: error.message,
    });
  }
};

/**
 * Get single schedule detail with seat map
 */
const getTourDeparture = async (req, res) => {
  try {
    const { id } = req.params;

    // Auto-complete check: if start_date has passed, mark as completed
    await autoCompleteTours();

    const departure = await TourSchedule.findById(id)
      .populate("package_id")
      .populate(
        "bus_id",
        "bus_name bus_number bus_type layout_type total_seats"
      );

    if (!departure) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    recalculateScheduleStatus(departure);
    await departure.save();

    const publicDeparture = departure.toObject();
    delete publicDeparture.departure_time;

    res.status(200).json(publicDeparture);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching departure",
      error: error.message,
    });
  }
};

/**
 * Update tour schedule (admin only)
 * Edit schedule rules:
 * - Draft/Open schedules are editable
 * - If has_bookings is true, date, bus, and price cannot be edited
 */
const updateTourDeparture = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      start_date,
      end_date,
      price,
      price_per_person,
      bus_id,
      driver_id, // ✅ Add driver_id
      guide_id, // ✅ Add guide_id
      departure_time,
      notes,
      departure_status,
    } = req.body;

    const departure = await TourSchedule.findById(id);
    if (!departure) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    recalculateScheduleStatus(departure);

    const currentStatus = String(departure.departure_status || "");

    const isDraftOrOpen = [
      SCHEDULE_STATUS.DRAFT,
      SCHEDULE_STATUS.OPEN,
    ].includes(currentStatus);
    const isLocked = currentStatus === SCHEDULE_STATUS.LOCKED_LEGACY;

    if (!isDraftOrOpen) {
      return res.status(400).json({
        message: "This schedule cannot be edited in current status",
      });
    }

    const isDateChanged = (val, current) => {
      if (val === undefined || val === null || val === "") return false;
      const d1 = new Date(val);
      const d2 = new Date(current);
      if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime()))
        return false;
      return (
        d1.getUTCFullYear() !== d2.getUTCFullYear() ||
        d1.getUTCMonth() !== d2.getUTCMonth() ||
        d1.getUTCDate() !== d2.getUTCDate()
      );
    };

    const hasCoreChange =
      isDateChanged(start_date, departure.start_date) ||
      isDateChanged(end_date, departure.end_date) ||
      (bus_id !== undefined &&
        bus_id !== "" &&
        String(bus_id) !== String(departure.bus_id)) ||
      (price !== undefined &&
        price !== "" &&
        Number(price) !== Number(departure.price)) ||
      (price_per_person !== undefined &&
        price_per_person !== "" &&
        Number(price_per_person) !== Number(departure.price_per_person));

    if (departure.has_bookings === true && hasCoreChange) {
      return res.status(400).json({
        message: "Schedules with bookings cannot change date, bus, or price",
      });
    }

    if (departure_time !== undefined) {
      const nextDepartureTime = normalizeDepartureTime(departure_time);
      if (!nextDepartureTime || !isValidDepartureTime(nextDepartureTime)) {
        return res
          .status(400)
          .json({ message: "departure_time must be in HH:mm format" });
      }
      departure.departure_time = nextDepartureTime;
    }

    const packageData = await Package.findById(
      departure.package_id,
      "duration tour_guide"
    );
    const nextStartDate = toDate(start_date) || new Date(departure.start_date);
    const nextEndDate = deriveEndDate(
      nextStartDate,
      toDate(end_date) || toDate(departure.end_date),
      packageData?.duration
    );

    if (isBeforeToday(nextStartDate)) {
      return res
        .status(400)
        .json({ message: "start_date cannot be in the past" });
    }

    const leadDays = getDayDifference(new Date(), nextStartDate);
    if (leadDays < MIN_ADMIN_SCHEDULE_LEAD_DAYS) {
      return res.status(400).json({
        message: `start_date must be at least ${MIN_ADMIN_SCHEDULE_LEAD_DAYS} days from today`,
      });
    }

    if (!nextEndDate || nextEndDate < nextStartDate) {
      return res
        .status(400)
        .json({ message: "end_date cannot be earlier than start_date" });
    }

    const nextBusId = bus_id || departure.bus_id;
    if (
      isDraftOrOpen &&
      (String(nextBusId) !== String(departure.bus_id) || start_date || end_date)
    ) {
      const busCheck = await ensureBusAvailability({
        busId: nextBusId,
        startDate: nextStartDate,
        endDate: nextEndDate,
        excludeScheduleId: departure._id,
      });
      if (!busCheck.ok) {
        return res.status(400).json({ message: busCheck.message });
      }
    }

    // Validate updated driver availability
    if (driver_id !== undefined && driver_id) {
      const driverCheck = await ensureStaffAvailability({
        staffId: driver_id,
        designation: "driver",
        startDate: nextStartDate,
        endDate: nextEndDate,
        excludeScheduleId: departure._id,
      });
      if (!driverCheck.ok) {
        return res.status(400).json({ message: driverCheck.message });
      }
    }

    // Validate updated guide availability
    if (guide_id !== undefined && guide_id) {
      const gCheck = await ensureStaffAvailability({
        staffId: guide_id,
        designation: "guide",
        startDate: nextStartDate,
        endDate: nextEndDate,
        excludeScheduleId: departure._id,
      });
      if (!gCheck.ok) {
        return res.status(400).json({ message: gCheck.message });
      }
    }

    // ✅ Apply Driver and Guide assignment checks
    if (driver_id !== undefined) departure.driver_id = driver_id || null;
    if (guide_id !== undefined) departure.guide_id = guide_id || null;

    const nextPrice = price ?? price_per_person;
    if (
      isDraftOrOpen &&
      nextPrice !== undefined &&
      nextPrice !== null &&
      nextPrice !== ""
    ) {
      if (!isValidPositiveAmount(nextPrice)) {
        return res
          .status(400)
          .json({ message: "price must be greater than 0" });
      }
      departure.price = Number(nextPrice);
      departure.price_per_person = Number(nextPrice);
    }
    if (isDraftOrOpen && bus_id) departure.bus_id = bus_id;
    if (typeof notes === "string") departure.notes = notes;
    if (
      departure_status &&
      [SCHEDULE_STATUS.DRAFT, SCHEDULE_STATUS.OPEN].includes(departure_status)
    ) {
      departure.departure_status = departure_status;
    }

    recalculateScheduleStatus(departure);

    await departure.save();

    res.status(200).json({
      message: "Schedule updated successfully",
      schedule: departure,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating schedule",
      error: error.message,
    });
  }
};

/**
 * Open schedule for bookings (admin changes status from Draft to Open)
 */
const openDeparture = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await TourSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    recalculateScheduleStatus(schedule);
    if (schedule.departure_status === SCHEDULE_STATUS.COMPLETED) {
      return res
        .status(400)
        .json({ message: "Cannot open a completed schedule" });
    }

    if (schedule.departure_status !== SCHEDULE_STATUS.DRAFT) {
      return res
        .status(400)
        .json({ message: "Only draft schedules can be opened" });
    }

    schedule.departure_status = SCHEDULE_STATUS.OPEN;
    await schedule.save();

    res.status(200).json({
      message: "Schedule opened for bookings",
      schedule,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error opening schedule",
      error: error.message,
    });
  }
};

/**
 * Delete schedule (admin only)
 * Only Draft schedules can be deleted.
 */
const deleteTourSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await TourSchedule.findById(id);

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    if (schedule.departure_status !== SCHEDULE_STATUS.DRAFT) {
      return res.status(400).json({
        message: "Only draft schedules can be deleted",
      });
    }

    await TourSchedule.findByIdAndDelete(id);
    return res.status(200).json({ message: "Schedule deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      message: "Error deleting schedule",
      error: error.message,
    });
  }
};

/**
 * Get available seats for a departure
 */
const getDepartureSeats = async (req, res) => {
  try {
    const { id } = req.params;

    const departure = await TourSchedule.findById(id);
    if (!departure) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    recalculateScheduleStatus(departure);
    await departure.save();

    const seatStatus = {
      total: departure.total_seats,
      available: departure.available_seats,
      booked: departure.total_seats - departure.available_seats,
      seats: departure.seats,
    };

    res.status(200).json(seatStatus);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching seat status",
      error: error.message,
    });
  }
};

module.exports = {
  createTourDeparture,
  getAllDepartures,
  getPackageDepartures,
  getTourDeparture,
  updateTourDeparture,
  openDeparture,
  deleteTourSchedule,
  getDepartureSeats,
};
