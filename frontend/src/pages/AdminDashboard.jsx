import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import "../css/adminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Handle body class for mobile backdrop
  useEffect(() => {
    if (window.innerWidth <= 768) {
      if (sidebarOpen) {
        document.body.classList.add("sidebar-open");
      } else {
        document.body.classList.remove("sidebar-open");
      }
    }
    return () => {
      document.body.classList.remove("sidebar-open");
    };
  }, [sidebarOpen]);

  // Close sidebar when clicking on a link (mobile)
  const handleNavClick = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("username");
    window.location.href = "/login";
  };

  return (
    <div className="admin-dashboard">
      {/* Mobile Header - Always visible on mobile */}
      <div
        className="mobile-header"
        style={{ display: window.innerWidth <= 768 ? "flex" : "none" }}
      >
        <button
          className="mobile-menu-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title="Toggle Menu"
          aria-label="Toggle navigation menu"
        >
          ☰
        </button>
        <h5 className="mobile-header-title">Admin Panel</h5>
      </div>

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
              <Link className="sidebar-nav-link" to="" onClick={handleNavClick}>
                <span className="nav-icon"></span>
                <span className="nav-text">Dashboard</span>
              </Link>
            </li>

            <li className="nav-section-title">Management</li>
            <li className="sidebar-nav-item">
              <Link
                className="sidebar-nav-link"
                to="custmer"
                onClick={handleNavClick}
              >
                <span className="nav-icon"></span>
                <span className="nav-text">Customers</span>
              </Link>
            </li>

            <li className="sidebar-nav-item">
              <Link
                className="sidebar-nav-link"
                to="manage-package"
                onClick={handleNavClick}
              >
                <span className="nav-icon"></span>
                <span className="nav-text">Package Master</span>
              </Link>
            </li>

            <li className="sidebar-nav-item">
              <Link
                className="sidebar-nav-link"
                to="manage-tour-schedules"
                onClick={handleNavClick}
              >
                <span className="nav-icon"></span>
                <span className="nav-text">Tour Schedules</span>
              </Link>
            </li>

            <li className="sidebar-nav-item">
              <Link
                className="sidebar-nav-link"
                to="manage-hotels"
                onClick={handleNavClick}
              >
                <span className="nav-icon"></span>
                <span className="nav-text">Hotels</span>
              </Link>
            </li>

            <li className="sidebar-nav-item">
              <Link
                className="sidebar-nav-link"
                to="manage-bus"
                onClick={handleNavClick}
              >
                <span className="nav-icon"></span>
                <span className="nav-text">Buses</span>
              </Link>
            </li>

            <li className="sidebar-nav-item">
              <Link
                className="sidebar-nav-link"
                to="manage-routes"
                onClick={handleNavClick}
              >
                <span className="nav-icon"></span>
                <span className="nav-text">Routes</span>
              </Link>
            </li>

            <li className="sidebar-nav-item">
              <Link
                className="sidebar-nav-link"
                to="manage-schedules"
                onClick={handleNavClick}
              >
                <span className="nav-icon"></span>
                <span className="nav-text">Schedules</span>
              </Link>
            </li>

            <li className="sidebar-nav-item">
              <Link
                className="sidebar-nav-link"
                to="manage-staff"
                onClick={handleNavClick}
              >
                <span className="nav-icon"></span>
                <span className="nav-text">Staff</span>
              </Link>
            </li>

            <li className="nav-section-title">Bookings & Requests</li>
            <li className="sidebar-nav-item">
              <Link
                className="sidebar-nav-link"
                to="bookings"
                onClick={handleNavClick}
              >
                <span className="nav-icon"></span>
                <span className="nav-text">Bus Bookings</span>
              </Link>
            </li>

            <li className="sidebar-nav-item">
              <Link
                className="sidebar-nav-link"
                to="package-bookings"
                onClick={handleNavClick}
              >
                <span className="nav-icon"></span>
                <span className="nav-text">Tour Bookings</span>
              </Link>
            </li>

            <li className="nav-section-title">Operations</li>
            <li className="sidebar-nav-item">
              <Link
                className="sidebar-nav-link"
                to="feedback"
                onClick={handleNavClick}
              >
                <span className="nav-icon"></span>
                <span className="nav-text">Reviews & Feedback</span>
              </Link>
            </li>

            <li className="sidebar-nav-item">
              <Link
                className="sidebar-nav-link"
                to="cancellations"
                onClick={handleNavClick}
              >
                <span className="nav-icon"></span>
                <span className="nav-text">Cancellations</span>
              </Link>
            </li>

            <li className="sidebar-nav-item">
              <Link
                className="sidebar-nav-link"
                to="refunds"
                onClick={handleNavClick}
              >
                <span className="nav-icon"></span>
                <span className="nav-text">Refunds</span>
              </Link>
            </li>

            <li className="sidebar-nav-item">
              <Link
                className="sidebar-nav-link"
                to="manage-trips"
                onClick={handleNavClick}
              >
                <span className="nav-icon"></span>
                <span className="nav-text">Manage Trips</span>
              </Link>
            </li>

            <li className="nav-section-title">Reports & Analytics</li>
            <li className="sidebar-nav-item">
              <Link
                className="sidebar-nav-link report-link"
                to="reports"
                onClick={handleNavClick}
              >
                <span className="nav-icon"></span>
                <span className="nav-text">Sales & Revenue</span>
              </Link>
            </li>

            <li className="sidebar-nav-item">
              <Link
                className="sidebar-nav-link advanced-report-link"
                to="advanced-reports"
                onClick={handleNavClick}
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
