const express = require("express");
require("dotenv").config();
const ConnectMongoDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const CustmerRoutes = require("./routes/Custmerroutes");
const packageRoutes = require("./routes/packagesRoutes");
const busRoutes = require("./routes/busRoutes");
const bookingRoutes = require("./routes/tourbookingRoutes");
const staffRoutes = require("./routes/staffRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const cancellationRoutes = require("./routes/cancellationRoutes");
const adminStatsRoutes = require("./routes/adminStatsRoutes");
const hotelRoutes = require("./routes/hotelRoutes");
const stateRoutes = require("./routes/stateRoutes");
const cityRoutes = require("./routes/cityRoutes");
const refundRoutes = require("./routes/refundRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const homeImageRoutes = require("./routes/homeImageRoutes");
const TourSchedule = require("./models/TourSchedule");
const cron = require("node-cron");
const {
  autoCancelExpiredBookings,
  autoCompletePastBusTrips,
} = require("./controllers/busBookingController");
const { runAllAutoTasks } = require("./utils/autoCompleteHelper");

const cors = require("cors");
const path = require("path");

const busRouteRoutes = require("./routes/busRouteRoutes");

// Use Bus Booking Routes
const busBookingRoutes = require("./routes/busBookingRoutes");
const busScheduleRoutes = require("./routes/busScheduleRoutes");
const busTripRoutes = require("./routes/busTripRoutes");
const ticketRoutes = require("./routes/ticketRoutes"); // ✅ NEW
const staffDashboardRoutes = require("./routes/staffDashboardRoutes"); // ✅ NEW
const tourScheduleRoutes = require("./routes/tourScheduleRoutes"); // ✅ NEW: Tour departures

const port = process.env.PORT || 4000;
const app = express();
// parse incoming JSON bodies
app.use(express.json());

// Set allowed origins for CORS
const allowedOrigins = [
  "http://localhost:5173", // Local Vite dev
  "http://localhost:3000", // Standard React dev
  process.env.FRONTEND_URL, // Production Frontend
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        origin.startsWith("http://localhost:")
      ) {
        callback(null, true);
      } else {
        console.log("CORS blocked origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Serve static files (images) from the 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

console.log("hello world");

app.get("/", (req, res) => {
  res.send("Hompage ....");
});

//login & register routes
app.use("/api/auth", authRoutes);

// This covers ALL package actions: Get, Add, Update, and Delete
app.use("/api/packages", packageRoutes);

// Use Bus Routes
app.use("/api/bus", busRoutes);

// Use Bus Route Routes
app.use("/api/bus-routes", busRouteRoutes);

// Use Bus Booking Routes (
app.use("/api/bus-bookings", busBookingRoutes); //

// Use Bus Schedule Routes
app.use("/api/bus-schedules", busScheduleRoutes);

// Use Bus Trip Routes
app.use("/api/bus-trips", busTripRoutes);

app.use("/api/staff", staffRoutes);

// ✅ NEW: Staff Dashboard (assigned trips, schedule, passenger list)
app.use("/api/staff-dashboard", staffDashboardRoutes);

// ✅ NEW: Tour Departures (individual package tour runs / schedules)
app.use("/api/tour-schedules", tourScheduleRoutes);
app.use("/api/departures", tourScheduleRoutes);

app.use("/api/bookings", bookingRoutes); //tour

app.use("/api/cust", CustmerRoutes);

app.use("/api/hotels", hotelRoutes);
app.use("/api/states", stateRoutes);
app.use("/api/cities", cityRoutes);

app.use("/api/payment", paymentRoutes);

app.use("/api/feedback", feedbackRoutes);

app.use("/api/cancellation", cancellationRoutes);
app.use("/api/admin-stats", adminStatsRoutes);

// Refund routes
app.use("/api/refunds", refundRoutes);

// Invoice routes
app.use("/api/invoice", invoiceRoutes);

// Home hero images
app.use("/api/home-images", homeImageRoutes);

// ✅ NEW: Ticket routes (Download tickets)
app.use("/api/tickets", ticketRoutes);

const migrateLegacyLockedTourSchedules = async () => {
  try {
    const lockedResult = await TourSchedule.updateMany(
      { departure_status: "Locked" },
      {
        $set: {
          departure_status: "Open",
          has_bookings: true,
        },
      }
    );

    const lateBookingFieldCleanup = await TourSchedule.updateMany(
      { allow_late_bookings: { $exists: true } },
      { $unset: { allow_late_bookings: "" } }
    );

    if (Number(lockedResult.modifiedCount || 0) > 0) {
      console.log(
        `[Startup Migration] Converted ${lockedResult.modifiedCount} Locked tour schedules to Open`
      );
    }

    if (Number(lateBookingFieldCleanup.modifiedCount || 0) > 0) {
      console.log(
        `[Startup Migration] Removed allow_late_bookings from ${lateBookingFieldCleanup.modifiedCount} tour schedules`
      );
    }
  } catch (error) {
    console.error(
      "[Startup Migration] Failed to migrate legacy Locked schedules:",
      error.message
    );
  }
};

const startServer = async () => {
  await ConnectMongoDB();
  await migrateLegacyLockedTourSchedules();

  cron.schedule("*/5 * * * *", async () => {
    await autoCancelExpiredBookings();
    await autoCompletePastBusTrips();
  });

  // ✅ NEW: Run tour auto-complete and booking maintenance every hour
  cron.schedule("0 * * * *", async () => {
    await runAllAutoTasks();
  });

  app.listen(port, () =>
    console.log(`Server started at http://localhost:${port}`)
  );
};

startServer();
