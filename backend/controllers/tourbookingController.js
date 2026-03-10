const Package = require("../models/Package");
const PackageBooking = require("../models/PackageBooking");
const Passenger = require("../models/Passenger");

const packageBooking = async (req, res) => {
  try {
    const { package_id, travellers, passengers } = req.body;
    const customer_id = req.user.id;

    //find pkg
    const pkg = await Package.findById(package_id);

    if (!pkg) {
      return res.status(404).json({ message: "package not found" });
    }

    //total amount
    let totalamount = 0;
    for (const person of passengers) {
      if (person.age < 12) {
        totalamount += pkg.price / 2;
      } else {
        totalamount += pkg.price;
      }
    }

    //booking
    const booking = new PackageBooking({
      Package_id: package_id,
      Custmer_id: customer_id,
      travellers,
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
      .json({ message: "Booking successful", booking: savedBooking });
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

// Get user's own bookings
const getMyBookings = async (req, res) => {
  try {
    const customer_id = req.user.id;

    const bookings = await PackageBooking.find({ Custmer_id: customer_id })
      .populate("Package_id", "package_name price")
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
  getAllPackageBookings,
  updatePackageBookingStatus,
  getMyBookings,
};
