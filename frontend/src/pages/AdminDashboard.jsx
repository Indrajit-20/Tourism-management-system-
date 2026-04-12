import React, { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import "../css/adminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("username");
    window.location.href = "/login";
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <nav className={`admin-sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
        <div className="sidebar-header">
          <h4 className="sidebar-title">
            <span className="sidebar-icon"></span>
            Admin Panel
          </h4>
          <button
            className="btn-toggle-sidebar"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle Sidebar"
          >
            ☰
          </button>
        </div>

        <div className="sidebar-nav-wrapper">
          <ul className="sidebar-nav">
            <li className="nav-section-title">Main</li>
            <li className="sidebar-nav-item">
              <Link className="sidebar-nav-link" to="">
                <span className="nav-icon"></span>
                <span className="nav-text">Dashboard</span>
              </Link>
            </li>

            <li className="nav-section-title">Management</li>
            <li className="sidebar-nav-item">
              <Link className="sidebar-nav-link" to="custmer">
                <span className="nav-icon"></span>
                <span className="nav-text">Customers</span>
              </Link>
            </li>

            <li className="sidebar-nav-item">
              <Link className="sidebar-nav-link" to="manage-package">
                <span className="nav-icon"></span>
                <span className="nav-text">Package Master</span>
              </Link>
            </li>

            <li className="sidebar-nav-item">
              <Link className="sidebar-nav-link" to="manage-tour-schedules">
                <span className="nav-icon"></span>
                <span className="nav-text">Tour Schedules</span>
              </Link>
            </li>

            <li className="sidebar-nav-item">
              <Link className="sidebar-nav-link" to="manage-hotels">
                <span className="nav-icon"></span>
                <span className="nav-text">Hotels</span>
              </Link>
            </li>

            <li className="sidebar-nav-item">
              <Link className="sidebar-nav-link" to="manage-bus">
                <span className="nav-icon"></span>
                <span className="nav-text">Buses</span>
              </Link>
            </li>

            <li className="sidebar-nav-item">
              <Link className="sidebar-nav-link" to="manage-routes">
                <span className="nav-icon"></span>
                <span className="nav-text">Routes</span>
              </Link>
            </li>

            <li className="sidebar-nav-item">
              <Link className="sidebar-nav-link" to="manage-schedules">
                <span className="nav-icon"></span>
                <span className="nav-text">Schedules</span>
              </Link>
            </li>

            <li className="sidebar-nav-item">
              <Link className="sidebar-nav-link" to="manage-staff">
                <span className="nav-icon"></span>
                <span className="nav-text">Staff</span>
              </Link>
            </li>

            <li className="nav-section-title">Bookings & Requests</li>
            <li className="sidebar-nav-item">
              <Link className="sidebar-nav-link" to="bookings">
                <span className="nav-icon"></span>
                <span className="nav-text">Bus Bookings</span>
              </Link>
            </li>

            <li className="sidebar-nav-item">
              <Link className="sidebar-nav-link" to="package-bookings">
                <span className="nav-icon"></span>
                <span className="nav-text">Tour Bookings</span>
              </Link>
            </li>

            <li className="nav-section-title">Operations</li>
            <li className="sidebar-nav-item">
              <Link className="sidebar-nav-link" to="feedback">
                <span className="nav-icon"></span>
                <span className="nav-text">Reviews & Feedback</span>
              </Link>
            </li>

            <li className="sidebar-nav-item">
              <Link className="sidebar-nav-link" to="cancellations">
                <span className="nav-icon"></span>
                <span className="nav-text">Cancellations</span>
              </Link>
            </li>

            <li className="sidebar-nav-item">
              <Link className="sidebar-nav-link" to="refunds">
                <span className="nav-icon"></span>
                <span className="nav-text">Refunds</span>
              </Link>
            </li>

            <li className="sidebar-nav-item">
              <Link className="sidebar-nav-link" to="manage-trips">
                <span className="nav-icon"></span>
                <span className="nav-text">Manage Trips</span>
              </Link>
            </li>

            <li className="nav-section-title">Reports & Analytics</li>
            <li className="sidebar-nav-item">
              <Link className="sidebar-nav-link report-link" to="reports">
                <span className="nav-icon"></span>
                <span className="nav-text">Sales & Revenue</span>
              </Link>
            </li>

            <li className="sidebar-nav-item">
              <Link
                className="sidebar-nav-link advanced-report-link"
                to="advanced-reports"
              >
                <span className="nav-icon"></span>
                <span className="nav-text">Booking Insights</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Logout Button */}
        <div className="sidebar-footer">
          <button
            className="btn btn-logout"
            onClick={handleLogout}
            title="Logout"
          >
            <span className="logout-icon"></span>
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="admin-main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminDashboard;
