const BusTrip = require("../models/BusTrip");
const Staff = require("../models/Staff");
const BusTicketBooking = require("../models/BusTicketBooking");
const TourSchedule = require("../models/TourSchedule");
const PackageBooking = require("../models/PackageBooking");

// ✅ 1. Get Staff Dashboard (Assigned Trips)
const getStaffDashboard = async (req, res) => {
  try {
    const staff_id = req.user.id;

    // Get staff details
    const staff = await Staff.findById(staff_id).select(
      "name designation email_id contact_no"
    );
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // Get trips assigned to this staff (driver_id = staff_id)
    // Show upcoming and today's trips
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingTrips = await BusTrip.find({
      driver_id: staff_id,
      trip_date: { $gte: today },
      status: { $in: ["Scheduled", "Running"] },
    })
      .populate("bus_id", "bus_number bus_type capacity")
      .populate({
        path: "schedule_id",
        populate: {
          path: "route_id",
          select:
            "boarding_from destination price_per_seat departure_time arrival_time",
        },
      })
      .sort({ trip_date: 1 })
      .limit(10);

    // Get today's trips specifically
    const tomorrowStart = new Date(today);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const todayTrips = await BusTrip.find({
      driver_id: staff_id,
      trip_date: { $gte: today, $lt: tomorrowStart },
      status: { $in: ["Scheduled", "Running"] },
    })
      .populate("bus_id", "bus_number bus_type capacity")
      .populate({
        path: "schedule_id",
        populate: {
          path: "route_id",
          select:
            "boarding_from destination price_per_seat departure_time arrival_time",
        },
      })
      .sort({ trip_date: 1 });

    // Get completed trips (last 5)
    const completedTrips = await BusTrip.find({
      driver_id: staff_id,
      status: "Completed",
    })
      .populate("bus_id", "bus_number bus_type")
      .populate({
        path: "schedule_id",
        populate: {
          path: "route_id",
          select: "boarding_from destination",
        },
      })
      .sort({ trip_date: -1 })
      .limit(5);

    // Count bookings for each trip
    const tripStats = [];
    for (let trip of upcomingTrips) {
      const bookingCount = await BusTicketBooking.countDocuments({
        trip_id: trip._id,
        booking_status: "Confirmed",
      });
      tripStats.push({
        tripId: trip._id,
        confirmedPassengers: bookingCount,
      });
    }

    // ====== ADDED LOGIC FOR TOUR SCHEDULES ======
    // Get tours assigned to this staff (driver_id OR guide_id)
    const upcomingTours = await TourSchedule.find({
      $or: [{ driver_id: staff_id }, { guide_id: staff_id }],
      start_date: { $gte: today },
      departure_status: { $in: ["Open", "BookingFull", "Locked"] },
    })
      .populate("bus_id", "bus_number bus_type")
      .populate({
        path: "package_id",
        select:
          "package_name source_city destination duration hotels tour_guide",
        populate: {
          path: "hotels",
          select: "hotel_name location contact_number description",
        },
      })
      .sort({ start_date: 1 });

    const todayTours = await TourSchedule.find({
      $or: [{ driver_id: staff_id }, { guide_id: staff_id }],
      start_date: { $lte: today },
      $or: [
        { end_date: { $gte: today } },
        { end_date: null }, // if there's no end date, maybe it's just today
      ],
      departure_status: { $in: ["Open", "BookingFull", "Locked"] },
    })
      .populate("bus_id", "bus_number bus_type")
      .populate({
        path: "package_id",
        select: "package_name source_city destination duration hotels",
        populate: {
          path: "hotels",
          select: "hotel_name location contact_number description",
        },
      })
      .sort({ start_date: 1 });

    const completedTours = await TourSchedule.find({
      $or: [{ driver_id: staff_id }, { guide_id: staff_id }],
      departure_status: "Completed",
    })
      .populate("bus_id", "bus_number")
      .populate({
        path: "package_id",
        select: "package_name source_city destination",
      })
      .sort({ start_date: -1 })
      .limit(5);

    // ============================================

    res.status(200).json({
      success: true,
      staff: {
        id: staff._id,
        name: staff.name,
        designation: staff.designation,
        email: staff.email_id,
        contact: staff.contact_no,
      },
      upcomingTrips,
      todayTrips,
      completedTrips,
      upcomingTours, // ✅ Added
      todayTours, // ✅ Added
      completedTours, // ✅ Added
      stats: {
        totalUpcomingTrips: upcomingTrips.length + upcomingTours.length,
        totalTodayTrips: todayTrips.length + todayTours.length,
        totalCompletedTrips: completedTrips.length + completedTours.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching staff dashboard",
      error: error.message,
    });
  }
};

// ✅ 2. Get Trip Details with Passenger List
const getTripDetails = async (req, res) => {
  try {
    const { trip_id } = req.params;
    const staff_id = req.user.id;

    // Get trip
    const trip = await BusTrip.findById(trip_id)
      .populate("bus_id", "bus_number bus_type capacity")
      .populate({
        path: "schedule_id",
        populate: {
          path: "route_id",
          select:
            "boarding_from destination price_per_seat departure_time arrival_time",
        },
      });

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    // Verify staff is assigned to this trip
    if (trip.driver_id.toString() !== staff_id) {
      return res.status(403).json({ message: "Unauthorized: Not your trip" });
    }

    // Get all confirmed bookings for this trip
    const bookings = await BusTicketBooking.find({
      trip_id: trip_id,
      booking_status: "Confirmed",
    })
      .populate("customer_id", "first_name last_name phone_no email")
      .sort({ seat_numbers: 1 });

    // Get total passengers
    let totalPassengers = 0;
    bookings.forEach((booking) => {
      totalPassengers += booking.seat_numbers.length;
    });

    // Calculate seat occupancy
    const totalSeats = trip.seats.length;
    const bookedSeats = trip.seats.filter((s) => !s.is_available).length;
    const availableSeats = totalSeats - bookedSeats;
    const occupancyPercent = Math.round((bookedSeats / totalSeats) * 100);

    res.status(200).json({
      success: true,
      trip: {
        id: trip._id,
        busNumber: trip.bus_id.bus_number,
        busType: trip.bus_id.bus_type,
        route: {
          from: trip.schedule_id.route_id.boarding_from,
          to: trip.schedule_id.route_id.destination,
          departureTime: trip.schedule_id.route_id.departure_time,
          arrivalTime: trip.schedule_id.route_id.arrival_time,
        },
        tripDate: trip.trip_date,
        status: trip.status,
        boardingPoints: trip.boarding_points || [],
      },
      passengers: bookings.map((booking) => ({
        id: booking._id,
        name: `${booking.customer_id.first_name} ${booking.customer_id.last_name}`,
        phone: booking.customer_id.phone_no,
        email: booking.customer_id.email,
        seats: booking.seat_numbers.join(", "),
        totalAmount: booking.total_amount,
      })),
      stats: {
        totalPassengers,
        totalSeats,
        bookedSeats,
        availableSeats,
        occupancyPercent,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching trip details",
      error: error.message,
    });
  }
};

// ====== NEW: Get Tour Details with Passenger List and Hotels ======
const getTourDetails = async (req, res) => {
  try {
    const { tour_id } = req.params;
    const staff_id = req.user.id;

    // Get tour
    const tour = await TourSchedule.findById(tour_id)
      .populate("bus_id", "bus_number bus_type capacity")
      .populate({
        path: "package_id",
        select:
          "package_name source_city destination price duration itinerary hotels",
        populate: {
          path: "hotels",
          select:
            "hotel_name hotel_type contact_number email description room_types",
        },
      });

    if (!tour) {
      return res.status(404).json({ message: "Tour not found" });
    }

    // Verify staff is assigned (driver or guide)
    if (
      (!tour.driver_id || tour.driver_id.toString() !== staff_id) &&
      (!tour.guide_id || tour.guide_id.toString() !== staff_id)
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Not your assigned tour" });
    }

    // Get all confirmed bookings for this tour
    const bookings = await PackageBooking.find({
      tour_schedule_id: tour_id,
      booking_status: "confirmed",
    }).populate("customer_id", "first_name last_name phone_no email");

    let totalPassengers = 0;
    const passengers = [];
    bookings.forEach((booking) => {
      totalPassengers += booking.travellers;
      passengers.push({
        id: booking._id,
        name: `${booking.customer_id?.first_name || ""} ${
          booking.customer_id?.last_name || ""
        }`,
        phone: booking.customer_id?.phone_no || "",
        email: booking.customer_id?.email || "",
        totalAmount: booking.total_amount,
        seat_numbers: booking.seat_numbers,
        pickup_location: booking.pickup_location || "Not specified",
        passengerDetails: booking.other_travelers || [], // For backward compat
      });
    });

    res.status(200).json({
      success: true,
      tour: {
        id: tour._id,
        package: tour.package_id.package_name,
        source: tour.package_id.source_city,
        destination: tour.package_id.destination,
        startDate: tour.start_date,
        endDate: tour.end_date,
        departureTime: tour.departure_time,
        busNumber: tour.bus_id ? tour.bus_id.bus_number : "TBD",
        status: tour.departure_status,
        hotels: tour.package_id.hotels || [], // Add hotels
      },
      passengers,
      stats: {
        totalPassengers,
        totalSeats: tour.total_seats,
        availableSeats: tour.available_seats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching tour details",
      error: error.message,
    });
  }
};
// =================================================================

// ✅ 3. Update Trip Status (Scheduled → Running → Completed)
const updateTripStatus = async (req, res) => {
  try {
    const { trip_id } = req.params;
    const { status } = req.body;
    const staff_id = req.user.id;

    // Validate status
    if (!["Scheduled", "Running", "Completed", "Cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Get trip
    const trip = await BusTrip.findById(trip_id);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    // Verify staff is assigned
    if (trip.driver_id.toString() !== staff_id) {
      return res.status(403).json({ message: "Unauthorized: Not your trip" });
    }

    // Update status
    trip.status = status;
    await trip.save();

    res.status(200).json({
      success: true,
      message: `Trip status updated to ${status}`,
      trip,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating trip status",
      error: error.message,
    });
  }
};

// ✅ 4. Get Staff Schedule (Weekly View)
const getStaffSchedule = async (req, res) => {
  try {
    const staff_id = req.user.id;
    const { week_start } = req.query; // ISO date string

    // Default to today's week
    let startDate = new Date(week_start || new Date());
    startDate.setHours(0, 0, 0, 0);

    // Start from Monday
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
    startDate.setDate(diff);

    // End date is next Monday
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    // Get all trips for this week
    const weekTrips = await BusTrip.find({
      driver_id: staff_id,
      trip_date: { $gte: startDate, $lt: endDate },
    })
      .populate("bus_id", "bus_number bus_type")
      .populate({
        path: "schedule_id",
        populate: {
          path: "route_id",
          select: "boarding_from destination departure_time arrival_time",
        },
      })
      .sort({ trip_date: 1 });

    // Group by day of week
    const scheduleByDay = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };

    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    weekTrips.forEach((trip) => {
      const dayName = dayNames[new Date(trip.trip_date).getDay()];
      scheduleByDay[dayName].push({
        tripId: trip._id,
        date: trip.trip_date,
        busNumber: trip.bus_id.bus_number,
        route: `${trip.schedule_id.route_id.boarding_from} → ${trip.schedule_id.route_id.destination}`,
        departureTime: trip.schedule_id.route_id.departure_time,
        arrivalTime: trip.schedule_id.route_id.arrival_time,
        status: trip.status,
      });
    });

    res.status(200).json({
      success: true,
      weekStart: startDate,
      weekEnd: endDate,
      schedule: scheduleByDay,
      totalTripsThisWeek: weekTrips.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching schedule",
      error: error.message,
    });
  }
};

module.exports = {
  getStaffDashboard,
  getTripDetails,
  getTourDetails, // ✅ Added export for Tours
  updateTripStatus,
  getStaffSchedule,
};
