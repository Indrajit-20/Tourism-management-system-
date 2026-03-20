const Package = require("../models/Package");
const PackageBooking = require("../models/PackageBooking");
const Passenger = require("../models/Passenger");

const isActivePackageBooking = (status) => {
  return status !== "Cancelled" && status !== "Rejected";
};

const buildSeatNumbers = (totalSeats, busType) => {
  const isSleeper = /sleeper/i.test(String(busType || ""));
  const seats = [];

  if (isSleeper) {
    const upperCount = Math.ceil(totalSeats / 2);
    const lowerCount = totalSeats - upperCount;

    for (let i = 1; i <= upperCount; i++) seats.push(`U${i}`);
    for (let i = 1; i <= lowerCount; i++) seats.push(`L${i}`);
    return seats;
  }

  for (let i = 1; i <= totalSeats; i++) {
    seats.push(`S${i}`);
  }
  return seats;
};

const getSeatSurcharge = (seatNumber) => {
  const seatIndex = Number(String(seatNumber).replace(/\D/g, ""));
  if (!seatIndex || Number.isNaN(seatIndex)) return 0;
  if (seatIndex <= 4) return 300;
  if (seatIndex <= 10) return 150;
  return 0;
};

const getBaseFareByAge = (age, packagePrice) => {
  if (Number(age) > 0 && Number(age) < 12) return packagePrice / 2;
  return packagePrice;
};

const getBookedSeatsForPackage = async (packageId) => {
  const bookings = await PackageBooking.find(
    {
      Package_id: packageId,
      booking_status: { $nin: ["Cancelled", "Rejected"] },
    },
    "seat_numbers"
  ).lean();

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

    if (!package_id) {
      return res.status(400).json({ message: "package_id is required" });
    }

    const bookedSeats = await getBookedSeatsForPackage(package_id);
    res.status(200).json({ package_id, booked_seats: bookedSeats });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching booked seats", error: error.message });
  }
};

