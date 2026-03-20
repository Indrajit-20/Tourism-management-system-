import React from "react";
import { Link, Outlet } from "react-router-dom";

const AdminDashboard = () => {
  return (
    <div className="container-fluid">
      <div className="row g-0 ">
        <div className="col-3 col-md-2 bg-light min-vh-100 d-flex flex-column p-3 position-sticky top-0">
          <h5>Admin Menu</h5>

          <ul className="nav flex-column">
            <li className="nav-item">
              <Link className="nav-link" to="">
                Dashboard
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="custmer">
                Custmer
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="manage-package">
                Manage Packages
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="manage-hotels">
                Manage Hotels
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="manage-bus">
                Manage Buses
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="manage-routes">
                Bus Routes
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="manage-schedules">
                Schedules
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="manage-staff">
                Staff
              </Link>
            </li>

            <li className="nav-item mb-2">
              <Link className="nav-link" to="bookings">
                Bus Bookings
              </Link>
            </li>
            <li className="nav-item mb-2">
              <Link className="nav-link" to="package-bookings">
                Tour Bookings
              </Link>
            </li>
            <li className="nav-item mb-2">
              <Link className="nav-link" to="feedback">
                Manage Feedback
              </Link>
            </li>
            <li className="nav-item mb-2">
              <Link className="nav-link" to="cancellations">
                Cancellations
              </Link>
            </li>
            <li className="nav-item mb-2">
              <Link className="nav-link " to="refunds">
                Refund
              </Link>
            </li>
            <li className="nav-item mb-2">
              <Link className="nav-link text-primary fw-bold" to="reports">
                📊 Reports
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="manage-trips">
                Manage Trips
              </Link>
            </li>
          </ul>

          <button
            className="btn btn-danger w-50 mt-auto align-self-center"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("role");
              window.location.href = "/login";
            }}
          >
            Logout
          </button>
        </div>

        <div className="col-9 col-md-10 p-5 bg-white vh-100 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
