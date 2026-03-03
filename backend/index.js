const express = require("express");
const ConnectMongoDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const CustmerRoutes = require("./routes/Custmerroutes");
const packageRoutes = require("./routes/packagesRoutes");
const busRoutes = require("./routes/busRoutes");
const bookingRoutes = require("./routes/tourbookingRoutes");
const staffRoutes = require("./routes/staffRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const cors = require("cors");
const path = require("path");

const busRouteRoutes = require("./routes/busRouteRoutes");

// Use Bus Booking Routes
const busBookingRoutes = require("./routes/busBookingRoutes");

const port = 4000;
const app = express();
// parse incoming JSON bodies
app.use(express.json());

ConnectMongoDB();

//cors

app.use(cors());

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
app.use("/api/bus-bookings", busBookingRoutes);

app.use("/api/staff", staffRoutes);

app.use("/api/bookings", bookingRoutes);

app.use("/api/cust", CustmerRoutes);

const hotelRoutes = require("./routes/hotelRoutes");
app.use("/api/hotels", hotelRoutes);

app.use("/api/payment", paymentRoutes);

app.listen(port, () =>
  console.log(`server started at http://localhost:${port}`)
);
