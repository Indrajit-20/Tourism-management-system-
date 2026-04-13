const mongoose = require("mongoose");
const Package = require("./backend/models/Package");
const PackageBooking = require("./backend/models/PackageBooking");
const Custmer = require("./backend/models/Custmer");
const Feedback = require("./backend/models/Feedback");
const TourSchedule = require("./backend/models/TourSchedule");
const db = require("./backend/config/db");

const seedFeedback = async () => {
  try {
    await db();
    console.log("Connected to database...");

    // Find the package "Indian Complete Tour" or create it if not exists
    let pkg = await Package.findOne({ package_name: "Indian Complete Tour" });
    if (!pkg) {
      console.log("Creating 'Indian Complete Tour' package...");
      pkg = new Package({
        package_name: "Indian Complete Tour",
        source_city: "Delhi",
        destination: "Multiple Cities",
        duration: "15 Days / 14 Nights",
        price: 45000,
        description:
          "A complete journey through the heart of India, covering Delhi, Agra, Jaipur, Varanasi, and more.",
        package_type: "Group Tour",
        inclusive: ["Meals", "Hotels", "Sightseeing", "Transport"],
        exclusive: ["Personal Expenses", "Tips"],
        status: "Active",
      });
      await pkg.save();
    }

    // Find or create a schedule for this package
    let schedule = await TourSchedule.findOne({ package_id: pkg._id });
    if (!schedule) {
      schedule = new TourSchedule({
        package_id: pkg._id,
        start_date: new Date(),
        end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        price: 45000,
        total_seats: 40,
        available_seats: 30,
        departure_status: "Open",
      });
      await schedule.save();
    }

    // Find or create some customers
    const customersData = [
      {
        first_name: "Rahul",
        last_name: "Sharma",
        email: "rahul@example.com",
        phone_no: "9876543210",
        password: "password123",
        dob: "15-05-1990",
      },
      {
        first_name: "Anita",
        last_name: "Desai",
        email: "anita@example.com",
        phone_no: "9876543211",
        password: "password123",
        dob: "20-10-1985",
      },
      {
        first_name: "Vikram",
        last_name: "Singh",
        email: "vikram@example.com",
        phone_no: "9876543212",
        password: "password123",
        dob: "05-12-1992",
      },
      {
        first_name: "Priya",
        last_name: "Patel",
        email: "priya@example.com",
        phone_no: "9876543213",
        password: "password123",
        dob: "12-03-1988",
      },
      {
        first_name: "Sanjay",
        last_name: "Gupta",
        email: "sanjay@example.com",
        phone_no: "9876543214",
        password: "password123",
        dob: "25-07-1982",
      },
    ];

    const customers = [];
    for (const c of customersData) {
      let customer = await Custmer.findOne({ email: c.email });
      if (!customer) {
        customer = new Custmer(c);
        await customer.save();
      }
      customers.push(customer);
    }

    // Create a few bookings to link feedback to
    const bookings = [];
    for (let i = 0; i < customers.length; i++) {
      let booking = await PackageBooking.findOne({
        customer_id: customers[i]._id,
        package_id: pkg._id,
      });
      if (!booking) {
        booking = new PackageBooking({
          package_id: pkg._id,
          tour_schedule_id: schedule._id,
          customer_id: customers[i]._id,
          travellers: 2,
          total_amount: 90000,
          booking_status: "Confirmed",
          payment_status: "Paid",
        });
        await booking.save();
      }
      bookings.push(booking);
    }

    // Add 8 Feedbacks
    const feedbacks = [
      {
        rating: 5,
        review_text:
          "Amazing experience! The 'Indian Complete Tour' was well-managed and the hotels were top-notch.",
      },
      {
        rating: 4,
        review_text:
          "Great tour covering many beautiful places. The guide was very knowledgeable.",
      },
      {
        rating: 5,
        review_text:
          "Best decision to book this package. Everything from transport to food was perfect.",
      },
      {
        rating: 4,
        review_text: "Very good itinerary. A bit tiring but worth every penny.",
      },
      {
        rating: 5,
        review_text:
          "Incredible India indeed! This tour showed us the true soul of the country.",
      },
      {
        rating: 5,
        review_text:
          "Highly recommend this to everyone. Excellent service by the staff.",
      },
      {
        rating: 4,
        review_text:
          "Good value for money. The hotels in Varanasi were exceptional.",
      },
      {
        rating: 5,
        review_text:
          "Perfectly organized. We didn't have to worry about anything during the 15 days.",
      },
    ];

    for (let i = 0; i < feedbacks.length; i++) {
      const custIdx = i % customers.length;
      const bookIdx = i % bookings.length;

      await Feedback.create({
        custmer_id: customers[custIdx]._id,
        package_id: pkg._id,
        tour_schedule_id: schedule._id,
        booking_id: bookings[bookIdx]._id,
        rating: feedbacks[i].rating,
        review_text: feedbacks[i].review_text,
      });
    }

    console.log(
      "Successfully added 8 feedbacks to 'Indian Complete Tour' package."
    );
    process.exit(0);
  } catch (error) {
    console.error("Error seeding feedback:", error);
    process.exit(1);
  }
};

seedFeedback();
