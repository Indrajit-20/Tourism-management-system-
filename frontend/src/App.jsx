import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Hompage from "./pages/Hompage";
import PackagesList from "./pages/PackagesList";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import PackageManagment from "./pages/PackageManagment";
import AdminDashboard from "./pages/AdminDashboard";
import StaffDashboard from "./pages/StaffDashboard"; // Import Staff Dashboard

import ManageCustmer from "./pages/ManageCustmer";
import ManageBus from "./pages/ManageBus"; // Import Bus Page
import ManageStaff from "./pages/ManageStaff"; // Import Staff Page
import BookPackage from "./pages/BookPackage"; // Import BookPackage Page
import PackageSeatSelection from "./pages/PackageSeatSelection";
import PackageDetails from "./pages/PackageDetails";
import BookBus from "./pages/BookBus"; // Import the new Booking Page
import ManageRoutes from "./pages/ManageRoutes"; // Import the Admin Route Page
import ManageSchedules from "./pages/ManageSchedules";
import ManageBusBookings from "./pages/ManageBusBookings"; // Import Admin Bookings Page
import ManagePackageBookings from "./pages/ManagePackageBookings"; // Import Package Bookings Page
import SeatSelection from "./pages/SeatSelection"; // Import Seat Selection Page
import ManageFeedback from "./pages/ManageFeedback"; // Import Feedback Page
import ManageCancellations from "./pages/ManageCancellations"; // Import Cancellations Page
import ManageHotels from "./pages/ManageHotels";
import MyCancellations from "./pages/MyCancellations"; // Import My Cancellations Page
import MyBookings from "./pages/MyBookings"; // Import My Bookings Page
import MyInvoices from "./pages/MyInvoices"; // Import My Invoices Page
import RefundReport from "./pages/RefundReport"; // Import Refund Report Page
import Reports from "./pages/Reports"; // Import Reports Page

import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute"; // Import ProtectedRoute
import PublicLayout from "./components/PublicLayout"; // Import Layout
import ManageTripsByDate from "./pages/ManageTripsByDate"; // Import ManageTripsByDate Page

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pages WITHOUT Header/Footer */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Public Routes WITH Header/Footer */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Hompage />} />
          <Route path="/packages" element={<PackagesList />} />
          <Route path="/package-details/:id" element={<PackageDetails />} />
          <Route
            path="/packages/:id/select-seats"
            element={<PackageSeatSelection />}
          />
          <Route path="/packages/:id" element={<BookPackage />} />
          <Route path="/book-bus" element={<BookBus />} />{" "}
          {/* Public Booking Page */}
          <Route path="/book-seats" element={<SeatSelection />} />{" "}
          {/* Seat Selection Page */}
          <Route path="/cancellations" element={<MyCancellations />} />{" "}
          {/* User Cancellations Page */}
          <Route path="/my-bookings" element={<MyBookings />} />{" "}
          {/* User My Bookings Page */}
          <Route path="/my-invoices" element={<MyInvoices />} />{" "}
          {/* User Invoices Page */}
          <Route path="/profile" element={<Profile />} />{" "}
          {/* User Profile Page */}
        </Route>
        {/* Protect Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />}>
            <Route index element={<Dashboard />} />
            <Route path="custmer" element={<ManageCustmer />} />
            <Route path="manage-package" element={<PackageManagment />} />
            <Route path="manage-hotels" element={<ManageHotels />} />
            <Route path="manage-bus" element={<ManageBus />} />
            <Route path="manage-routes" element={<ManageRoutes />} />{" "}
            <Route path="manage-schedules" element={<ManageSchedules />} />
            {/* Admin Route Page */}
            <Route path="bookings" element={<ManageBusBookings />} />
            <Route
              path="package-bookings"
              element={<ManagePackageBookings />}
            />
            <Route path="manage-staff" element={<ManageStaff />} />
            <Route path="feedback" element={<ManageFeedback />} />
            <Route path="cancellations" element={<ManageCancellations />} />
            <Route path="refunds" element={<RefundReport />} />
            <Route path="reports" element={<Reports />} />
            <Route path="manage-trips" element={<ManageTripsByDate />} />
            {/* Add Bus Route */}
          </Route>
        </Route>

        {/* ✅ NEW: Protect Staff Routes */}
        <Route element={<ProtectedRoute allowedRoles={["driver", "guide"]} />}>
          <Route path="/staff-dashboard" element={<StaffDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
