const BusTrip = require("../models/BusTrip");
const BusTicketBooking = require("../models/BusTicketBooking");
const Custmer = require("../models/Custmer");

const parseTimeToMinutes = (value) => {
  const text = String(value || "").trim().toUpperCase();
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

// 1. BOOK BUS TICKET (User)
const bookBusTicket = async (req, res) => {
  try {
    const { trip_id, seat_numbers } = req.body;
    const customer_id = req.user.id;

    if (!seat_numbers || seat_numbers.length === 0) {
      return res.status(400).json({ message: "No seats selected" });
    }

    // Find trip with full details
    const trip = await BusTrip.findById(trip_id).populate({
      path: "schedule_id",
      populate: { path: "route_id" },
    });
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    // Block booking when today's departure time has already passed.
    const scheduleDeparture = trip.schedule_id?.departure_time;
    if (scheduleDeparture) {
      const now = new Date();
      const tripDate = new Date(trip.trip_date);
      const isToday = now.toDateString() === tripDate.toDateString();
      if (isToday) {
        const departureMinutes = parseTimeToMinutes(scheduleDeparture);
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        if (departureMinutes !== null && nowMinutes >= departureMinutes) {
          return res.status(400).json({
            message: "Booking is closed for this trip because departure time has passed.",
          });
        }
      }
    }

    // Validate seats exist
    const seatMap = new Map(trip.seats.map((s) => [s.seat_number, s]));
    const invalidSeats = seat_numbers.filter((s) => !seatMap.has(s));
    if (invalidSeats.length) {
      return res
        .status(400)
        .json({ message: "Some seats do not exist", invalidSeats });
    }

    // Check seats are available
    const alreadyBooked = seat_numbers.filter(
      (s) => !seatMap.get(s).is_available
    );
    if (alreadyBooked.length) {
      return res.status(400).json({
        message:
          "Some seats are already booked. Please select different seats.",
        alreadyBooked,
      });
    }

    // ✅ Calculate total using dynamic per-seat prices
    let totalAmount = 0;
    const seatPrices = seat_numbers.map((seatNum) => {
      const seat = seatMap.get(seatNum);
      const price =
        seat.price || trip.schedule_id?.route_id?.price_per_seat || 0;
      totalAmount += price;
      return price;
    });

    const avgPrice = Math.round(totalAmount / seat_numbers.length);

    // Calculate smart payment deadline based on trip date
    const calculatePaymentDeadline = (trip_date) => {
      const now = new Date();
      const tripDate = new Date(trip_date);
      const hoursUntilTrip = (tripDate - now) / (1000 * 60 * 60);

      const deadline = new Date();

      if (hoursUntilTrip < 2) {
        deadline.setHours(deadline.getHours() + 1);
      } else if (hoursUntilTrip <= 24) {
        deadline.setHours(deadline.getHours() + 12);
      } else {
        deadline.setHours(deadline.getHours() + 24);
      }

      return deadline;
    };

    // ✅ AUTO-CONFIRM: Save booking as CONFIRMED immediately
    // ✅ BUT: Only lock seats AFTER payment is confirmed in confirmPayment()
    const newBooking = new BusTicketBooking({
      trip_id,
      customer_id,
      travel_date: trip.trip_date,
      travellers: seat_numbers.length,
      seat_numbers,
      seat_prices: seatPrices,
      price_per_seat: avgPrice,
      total_amount: totalAmount,
      booking_status: "Confirmed",
      payment_status: "Pending",
      payment_deadline: calculatePaymentDeadline(trip.trip_date),
    });

    // ✅ Save booking WITHOUT locking seats yet
    await newBooking.save();

    res.status(201).json({
      message: "Booking created. Please complete payment to confirm.",
      booking: newBooking,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Booking failed", error: error.message });
  }
};

// 2. GET ALL BOOKINGS (Admin)

const getAllBookings = async (req, res) => {
  try {
    const bookings = await BusTicketBooking.find()

      .populate("customer_id", "first_name last_name email")
      .populate({
        path: "trip_id",
        populate: [
          { path: "bus_id", select: "bus_number bus_type" },
          {
            path: "schedule_id",
            select: "departure_time arrival_time route_id",
            populate: {
              path: "route_id",
              select: "boarding_from board_point destination drop_point price_per_seat",
            },
          },
        ],
      })
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings", error });
  }
};

// 3. UPDATE BOOKING STATUS (Admin)

const updateBookingStatus = async (req, res) => {
  try {
    const { status, reason } = req.body; // "Cancelled"

    const booking = await BusTicketBooking.findById(req.params.id)
      .populate("customer_id", "first_name last_name email")
      .populate({
        path: "trip_id",
        populate: {
          path: "schedule_id",
          populate: { path: "route_id" },
        },
      });

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (status === "Cancelled") {
      if (!String(reason || "").trim()) {
        return res.status(400).json({
          message: "Cancellation reason is required.",
        });
      }

      booking.booking_status = "Cancelled";
      booking.payment_status =
        booking.payment_status === "Paid" ? "Refunded" : "Failed";
      booking.cancellation_reason = String(reason).trim();
      await booking.save();

      // Release seats back when cancelled
      const trip = await require("../models/BusTrip").findById(
        booking.trip_id._id
      );
      if (trip) {
        trip.seats = trip.seats.map((seat) =>
          booking.seat_numbers.includes(seat.seat_number)
            ? { ...seat.toObject(), is_available: true }
            : seat
        );
        await trip.save();
      }

      return res
        .status(200)
        .json({ message: "Booking cancelled. Seats released.", booking });
    }

    res.status(400).json({ message: "Invalid status. Use Cancelled." });
  } catch (error) {
    res.status(500).json({ message: "Error updating status", error });
  }
};

// 4. CONFIRM PAYMENT (User pays after booking)

const confirmPayment = async (req, res) => {
  try {
    const { booking_id, payment_id } = req.body;

    const booking = await BusTicketBooking.findById(booking_id)
      .populate("customer_id", "first_name last_name email")
      .populate({
        path: "trip_id",
        populate: {
          path: "schedule_id",
          populate: { path: "route_id" },
        },
      });

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Booking must be in Confirmed state before payment confirmation.
    if (booking.booking_status !== "Confirmed") {
      return res.status(400).json({
        message: "Invalid booking status. Booking must be in Confirmed state.",
      });
    }

    // Check payment deadline has not expired
    if (booking.payment_deadline && new Date() > booking.payment_deadline) {
      booking.booking_status = "Cancelled";
      booking.payment_status = "Failed";
      await booking.save();

      return res.status(400).json({
        message:
          "Payment deadline expired. Booking has been cancelled. Please book again.",
      });
    }

    // ✅ CONFIRM PAYMENT AND LOCK SEATS
    booking.payment_status = "Paid";
    booking.payment_id = payment_id;
    await booking.save();

    // ✅ NOW LOCK THE SEATS (only after payment confirmed)
    const trip = await require("../models/BusTrip").findById(
      booking.trip_id._id
    );
    if (trip) {
      trip.seats = trip.seats.map((seat) =>
        booking.seat_numbers.includes(seat.seat_number)
          ? { ...seat.toObject(), is_available: false }
          : seat
      );
      await trip.save();
    }

    res.status(200).json({
      message: "Payment confirmed! Seats locked. Ticket booked successfully.",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: "Error confirming payment", error });
  }
};

// 5. AUTO CANCEL EXPIRED BOOKINGS

const autoCancelExpiredBookings = async () => {
  try {
    const now = new Date();

    // Find all confirmed bookings where deadline has passed
    const expiredBookings = await BusTicketBooking.find({
      booking_status: "Confirmed",
      payment_status: "Pending",
      payment_deadline: { $lt: now },
    });

    for (const booking of expiredBookings) {
      // Cancel booking
      booking.booking_status = "Cancelled";
      booking.payment_status = "Failed";
      booking.cancellation_reason = "Payment deadline expired";
      await booking.save();

      // Release seats back
      const BusTrip = require("../models/BusTrip");
      const trip = await BusTrip.findById(booking.trip_id);
      if (trip) {
        trip.seats = trip.seats.map((seat) =>
          booking.seat_numbers.includes(seat.seat_number)
            ? { ...seat.toObject(), is_available: true }
            : seat
        );
        await trip.save();
      }

      console.log(`✅ Auto-cancelled expired booking: ${booking._id}`);
    }

    if (expiredBookings.length > 0) {
      console.log(
        `✅ Auto-cancelled ${expiredBookings.length} expired bookings`
      );
    }
  } catch (err) {
    console.error("Auto-cancel error:", err.message);
  }
};

// 6. GET BOOKED SEATS for a trip

const getBookedSeats = async (req, res) => {
  try {
    const { trip_id } = req.query;

    const bookings = await BusTicketBooking.find({
      trip_id,
      booking_status: { $ne: "Cancelled" },
      payment_status: "Paid",
    });

    const bookedSeats = bookings.flatMap((b) => b.seat_numbers);
    res.status(200).json(bookedSeats);
  } catch (error) {
    res.status(500).json({ message: "Error fetching seats", error });
  }
};

// 7. GET MY BOOKINGS (User)

const getMyBookings = async (req, res) => {
  try {
    const customer_id = req.user.id;

    const bookings = await BusTicketBooking.find({ customer_id })
      .populate("customer_id", "first_name last_name email")
      .populate({
        path: "trip_id",
        populate: [
          { path: "bus_id", select: "bus_name bus_number bus_type" },
          {
            path: "schedule_id",
            populate: { path: "route_id" },
          },
        ],
      })
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings", error });
  }
};

// ✅ 8. CANCEL BOOKING (User)

const cancelBooking = async (req, res) => {
  try {
    const { id: booking_id } = req.params;
    const customer_id = req.user.id;

    const booking = await BusTicketBooking.findById(booking_id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Security check — user can only cancel their own booking
    if (booking.customer_id.toString() !== customer_id) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Not your booking" });
    }

    // Only Pending or Confirmed bookings can be cancelled
    if (
      booking.booking_status !== "Pending" &&
      booking.booking_status !== "Confirmed"
    ) {
      return res.status(400).json({
        message: `Cannot cancel ${booking.booking_status} booking. Only Pending or Confirmed bookings can be cancelled.`,
      });
    }

    const reason = String(req.body?.reason || "Cancelled by customer").trim();

    // Cancel the booking
    booking.booking_status = "Cancelled";
    booking.payment_status =
      booking.payment_status === "Paid" ? "Refunded" : "Failed";
    booking.cancellation_reason = reason;
    await booking.save();

    // Release seats back to available
    const trip = await require("../models/BusTrip").findById(booking.trip_id);
    if (trip) {
      trip.seats = trip.seats.map((seat) =>
        booking.seat_numbers.includes(seat.seat_number)
          ? { ...seat.toObject(), is_available: true }
          : seat
      );
      await trip.save();
    }

    res.status(200).json({
      message: "Booking cancelled successfully. Seats released.",
      booking,
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({
      message: "Error cancelling booking",
      error: error.message,
    });
  }
};

module.exports = {
  bookBusTicket,
  getAllBookings,
  updateBookingStatus,
  confirmPayment,
  getBookedSeats,
  getMyBookings,
  autoCancelExpiredBookings,
  cancelBooking, // ✅ NEW
};
