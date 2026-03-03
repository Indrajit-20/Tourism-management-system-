import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Hompage from "./pages/Hompage";
import Login from "./pages/Login";
import PackageManagment from "./pages/PackageManagment";
import AdminDashboard from "./pages/AdminDashboard";

import ManageCustmer from "./pages/ManageCustmer";
import ManageBus from "./pages/ManageBus"; // Import Bus Page
import ManageStaff from "./pages/ManageStaff"; // Import Staff Page
import BookPackage from "./pages/BookPackage"; // Import BookPackage Page
import BookBus from "./pages/BookBus"; // Import the new Booking Page
import ManageRoutes from "./pages/ManageRoutes"; // Import the Admin Route Page
import ManageBusBookings from "./pages/ManageBusBookings"; // Import Admin Bookings Page
import ManagePackageBookings from "./pages/ManagePackageBookings"; // Import Package Bookings Page
import SeatSelection from "./pages/SeatSelection"; // Import Seat Selection Page

import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute"; // Import ProtectedRoute

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Hompage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/packages/:id" element={<BookPackage />} />
        <Route path="/book-bus" element={<BookBus />} />{" "}
        {/* Public Booking Page */}
        <Route path="/book-seats" element={<SeatSelection />} />{" "}
        {/* Seat Selection Page */}
        {/* Protect Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />}>
            <Route index element={<Dashboard />} />
            <Route path="custmer" element={<ManageCustmer />} />
            <Route path="manage-package" element={<PackageManagment />} />
            <Route path="manage-bus" element={<ManageBus />} />
            <Route path="manage-routes" element={<ManageRoutes />} />{" "}
            {/* Admin Route Page */}
            <Route path="bookings" element={<ManageBusBookings />} />
            <Route
              path="package-bookings"
              element={<ManagePackageBookings />}
            />
            <Route path="manage-staff" element={<ManageStaff />} />
            {/* Add Bus Route */}
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
