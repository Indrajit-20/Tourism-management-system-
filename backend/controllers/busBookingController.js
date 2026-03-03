const BusRoute = require("../models/BusRoute");
const BusTicketBooking = require("../models/BusTicketBooking");

// 1. Book a Bus Ticket
const bookBusTicket = async (req, res) => {
  try {
    const { route_id, seat_numbers, travel_date } = req.body;
    // seat_numbers = ["1A", "2B"]

    if (!seat_numbers || seat_numbers.length === 0) {
      return res.status(400).json({ message: "No seats selected" });
    }

    const customer_id = req.user.id; // From token

    // 1. Find the Route
    const route = await BusRoute.findById(route_id);
    if (!route) return res.status(404).json({ message: "Route not found" });

    const existingBookings = await BusTicketBooking.find({
      route_id: route_id,
      travel_date: travel_date,
      seat_numbers: { $in: seat_numbers }, // Check if ANY requested seat is already taken
      booking_status: { $ne: "Rejected" },
    });

    if (existingBookings.length > 0) {
      return res.status(400).json({
        message: "Some seats are already booked. Please refresh and try again.",
      });
    }

    // 3. Calculate Price
    const seats_count = seat_numbers.length;
    const total_amount = route.price_per_seat * seats_count;

    // 4. Create Booking
    const newBooking = new BusTicketBooking({
      route_id: route_id,
      custmer_id: customer_id,
      travel_date: travel_date,
      travellers: seats_count,
      seat_numbers: seat_numbers, // Save specific seats
      price_per_seat: route.price_per_seat,
      total_amount: total_amount,
      booking_status: "Pending", // Changed from Confirmed to Pending
    });

    await newBooking.save();

    res.status(201).json({
      message: "Bus Ticket Requested! Waiting for Admin Approval.",
      booking: newBooking,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Booking failed", error: error.message });
  }
};

// 2. Get All Bookings (Admin)
const getAllBookings = async (req, res) => {
  try {
    const bookings = await BusTicketBooking.find()
      .populate("custmer_id", "name email")
      .populate({
        path: "route_id",
        populate: { path: "bus_id", select: "bus_number" },
      });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings", error });
  }
};

// 3. Update Booking Status (Admin: Approve/Reject)
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body; // "Confirmed" or "Rejected"
    const booking = await BusTicketBooking.findByIdAndUpdate(
      req.params.id,
      { booking_status: status },
      { new: true }
    );
    res.status(200).json({ message: `Booking ${status}`, booking });
  } catch (error) {
    res.status(500).json({ message: "Error updating status", error });
  }
};

// 4. Get Booked Seats for a specific Route and Date
const getBookedSeats = async (req, res) => {
  try {
    const { route_id, travel_date } = req.query;

    // Find all bookings for this route on this date
    const bookings = await BusTicketBooking.find({
      route_id: route_id,
      travel_date: travel_date,
      booking_status: { $ne: "Rejected" }, // Ignore rejected bookings
    });

    // Extract all seat numbers into a single flat array
    // bookings = [ { seat_numbers: ["1A", "1B"] }, { seat_numbers: ["2A"] } ]
    // result = ["1A", "1B", "2A"]
    const bookedSeats = bookings.flatMap((b) => b.seat_numbers);

    res.status(200).json(bookedSeats);
  } catch (error) {
    res.status(500).json({ message: "Error fetching seats", error });
  }
};

// 5. Get user's own bookings
const getMyBookings = async (req, res) => {
  try {
    const customer_id = req.user.id;

    const bookings = await BusTicketBooking.find({ custmer_id: customer_id })
      .populate("custmer_id", "name email")
      .populate({
        path: "route_id",
        populate: { path: "bus_id", select: "bus_name bus_number" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings", error });
  }
};

module.exports = {
  bookBusTicket,
  getAllBookings,
  updateBookingStatus,
  getBookedSeats,
  getMyBookings,
};
