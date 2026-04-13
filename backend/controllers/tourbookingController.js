const Package = require("../models/Package");
const PackageBooking = require("../models/PackageBooking");
const Passenger = require("../models/Passenger");
const TourSchedule = require("../models/TourSchedule");
const { buildSeatNumbers } = require("../utils/seatLayoutHelper");

const BOOKING_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const SCHEDULE_BOOKABLE_STATUSES = new Set(["Open"]);

const INACTIVE_BOOKING_STATUSES = [
  BOOKING_STATUS.CANCELLED,
  BOOKING_STATUS.REJECTED,
];

const isActivePackageBooking = (status) => {
  const normalized = String(status || "").toLowerCase();
  return normalized !== "cancelled" && normalized !== "rejected";
};

const toDayStart = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getDayDifference = (fromDate, toDate) => {
  const msInDay = 24 * 60 * 60 * 1000;
  return Math.round((toDate - fromDate) / msInDay);
};

const getBaseFareByAge = (age, packagePrice) => {
  if (Number(age) > 0 && Number(age) < 12) return packagePrice / 2;
  return packagePrice;
};

const getBookedSeatsForPackage = async (packageId, tourScheduleId) => {
  const query = {
    package_id: packageId,
    booking_status: { $nin: INACTIVE_BOOKING_STATUSES },
  };

  if (tourScheduleId) {
    query.tour_schedule_id = tourScheduleId;
  }

  const bookings = await PackageBooking.find(query, "seat_numbers").lean();

  const bookedSeatSet = new Set();
  for (const booking of bookings) {
    for (const seat of booking.seat_numbers || []) {
      bookedSeatSet.add(seat);
    }
  }

  return [...bookedSeatSet];
};

const getPackageBookedSeats = async (req, res) => {
  try {
    const { package_id } = req.params;
    const { tour_schedule_id } = req.query;

    if (!package_id) {
      return res.status(400).json({ message: "package_id is required" });
    }

    const bookedSeats = await getBookedSeatsForPackage(
      package_id,
      tour_schedule_id
    );
    res
      .status(200)
      .json({ package_id, tour_schedule_id, booked_seats: bookedSeats });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching booked seats", error: error.message });
  }
};

