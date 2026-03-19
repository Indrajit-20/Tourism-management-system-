const Custmer = require("../models/Custmer");
const PackageBooking = require("../models/PackageBooking");
const BusTicketBooking = require("../models/BusTicketBooking");
const Package = require("../models/Package");

exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Total Customers
    const customerCount = await Custmer.countDocuments();

    // 2 & 3. Total Bookings
    const packageBookingCount = await PackageBooking.countDocuments();
    const busBookingCount = await BusTicketBooking.countDocuments();

    // 4. Total Packages Available
    const totalPackages = await Package.countDocuments();

    // 5. Total Revenue (Sum of amounts from both booking types)
    const packageRevenue = await PackageBooking.aggregate([
      { $group: { _id: null, total: { $sum: "$total_amount" } } },
    ]);
    const busRevenue = await BusTicketBooking.aggregate([
      { $group: { _id: null, total: { $sum: "$total_amount" } } },
    ]);

    const revPackage = packageRevenue.length > 0 ? packageRevenue[0].total : 0;
    const revBus = busRevenue.length > 0 ? busRevenue[0].total : 0;
    const totalRevenue = revPackage + revBus;

    // 6. Pending Bookings (Updated to use 'booking_status')
    const pendingPackages = await PackageBooking.countDocuments({
      booking_status: "Pending",
    });
    const pendingBuses = await BusTicketBooking.countDocuments({
      booking_status: "Pending",
    });
    const pendingBookings = pendingPackages + pendingBuses;

    // 7. Recent Transactions (Package Bookings)
    const recentPackageBookings = await PackageBooking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("Custmer_id", "first_name last_name email")
      .populate("Package_id", "title package_name");

    // 8. Recent Transactions (Bus Bookings)
    const recentBusBookings = await BusTicketBooking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("customer_id", "first_name last_name email");

    // Combine and format the recent transactions
    const combinedTransactions = [
      ...recentPackageBookings.map((p) => ({
        id: p._id,
        type: "Tour Package",
        customerName: p.Custmer_id
          ? `${p.Custmer_id.first_name} ${p.Custmer_id.last_name}`
          : "Guest",
        amount: p.total_amount || 0,
        date: p.createdAt,
        status: p.booking_status,
      })),
      ...recentBusBookings.map((b) => ({
        id: b._id,
        type: "Bus Booking",
        customerName: b.customer_id
          ? `${b.customer_id.first_name} ${b.customer_id.last_name}`
          : "Guest",
        amount: b.total_amount || 0,
        date: b.createdAt,
        status: b.booking_status,
      })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8); // Send only the 8 most recent combinations

    res.json({
      totalCustomers: customerCount,
      totalPackageBookings: packageBookingCount,
      totalBusBookings: busBookingCount,
      totalRevenue: totalRevenue,
      pendingBookings: pendingBookings,
      totalPackages: totalPackages,
      recentTransactions: combinedTransactions,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ message: "Server error fetching stats" });
  }
};
