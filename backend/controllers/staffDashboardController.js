const BusTrip = require("../models/BusTrip");
const Staff = require("../models/Staff");
const BusTicketBooking = require("../models/BusTicketBooking");

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
      stats: {
        totalUpcomingTrips: upcomingTrips.length,
        totalTodayTrips: todayTrips.length,
        totalCompletedTrips: completedTrips.length,
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
  updateTripStatus,
  getStaffSchedule,
};