const packageBooking = async (req, res) => {
  try {
    const { package_id, tour_schedule_id, travellers, pickup_location } =
      req.body;
    const passengers = Array.isArray(req.body.passengers)
      ? req.body.passengers
      : (() => {
          try {
            return JSON.parse(req.body.passengers || "[]");
          } catch (error) {
            return [];
          }
        })();
    const seat_numbers = Array.isArray(req.body.seat_numbers)
      ? req.body.seat_numbers
      : (() => {
          try {
            return JSON.parse(req.body.seat_numbers || "[]");
          } catch (error) {
            return [];
          }
        })();
    const customer_id = req.user.id;

    if (!package_id) {
      return res.status(400).json({ message: "package_id is required" });
    }

    if (!tour_schedule_id) {
      return res.status(400).json({ message: "tour_schedule_id is required" });
    }

    if (!Array.isArray(passengers) || passengers.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one passenger is required" });
    }

    if (!Array.isArray(seat_numbers) || seat_numbers.length === 0) {
      return res
        .status(400)
        .json({ message: "Please select at least one seat" });
    }

    const normalizedSeats = seat_numbers.map((seat) =>
      String(seat).trim().toUpperCase()
    );
    const uniqueSeats = new Set(normalizedSeats);
    if (uniqueSeats.size !== normalizedSeats.length) {
      return res
        .status(400)
        .json({ message: "Duplicate seats are not allowed" });
    }

    if (passengers.length !== normalizedSeats.length) {
      return res.status(400).json({
        message: "Passenger count and selected seat count must be same",
      });
    }

    const travellerCount = Number(travellers || passengers.length);
    if (travellerCount !== passengers.length) {
      return res.status(400).json({
        message: "Travellers count must match passenger count",
      });
    }

    if (travellerCount > 10) {
      return res.status(400).json({
        message: "Maximum 10 persons allowed per booking",
      });
    }

    // find package
    const pkg = await Package.findById(package_id);

    if (!pkg) {
      return res.status(404).json({ message: "package not found" });
    }

    if (!pickup_location || !String(pickup_location).trim()) {
      return res.status(400).json({ message: "pickup_location is required" });
    }

    const validPickupPoints = new Set(
      (pkg.boarding_points || pkg.pickup_points || [])
        .map((point) => String(point).trim().toLowerCase())
        .filter(Boolean)
    );

    if (
      validPickupPoints.size > 0 &&
      !validPickupPoints.has(String(pickup_location).trim().toLowerCase())
    ) {
      return res.status(400).json({
        message: "Selected pickup location is not available for this package",
      });
    }

    const tourSchedule = await TourSchedule.findById(tour_schedule_id).populate(
      "bus_id",
      "total_seats bus_type layout_type"
    );

    if (!tourSchedule) {
      return res.status(404).json({ message: "Tour schedule not found" });
    }

    if (String(tourSchedule.package_id) !== String(package_id)) {
      return res.status(400).json({
        message: "Selected tour schedule does not belong to this package",
      });
    }

    const today = toDayStart(new Date());
    const startDate = toDayStart(new Date(tourSchedule.start_date));
    const daysBeforeTravel = getDayDifference(today, startDate);

    if (daysBeforeTravel <= 0) {
      return res
        .status(400)
        .json({ message: "Travel date must be in the future" });
    }

    // Fixed booking window: users can book until 1 day before departure.
    if (daysBeforeTravel < 1) {
      return res.status(400).json({
        message: "Booking must be made at least 1 day before departure",
      });
    }

    if (daysBeforeTravel > 183) {
      return res
        .status(400)
        .json({ message: "Cannot book more than 6 months in advance" });
    }

    if (
      !SCHEDULE_BOOKABLE_STATUSES.has(
        String(tourSchedule.departure_status || "")
      )
    ) {
      return res.status(400).json({
        message: "Selected schedule is not available for booking",
      });
    }

    const schedulePrice = Number(
      tourSchedule.price ?? tourSchedule.price_per_person ?? 0
    );
    if (!Number.isFinite(schedulePrice) || schedulePrice <= 0) {
      return res.status(400).json({
        message: "Schedule price is not configured correctly",
      });
    }

    const totalSeats =
      Number(tourSchedule.total_seats || tourSchedule?.bus_id?.total_seats) ||
      0;
    if (!totalSeats) {
      return res
        .status(400)
        .json({ message: "Tour schedule seat data is not configured" });
    }

    const validSeatNumbers = new Set(
      buildSeatNumbers(
        totalSeats,
        tourSchedule?.bus_id?.layout_type,
        tourSchedule?.bus_id?.bus_type
      )
    );
    const invalidSeats = normalizedSeats.filter(
      (seat) => !validSeatNumbers.has(seat)
    );
    if (invalidSeats.length) {
      return res.status(400).json({
        message: `Invalid seat numbers: ${invalidSeats.join(", ")}`,
      });
    }

    const alreadyBookedSeats = (tourSchedule.seats || [])
      .filter((seat) => seat.is_booked)
      .map((seat) => String(seat.seat_number).toUpperCase());
    const bookedSeatSet = new Set(alreadyBookedSeats);
    const conflictSeats = normalizedSeats.filter((seat) =>
      bookedSeatSet.has(seat)
    );
    if (conflictSeats.length) {
      return res.status(409).json({
        message: `Seat(s) already booked: ${conflictSeats.join(", ")}`,
      });
    }

    if (Number(tourSchedule.available_seats || 0) < normalizedSeats.length) {
      return res.status(409).json({
        message: "Not enough seats available for selected schedule",
      });
    }

    const invalidPassengers = passengers.filter((person) => {
      const name = String(person?.name || "").trim();
      const age = Number(person?.age);
      const gender = String(person?.gender || "");
      return (
        !name ||
        !Number.isFinite(age) ||
        age <= 0 ||
        age > 120 ||
        !["Male", "Female", "Other"].includes(gender)
      );
    });

    if (invalidPassengers.length) {
      return res.status(400).json({
        message: "Each passenger must have valid name, age (1-120), and gender",
      });
    }

    const existingActiveBooking = await PackageBooking.findOne({
      customer_id: customer_id,
      tour_schedule_id,
      booking_status: {
        $in: [
          BOOKING_STATUS.PENDING,
          BOOKING_STATUS.APPROVED,
          BOOKING_STATUS.CONFIRMED,
        ],
      },
    }).lean();

    if (existingActiveBooking) {
      return res.status(409).json({
        message: "You already have an active booking for this departure",
      });
    }

    //total amount
    let totalamount = 0;
    const seatPriceDetails = [];
    for (let i = 0; i < passengers.length; i++) {
      const person = passengers[i];
      const seatNumber = normalizedSeats[i];
      const baseFare = getBaseFareByAge(person.age, schedulePrice);
      const finalFare = baseFare;

      totalamount += finalFare;
      seatPriceDetails.push({
        seat_number: seatNumber,
        age: Number(person.age),
        base_fare: baseFare,
        seat_surcharge: 0,
        final_fare: finalFare,
      });
    }

    //booking
    const booking = new PackageBooking({
      package_id: package_id,
      tour_schedule_id,
      customer_id: customer_id,
      travellers: travellerCount,
      seat_numbers: normalizedSeats,
      pickup_location: String(pickup_location).trim(),
      seat_price_details: seatPriceDetails,
      price_per_person: schedulePrice,
      total_amount: totalamount,
      booking_status: BOOKING_STATUS.PENDING,
      approval_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
    });
    const savedBooking = await booking.save();

    // Mark selected seats as booked in the specific departure and lock departure if needed.
    if (Array.isArray(tourSchedule.seats) && tourSchedule.seats.length > 0) {
      tourSchedule.seats = tourSchedule.seats.map((seat) => {
        const seatNumber = String(seat.seat_number || "").toUpperCase();
        if (normalizedSeats.includes(seatNumber)) {
          return {
            ...seat.toObject(),
            is_booked: true,
            booked_by: savedBooking._id,
          };
        }
        return seat;
      });
      tourSchedule.available_seats = tourSchedule.seats.filter(
        (s) => !s.is_booked
      ).length;
    } else {
      // Fallback when seat map is missing for old records.
      tourSchedule.available_seats = Math.max(
        0,
        Number(tourSchedule.available_seats || totalSeats) -
          normalizedSeats.length
      );
    }

    if (tourSchedule.available_seats <= 0) {
      tourSchedule.departure_status = "BookingFull";
    }
    tourSchedule.has_bookings = true;
    await tourSchedule.save();

    //save passenger
    const passengerlist = passengers.map((person, index) => {
      const isLead = index === 0;
      return {
        p_booking_id: savedBooking._id,
        passenger_name: person.name,
        age: person.age,
        gender: person.gender,
        is_lead: isLead,
      };
    });
    await Passenger.insertMany(passengerlist);

    res.status(201).json({
      message: "Booking submitted! Waiting for admin approval.",
      booking: savedBooking,
      total_amount: totalamount,
      seat_price_details: seatPriceDetails,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const confirmPackagePayment = async (req, res) => {
  try {
    const { booking_id, payment_id } = req.body;
    const customer_id = req.user.id;

    if (!booking_id || !payment_id) {
      return res
        .status(400)
        .json({ message: "booking_id and payment_id are required" });
    }

    const booking = await PackageBooking.findOne({
      _id: booking_id,
      customer_id: customer_id,
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (
      booking.booking_status === BOOKING_STATUS.CANCELLED ||
      booking.booking_status === BOOKING_STATUS.REJECTED
    ) {
      return res
        .status(400)
        .json({ message: "Cannot pay for cancelled or rejected booking" });
    }

    if (booking.booking_status !== BOOKING_STATUS.APPROVED) {
      return res
        .status(400)
        .json({ message: "Booking is not approved for payment" });
    }

    booking.payment_status = "paid";
    booking.razorpay_payment_id = payment_id;
    booking.booking_status = BOOKING_STATUS.CONFIRMED;
    await booking.save();

    return res.status(200).json({
      message: "Package payment confirmed",
      booking,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error confirming package payment",
      error: error.message,
    });
  }
};

const getAllPackageBookings = async (req, res) => {
  try {
    const bookings = await PackageBooking.find()
      .populate({ path: "package_id", select: "package_name price" })
      .populate({ path: "customer_id", select: "first_name last_name email" })
      .populate({
        path: "tour_schedule_id",
        select: "start_date end_date departure_time departure_status",
      })
      .sort({ createdAt: -1 });
    console.log("Bookings found:", bookings.length);
    if (bookings.length > 0) {
      console.log("First booking package_id:", bookings[0].package_id);
    }
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error in getAllPackageBookings:", error);
    res
      .status(500)
      .json({ message: "Error fetching bookings", error: error.message });
  }
};

const updatePackageBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const nextStatus = String(status || "").toLowerCase();
    const allowedStatuses = new Set(Object.values(BOOKING_STATUS));

    if (!allowedStatuses.has(nextStatus)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const current = await PackageBooking.findById(id);
    if (!current) return res.status(404).json({ message: "Booking not found" });

    const update = { booking_status: nextStatus };
    if (nextStatus === BOOKING_STATUS.APPROVED) {
      update.approved_at = new Date();
      update.payment_deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
    if (nextStatus === BOOKING_STATUS.REJECTED) {
      update.rejected_at = new Date();
    }
    if (nextStatus === BOOKING_STATUS.CANCELLED) {
      update.cancelled_at = new Date();
      update.cancelled_by = "admin";
      update.refund_amount = Number(current.total_amount || 0);
      update.refund_status = "pending";
      update.payment_status =
        current.payment_status === "paid" ? "refunded" : current.payment_status;
    }

    const booking = await PackageBooking.findByIdAndUpdate(
      current._id,
      update,
      { new: true }
    );

    if (
      [BOOKING_STATUS.REJECTED, BOOKING_STATUS.CANCELLED].includes(
        nextStatus
      ) &&
      booking?.tour_schedule_id
    ) {
      const schedule = await TourSchedule.findById(booking.tour_schedule_id);
      if (schedule) {
        const bookedSet = new Set(
          (booking.seat_numbers || []).map((seat) => String(seat).toUpperCase())
        );
        schedule.seats = (schedule.seats || []).map((seat) => {
          const seatNo = String(seat.seat_number || "").toUpperCase();
          if (!bookedSet.has(seatNo)) return seat;
          return {
            ...seat.toObject(),
            is_booked: false,
            booked_by: null,
          };
        });
        schedule.available_seats = (schedule.seats || []).filter(
          (seat) => !seat.is_booked
        ).length;
        if (
          schedule.available_seats > 0 &&
          schedule.departure_status === "BookingFull"
        ) {
          schedule.departure_status = "Open";
        }
        await schedule.save();
      }
    }

    res.status(200).json({ message: `Booking ${nextStatus}`, booking });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating booking status", error: error.message });
  }
};

// Get user's own bookings
const getMyBookings = async (req, res) => {
  try {
    const customer_id = req.user.id;

    const bookings = await PackageBooking.find({ customer_id: customer_id })
      .populate({
        path: "package_id",
        select: "package_name source_city destination duration hotels",
        populate: {
          path: "hotels",
          select: "name",
        },
      })
      .populate({
        path: "tour_schedule_id",
        select:
          "start_date end_date departure_status departure_time bus_id price price_per_person",
        populate: {
          path: "bus_id",
          select: "bus_number bus_name bus_type layout_type total_seats",
        },
      })
      .sort({ createdAt: -1 });

    const bookingIds = bookings.map((item) => item._id);
    const passengerDocs = await Passenger.find(
      { p_booking_id: { $in: bookingIds } },
      "p_booking_id passenger_name age gender"
    ).lean();

    const passengersByBookingId = passengerDocs.reduce((map, item) => {
      const key = String(item.p_booking_id);
      if (!map[key]) map[key] = [];
      map[key].push(item);
      return map;
    }, {});

    const safeBookings = bookings.map((bookingDoc) => {
      const booking = bookingDoc.toObject();
      const bookingStatus = String(booking.booking_status || "").toLowerCase();
      const bookingKey = String(booking._id);

      const savedPassengers = passengersByBookingId[bookingKey] || [];
      booking.passengers = savedPassengers.map((passenger, index) => ({
        name: passenger.passenger_name,
        age: passenger.age,
        gender: passenger.gender,
        seat: Array.isArray(booking.seat_numbers)
          ? booking.seat_numbers[index]
          : undefined,
      }));

      const hotelNames = Array.isArray(booking.package_id?.hotels)
        ? booking.package_id.hotels.map((hotel) => hotel?.name).filter(Boolean)
        : [];
      booking.hotel = hotelNames.join(", ");

      // Share departure time only after booking is confirmed.
      if (bookingStatus !== "confirmed" && booking.tour_schedule_id) {
        delete booking.tour_schedule_id.departure_time;
      }

      return booking;
    });

    res.status(200).json(safeBookings);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching bookings", error: error.message });
  }
};

module.exports = {
  packageBooking,
  getPackageBookedSeats,
  getAllPackageBookings,
  updatePackageBookingStatus,
  getMyBookings,
  confirmPackagePayment,
};
