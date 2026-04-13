const mongoose = require("mongoose");
const Package = require("./models/Package");
const PackageBooking = require("./models/PackageBooking");
const Custmer = require("./models/Custmer");
const Feedback = require("./models/Feedback");
const TourSchedule = require("./models/TourSchedule");
const Bus = require("./models/Bus");
const db = require("./config/db");

const seedFeedback = async () => {
  try {
    await db();
    console.log("Connected to database...");

    // Find a bus to use
    let bus = await Bus.findOne({ bus_category: "tour" });
    if (!bus) {
      bus = new Bus({
        bus_name: "Tours Luxury Bus",
        bus_number: "DL01-T-8888",
        bus_type: "AC Sleeper",
        bus_category: "tour",
        total_seats: 40,
        layout_type: "sleeper"
      });
      await bus.save();
    }

    // List of 4 Packages to seed for
    const packageData = [
      { name: "Indian Complete Tour", price: 45000, duration: "15 Days" },
      { name: "Himachal Adventure", price: 25000, duration: "7 Days" },
      { name: "Kerala Backwaters", price: 35000, duration: "6 Days" },
      { name: "Rajasthan Heritage", price: 30000, duration: "8 Days" }
    ];

    const indianUsers = [
      { first_name: "Rahul", last_name: "Sharma", email: "rahul.s@example.com", phone_no: "9876543210" },
      { first_name: "Priya", last_name: "Patel", email: "priya.p@example.com", phone_no: "9876543211" },
      { first_name: "Amit", last_name: "Singh", email: "amit.s@example.com", phone_no: "9876543212" },
      { first_name: "Sonia", last_name: "Verma", email: "sonia.v@example.com", phone_no: "9876543213" },
      { first_name: "Vikram", last_name: "Rathore", email: "vikram.r2@example.com", phone_no: "9876543214" },
      { first_name: "Anjali", last_name: "Gupta", email: "anjali.g2@example.com", phone_no: "9876543215" },
      { first_name: "Deepak", last_name: "Kumar", email: "deepak.k2@example.com", phone_no: "9876543216" },
      { first_name: "Neha", last_name: "Reddy", email: "neha.r2@example.com", phone_no: "9876543217" }
    ];

    const comments = [
      "Amazing experience! Highly recommended.",
      "Well organized and very comfortable.",
      "Beautiful sights and great tour guide.",
      "Value for money and excellent hotels.",
      "The best trip I have ever taken!",
      "Great management and friendly staff.",
      "Everything was perfect from start to finish.",
      "Loved the food and the cultural shows."
    ];

    console.log("Cleaning up old test feedbacks...");
    await Feedback.deleteMany({ review_text: { $exists: true } });

    for (const p of packageData) {
      console.log(`Processing package: ${p.name}...`);
      
      let pkg = await Package.findOne({ package_name: p.name });
      if (!pkg) {
        pkg = new Package({
          package_name: p.name,
          source_city: "Delhi",
          destination: "Various",
          duration: p.duration,
          price: p.price,
          description: `A wonderful ${p.name} experience for everyone.`,
          package_type: "Group Tour",
          inclusive: "Meals, Hotels, Transport",
          exclusive: "Tips, Shopping",
          status: "Active"
        });
        await pkg.save();
      }

      let schedule = await TourSchedule.findOne({ package_id: pkg._id });
      if (!schedule) {
        schedule = new TourSchedule({
          package_id: pkg._id,
          bus_id: bus._id,
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          price: p.price,
          total_seats: 40,
          available_seats: 10,
          departure_status: "Completed"
        });
        await schedule.save();
      }

      // Add 2 reviews for each package with different past dates
      for (let i = 0; i < 2; i++) {
        const userIdx = (packageData.indexOf(p) * 2 + i) % indianUsers.length;
        const userData = indianUsers[userIdx];
        const daysAgo = Math.floor(Math.random() * 20) + 5; // 5 to 25 days ago
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - daysAgo);

        let customer = await Custmer.findOne({ $or: [{ email: userData.email }, { phone_no: userData.phone_no }] });
        if (!customer) {
          customer = new Custmer({ ...userData, password: "password123", dob: "10-10-1990" });
          await customer.save();
        }

        const booking = new PackageBooking({
          package_id: pkg._id,
          tour_schedule_id: schedule._id,
          customer_id: customer._id,
          travellers: 1,
          price_per_person: p.price,
          total_amount: p.price,
          booking_status: "completed",
          payment_status: "paid",
          booking_date: pastDate,
          review_submitted: true
        });
        await booking.save();

        const feed = new Feedback({
          package_id: pkg._id,
          booking_id: booking._id,
          custmer_id: customer._id,
          rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
          review_text: comments[(packageData.indexOf(p) * 2 + i) % comments.length],
          status: "Approved",
          createdAt: pastDate
        });
        await feed.save();
        
        booking.review_id = feed._id;
        await booking.save();
      }
    }

    console.log("Successfully seeded 4 packages with diverse names and past dates.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding feedback:", error);
    process.exit(1);
  }
};

seedFeedback();
