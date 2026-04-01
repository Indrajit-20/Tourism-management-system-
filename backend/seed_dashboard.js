const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Staff = require("./models/Staff");
const Bus = require("./models/Bus");
const Package = require("./models/Package");
const Hotel = require("./models/Hotel");
const TourSchedule = require("./models/TourSchedule");
const Custmer = require("./models/Custmer");
const PackageBooking = require("./models/PackageBooking");

const State = require("./models/State");
const City = require("./models/City");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/tms2";

async function seedData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to DB");

    // 1. Create Staff (Driver & Guide)
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash("password123", salt);

    let driver = await Staff.findOne({ email_id: "driver@tour.com" });
    if (!driver) {
      driver = await Staff.create({
        name: "Ramesh Tour Driver",
        designation: "driver",
        contact_no: "9988776655",
        email_id: "driver@tour.com",
        password: hashPassword,
        dob: "01-01-1980",
        address: "Surat, Gujarat",
      });
      console.log("Driver created");
    }

    let guide = await Staff.findOne({ email_id: "guide@tour.com" });
    if (!guide) {
      guide = await Staff.create({
        name: "Suresh Tour Guide",
        designation: "guide",
        contact_no: "5566778899",
        email_id: "guide@tour.com",
        password: hashPassword,
        dob: "01-01-1985",
        address: "Ahmedabad, Gujarat",
      });
      console.log("Guide created");
    }

    // 2. Create State, City and Hotel
    let state = await State.findOne({ state_name: "Rajasthan" });
    if (!state) {
      state = await State.create({ state_name: "Rajasthan", status: "Active" });
    }

    let city = await City.findOne({ city_name: "Mount Abu" });
    if (!city) {
      city = await City.create({
        city_name: "Mount Abu",
        state_id: state._id,
        state: state.state_name,
        status: "Active",
      });
    }

    let hotel = await Hotel.findOne({ name: "Mount Abu Palace" });
    if (!hotel) {
      hotel = await Hotel.create({
        name: "Mount Abu Palace",
        hotel_type: "3 Star",
        description: "A beautiful stay in the hills",
        location: "Mount Abu, Rajasthan",
        city_id: city._id,
        state_id: state._id,
      });
      console.log("Hotel created");
    }

    // 3. Create Package
    let pkg = await Package.findOne({
      package_name: "Mount Abu Weekend Setup",
    });
    if (!pkg) {
      pkg = await Package.create({
        package_name: "Mount Abu Weekend Setup",
        package_type: "Weekend Getaway",
        source_city: "Ahmedabad",
        destination: "Mount Abu",
        duration: "3 days",
        hotels: [hotel._id],
        tour_guide: guide._id,
        price: 5000, // old field
        description: "A nice hill station visit.",
      });
      console.log("Package created");
    }

    // 4. Create Bus
    let bus = await Bus.findOne({ bus_number: "GJ-TEST-002" });
    if (!bus) {
      bus = await Bus.create({
        bus_name: "Volvo Tour Bus",
        bus_number: "GJ-TEST-002",
        bus_type: "AC Sleeper",
        total_seats: 30,
        layout_type: "sleeper",
        bus_category: "tour",
        driver_ids: [driver._id], // legacy field
      });
      console.log("Bus created");
    }

    // 5. Create TourSchedule (For Today/Tomorrow)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const endDate = new Date(todayStart);
    endDate.setDate(todayStart.getDate() + 2); // 3 days

    let schedule = await TourSchedule.findOne({
      package_id: pkg._id,
      bus_id: bus._id,
    });
    if (!schedule) {
      schedule = await TourSchedule.create({
        package_id: pkg._id,
        start_date: todayStart,
        end_date: endDate,
        departure_time: "10:00",
        bus_id: bus._id,
        driver_id: driver._id,
        guide_id: guide._id,
        price: 5000,
        total_seats: 30,
        available_seats: 25,
        seats: [], // Simplified for seed
        departure_status: "Open",
      });
      console.log("TourSchedule created");
    }

    // 6. Create Customer & Booking
    let customer = await Custmer.findOne({ email: "tourist@test.com" });
    if (!customer) {
      customer = await Custmer.create({
        first_name: "John",
        last_name: "Doe",
        email: "tourist@test.com",
        phone_no: "1122334455",
        password: hashPassword,
        gender: "Male",
        dob: "01-01-1990",
        address: "Some address",
        state: "Gujarat",
        city: "Ahmedabad",
      });
      console.log("Customer created");
    }

    const bookingCount = await PackageBooking.countDocuments({
      tour_schedule_id: schedule._id,
    });
    if (bookingCount === 0) {
      await PackageBooking.create({
        Custmer_id: customer._id,
        Package_id: pkg._id,
        tour_schedule_id: schedule._id,
        booking_date: new Date(),
        passengers: [
          { name: "John Doe", age: 36, gender: "Male" },
          { name: "Jane Doe", age: 34, gender: "Female" },
        ],
        amount_per_person: 5000,
        price_per_person: 5000,
        total_price: 10000,
        total_amount: 10000,
        booking_status: "confirmed",
        payment_status: "paid",
        razorpay_order_id: "fake_order_test_123",
        razorpay_payment_id: "fake_pay_test_123",
      });
      console.log("PackageBooking created");
    }

    console.log("\n==================================");
    console.log("SEED COMPLETE!");
    console.log("You can now securely log in with:");
    console.log("Driver Email : driver@tour.com");
    console.log("Guide Email  : guide@tour.com");
    console.log("Password     : password123");
    console.log("==================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding:", error);
    process.exit(1);
  }
}

seedData();