const packageBooking = async (req, res) => {
  try {
    const { package_id, travellers, passengers, seat_numbers } = req.body;
    const customer_id = req.user.id;

    if (!Array.isArray(passengers) || passengers.length === 0) {
      return res.status(400).json({ message: "At least one passenger is required" });
    }

    if (!Array.isArray(seat_numbers) || seat_numbers.length === 0) {
      return res.status(400).json({ message: "Please select at least one seat" });
    }

    const normalizedSeats = seat_numbers.map((seat) => String(seat).trim().toUpperCase());
    const uniqueSeats = new Set(normalizedSeats);
    if (uniqueSeats.size !== normalizedSeats.length) {
      return res.status(400).json({ message: "Duplicate seats are not allowed" });
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

    //find pkg
    const pkg = await Package.findById(package_id).populate("bus_id", "total_seats bus_type");

    if (!pkg) {
      return res.status(404).json({ message: "package not found" });
    }

    const totalSeats = Number(pkg?.bus_id?.total_seats) || 0;
    if (!totalSeats) {
      return res.status(400).json({ message: "Package bus seats not configured" });
    }

    const validSeatNumbers = new Set(
      buildSeatNumbers(totalSeats, pkg?.bus_id?.bus_type)
    );
    const invalidSeats = normalizedSeats.filter((seat) => !validSeatNumbers.has(seat));
    if (invalidSeats.length) {
      return res.status(400).json({
        message: `Invalid seat numbers: ${invalidSeats.join(", ")}`,
      });
    }

    const alreadyBookedSeats = await getBookedSeatsForPackage(package_id);
    const bookedSeatSet = new Set(alreadyBookedSeats);
    const conflictSeats = normalizedSeats.filter((seat) => bookedSeatSet.has(seat));
    if (conflictSeats.length) {
      return res.status(409).json({
        message: `Seat(s) already booked: ${conflictSeats.join(", ")}`,
      });
    }

    //total amount
    let totalamount = 0;
    const seatPriceDetails = [];
    for (let i = 0; i < passengers.length; i++) {
      const person = passengers[i];
      const seatNumber = normalizedSeats[i];
      const baseFare = getBaseFareByAge(person.age, pkg.price);
      const seatSurcharge = getSeatSurcharge(seatNumber);
      const finalFare = baseFare + seatSurcharge;

      totalamount += finalFare;
      seatPriceDetails.push({
        seat_number: seatNumber,
        age: Number(person.age),
        base_fare: baseFare,
        seat_surcharge: seatSurcharge,
        final_fare: finalFare,
      });
    }

    //booking
    const booking = new PackageBooking({
      Package_id: package_id,
      Custmer_id: customer_id,
      travellers: travellerCount,
      seat_numbers: normalizedSeats,
      seat_price_details: seatPriceDetails,
      price_per_person: pkg.price,
      total_amount: totalamount,
      booking_status: "Pending",
    });
    const savedBooking = await booking.save();

    //save passenger
    const passengerlist = passengers.map((person) => ({
      p_booking_id: savedBooking._id,
      passenger_name: person.name,
      age: person.age,
      gender: person.gender,
    }));
    await Passenger.insertMany(passengerlist);

    res
      .status(201)
      .json({
        message: "Booking successful",
        booking: savedBooking,
        total_amount: totalamount,
        seat_price_details: seatPriceDetails,
      });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllPackageBookings = async (req, res) => {
  try {
    const bookings = await PackageBooking.find()
      .populate({ path: "Package_id", select: "package_name price" })
      .populate({ path: "Custmer_id", select: "first_name last_name email" });
    console.log("Bookings found:", bookings.length);
    if (bookings.length > 0) {
      console.log("First booking Package_id:", bookings[0].Package_id);
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
    const { status } = req.body; // should be 'Confirmed', 'Rejected', etc.

    const booking = await PackageBooking.findByIdAndUpdate(
      id,
      { booking_status: status },
      { new: true }
    );

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    res.status(200).json({ message: `Booking ${status}`, booking });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating booking status", error: error.message });
  }
};

const updateMyPackageBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const customer_id = req.user.id;
    const { travellers, passengers, seat_numbers } = req.body;

    if (!Array.isArray(passengers) || passengers.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one passenger is required" });
    }

    if (!Array.isArray(seat_numbers) || seat_numbers.length === 0) {
      return res.status(400).json({ message: "Please select at least one seat" });
    }

    const booking = await PackageBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (String(booking.Custmer_id) !== String(customer_id)) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Not your booking" });
    }

    if (booking.booking_status !== "Pending") {
      return res.status(400).json({
        message: "Only pending bookings can be updated",
      });
    }

    const normalizedSeats = seat_numbers.map((seat) =>
      String(seat).trim().toUpperCase()
    );
    const uniqueSeats = new Set(normalizedSeats);
    if (uniqueSeats.size !== normalizedSeats.length) {
      return res.status(400).json({ message: "Duplicate seats are not allowed" });
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

    const pkg = await Package.findById(booking.Package_id).populate(
      "bus_id",
      "total_seats bus_type"
    );
    if (!pkg) {
      return res.status(404).json({ message: "package not found" });
    }

    const totalSeats = Number(pkg?.bus_id?.total_seats) || 0;
    if (!totalSeats) {
      return res.status(400).json({ message: "Package bus seats not configured" });
    }

    const validSeatNumbers = new Set(
      buildSeatNumbers(totalSeats, pkg?.bus_id?.bus_type)
    );
    const invalidSeats = normalizedSeats.filter((seat) => !validSeatNumbers.has(seat));
    if (invalidSeats.length) {
      return res.status(400).json({
        message: `Invalid seat numbers: ${invalidSeats.join(", ")}`,
      });
    }

    const siblingBookings = await PackageBooking.find(
      {
        Package_id: booking.Package_id,
        _id: { $ne: booking._id },
        booking_status: { $nin: ["Cancelled", "Rejected"] },
      },
      "seat_numbers"
    ).lean();

    const bookedSeatSet = new Set();
    for (const siblingBooking of siblingBookings) {
      for (const seat of siblingBooking.seat_numbers || []) {
        bookedSeatSet.add(seat);
      }
    }

    const conflictSeats = normalizedSeats.filter((seat) => bookedSeatSet.has(seat));
    if (conflictSeats.length) {
      return res.status(409).json({
        message: `Seat(s) already booked: ${conflictSeats.join(", ")}`,
      });
    }

    let totalamount = 0;
    const seatPriceDetails = [];
    for (let i = 0; i < passengers.length; i++) {
      const person = passengers[i];
      const seatNumber = normalizedSeats[i];
      const baseFare = getBaseFareByAge(person.age, pkg.price);
      const seatSurcharge = getSeatSurcharge(seatNumber);
      const finalFare = baseFare + seatSurcharge;

      totalamount += finalFare;
      seatPriceDetails.push({
        seat_number: seatNumber,
        age: Number(person.age),
        base_fare: baseFare,
        seat_surcharge: seatSurcharge,
        final_fare: finalFare,
      });
    }

    booking.travellers = travellerCount;
    booking.seat_numbers = normalizedSeats;
    booking.seat_price_details = seatPriceDetails;
    booking.price_per_person = pkg.price;
    booking.total_amount = totalamount;
    const savedBooking = await booking.save();

    await Passenger.deleteMany({ p_booking_id: booking._id });
    const passengerlist = passengers.map((person) => ({
      p_booking_id: booking._id,
      passenger_name: person.name,
      age: person.age,
      gender: person.gender,
    }));
    await Passenger.insertMany(passengerlist);

    res.status(200).json({
      message: "Booking updated successfully",
      booking: savedBooking,
      total_amount: totalamount,
      seat_price_details: seatPriceDetails,
    });
  } catch (error) {
    console.error("Error updating package booking:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get user's own bookings
const getMyBookings = async (req, res) => {
  try {
    const customer_id = req.user.id;

    const bookings = await PackageBooking.find({ Custmer_id: customer_id })
      .populate({
        path: "Package_id",
        select:
          "package_name price source_city destination start_date end_date duration tour_status bus_id",
        populate: {
          path: "bus_id",
          select: "bus_number bus_name bus_type total_seats",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
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
  updateMyPackageBooking,
  getMyBookings,
};
