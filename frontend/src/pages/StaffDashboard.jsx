import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const API = "http://localhost:4000";

const StaffDashboard = () => {
  const [staff, setStaff] = useState(null);
  const [todayTrips, setTodayTrips] = useState([]);
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [completedTrips, setCompletedTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("today"); // today, upcoming, completed, schedule
  const navigate = useNavigate();

  // Load dashboard on mount
  useEffect(() => {
    fetchDashboard();
  }, []);

  // Fetch dashboard data
  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      console.log("Token:", token);
      const res = await axios.get(`${API}/api/staff-dashboard/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Dashboard Response:", res.data);
      setStaff(res.data.staff);
      setTodayTrips(res.data.todayTrips || []);
      setUpcomingTrips(res.data.upcomingTrips || []);
      setCompletedTrips(res.data.completedTrips || []);
    } catch (err) {
      console.error("Error fetching dashboard", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to load dashboard";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Fetch trip details with passenger list
  const fetchTripDetails = async (trip_id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API}/api/staff-dashboard/trip/${trip_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSelectedTrip(res.data.trip);
      setPassengers(res.data.passengers);
    } catch (err) {
      console.error("Error fetching trip details", err);
      alert("Error loading trip details");
    }
  };

  // Update trip status
  const updateTripStatus = async (trip_id, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API}/api/staff-dashboard/trip/${trip_id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`✅ Trip status updated to ${newStatus}`);
      fetchDashboard(); // Refresh dashboard
      setSelectedTrip(null);
    } catch (err) {
      console.error("Error updating status", err);
      alert(err.response?.data?.message || "Error updating status");
    }
  };

  // Format time
  const formatTime = (time) => {
    if (!time) return "--";
    const [hours, minutes] = time.split(":").slice(0, 2);
    return `${hours}:${minutes}`;
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          <h4 className="alert-heading">❌ Error</h4>
          <p>{error}</p>
          <hr />
          <button className="btn btn-primary" onClick={() => fetchDashboard()}>
            🔄 Retry
          </button>
          <button
            className="btn btn-secondary ms-2"
            onClick={() => navigate("/login")}
          >
            🔑 Login Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="container-fluid p-4"
      style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
    >
      {/* Header */}
      <div className="row mb-4">
        <div className="col-md-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h2 className="mb-3">👨‍✈️ Staff Dashboard</h2>
              {staff && (
                <div>
                  <h5 className="text-primary">{staff.name}</h5>
                  <small className="text-muted d-block">
                    <strong>Designation:</strong>{" "}
                    {staff.designation.charAt(0).toUpperCase() +
                      staff.designation.slice(1)}
                  </small>
                  <small className="text-muted d-block">
                    <strong>Email:</strong> {staff.email}
                  </small>
                  <small className="text-muted d-block">
                    <strong>Contact:</strong> {staff.contact}
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="col-md-4">
          <div className="row">
            <div className="col-6 mb-3">
              <div className="card bg-primary text-white border-0 shadow-sm">
                <div className="card-body text-center p-3">
                  <h3 className="mb-0">{todayTrips.length}</h3>
                  <small>Today's Trips</small>
                </div>
              </div>
            </div>
            <div className="col-6 mb-3">
              <div className="card bg-info text-white border-0 shadow-sm">
                <div className="card-body text-center p-3">
                  <h3 className="mb-0">{upcomingTrips.length}</h3>
                  <small>Upcoming</small>
                </div>
              </div>
            </div>
            <div className="col-6">
              <div className="card bg-success text-white border-0 shadow-sm">
                <div className="card-body text-center p-3">
                  <h3 className="mb-0">{completedTrips.length}</h3>
                  <small>Completed</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4" role="tablist">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "today" ? "active" : ""}`}
            onClick={() => setActiveTab("today")}
          >
            📅 Today's Trips ({todayTrips.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "upcoming" ? "active" : ""}`}
            onClick={() => setActiveTab("upcoming")}
          >
            🚌 Upcoming ({upcomingTrips.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "completed" ? "active" : ""}`}
            onClick={() => setActiveTab("completed")}
          >
            ✅ Completed ({completedTrips.length})
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {/* TODAY'S TRIPS */}
        {activeTab === "today" && (
          <div>
            {todayTrips.length === 0 ? (
              <div className="alert alert-info">
                No trips scheduled for today
              </div>
            ) : (
              <div className="row">
                {todayTrips.map((trip) => (
                  <div key={trip._id} className="col-md-6 mb-4">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <h5 className="card-title mb-1">
                              🚌 {trip.bus_id.bus_number}
                            </h5>
                            <small className="text-muted">
                              {trip.bus_id.bus_type}
                            </small>
                          </div>
                          <span
                            className={`badge bg-${
                              trip.status === "Running"
                                ? "warning"
                                : "secondary"
                            }`}
                          >
                            {trip.status}
                          </span>
                        </div>

                        <div className="mb-3 pb-3 border-bottom">
                          <p className="mb-2">
                            <strong>Route:</strong>
                            <br />
                            {trip.schedule_id.route_id.boarding_from} →{" "}
                            {trip.schedule_id.route_id.destination}
                          </p>
                          <p className="mb-2">
                            <strong>Time:</strong>{" "}
                            {formatTime(
                              trip.schedule_id.route_id.departure_time
                            )}{" "}
                            -{" "}
                            {formatTime(trip.schedule_id.route_id.arrival_time)}
                          </p>
                        </div>

                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-primary btn-sm flex-grow-1"
                            onClick={() => fetchTripDetails(trip._id)}
                            data-bs-toggle="modal"
                            data-bs-target="#tripModal"
                          >
                            👥 View Passengers
                          </button>
                          {trip.status === "Scheduled" && (
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={() =>
                                updateTripStatus(trip._id, "Running")
                              }
                            >
                              ▶️ Start
                            </button>
                          )}
                          {trip.status === "Running" && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() =>
                                updateTripStatus(trip._id, "Completed")
                              }
                            >
                              ✅ Complete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* UPCOMING TRIPS */}
        {activeTab === "upcoming" && (
          <div>
            {upcomingTrips.length === 0 ? (
              <div className="alert alert-info">No upcoming trips</div>
            ) : (
              <div className="row">
                {upcomingTrips.map((trip) => (
                  <div key={trip._id} className="col-md-6 mb-4">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <h5 className="card-title mb-1">
                              🚌 {trip.bus_id.bus_number}
                            </h5>
                            <small className="text-muted">
                              {formatDate(trip.trip_date)}
                            </small>
                          </div>
                          <span className="badge bg-secondary">
                            {trip.status}
                          </span>
                        </div>

                        <div className="mb-3 pb-3 border-bottom">
                          <p className="mb-2">
                            <strong>Route:</strong>
                            <br />
                            {trip.schedule_id.route_id.boarding_from} →{" "}
                            {trip.schedule_id.route_id.destination}
                          </p>
                          <p className="mb-2">
                            <strong>Time:</strong>{" "}
                            {formatTime(
                              trip.schedule_id.route_id.departure_time
                            )}
                          </p>
                        </div>

                        <button
                          className="btn btn-primary btn-sm w-100"
                          onClick={() => fetchTripDetails(trip._id)}
                          data-bs-toggle="modal"
                          data-bs-target="#tripModal"
                        >
                          👥 View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* COMPLETED TRIPS */}
        {activeTab === "completed" && (
          <div>
            {completedTrips.length === 0 ? (
              <div className="alert alert-info">No completed trips yet</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Bus</th>
                      <th>Route</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedTrips.map((trip) => (
                      <tr key={trip._id}>
                        <td>
                          <strong>{trip.bus_id.bus_number}</strong>
                        </td>
                        <td>
                          {trip.schedule_id.route_id.boarding_from} →{" "}
                          {trip.schedule_id.route_id.destination}
                        </td>
                        <td>{formatDate(trip.trip_date)}</td>
                        <td>
                          <span className="badge bg-success">✅ Completed</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trip Details Modal */}
      <div
        className="modal fade"
        id="tripModal"
        tabIndex="-1"
        aria-labelledby="tripModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="tripModalLabel">
                👥 Passengers - {selectedTrip?.busNumber}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body">
              {selectedTrip && (
                <div className="mb-4">
                  <h6 className="mb-3">📍 Trip Details</h6>
                  <div className="row">
                    <div className="col-md-6 mb-2">
                      <small className="text-muted">Route</small>
                      <p className="mb-0">
                        {selectedTrip.route.from} → {selectedTrip.route.to}
                      </p>
                    </div>
                    <div className="col-md-6 mb-2">
                      <small className="text-muted">Date</small>
                      <p className="mb-0">
                        {formatDate(selectedTrip.tripDate)}
                      </p>
                    </div>
                    <div className="col-md-6 mb-2">
                      <small className="text-muted">Time</small>
                      <p className="mb-0">
                        {formatTime(selectedTrip.route.departureTime)} -{" "}
                        {formatTime(selectedTrip.route.arrivalTime)}
                      </p>
                    </div>
                    <div className="col-md-6 mb-2">
                      <small className="text-muted">Status</small>
                      <p className="mb-0">
                        <span
                          className={`badge bg-${
                            selectedTrip.status === "Completed"
                              ? "success"
                              : "secondary"
                          }`}
                        >
                          {selectedTrip.status}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Occupancy */}
                  <div className="mt-3">
                    <small className="text-muted d-block mb-2">Occupancy</small>
                    <div className="progress" style={{ height: "25px" }}>
                      <div
                        className="progress-bar bg-success"
                        role="progressbar"
                        style={{
                          width: `${
                            selectedTrip.stats?.occupancyPercent || 0
                          }%`,
                        }}
                        aria-valuenow={
                          selectedTrip.stats?.occupancyPercent || 0
                        }
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                        {selectedTrip.stats?.occupancyPercent}%
                      </div>
                    </div>
                    <small className="text-muted d-block mt-2">
                      {selectedTrip.stats?.bookedSeats} /{" "}
                      {selectedTrip.stats?.totalSeats} seats booked
                    </small>
                  </div>
                </div>
              )}

              <h6 className="mb-3 mt-4">Passenger List</h6>
              {passengers.length === 0 ? (
                <div className="alert alert-warning">
                  No passengers booked for this trip
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Name</th>
                        <th>Seats</th>
                        <th>Phone</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {passengers.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <strong>{p.name}</strong>
                            <br />
                            <small className="text-muted">{p.email}</small>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark">
                              {p.seats}
                            </span>
                          </td>
                          <td>{p.phone}</td>
                          <td>₹{p.totalAmount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
