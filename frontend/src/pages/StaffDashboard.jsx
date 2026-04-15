import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { to12HourDisplay } from "../utils/timeFormat";
import staffLogo from "../assets/staff-logo.svg";

const API = "http://localhost:4000";

const StaffDashboard = () => {
  const [staff, setStaff] = useState(null);
  const [todayTrips, setTodayTrips] = useState([]);
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [completedTrips, setCompletedTrips] = useState([]);

  // Setup tour states
  const [todayTours, setTodayTours] = useState([]);
  const [upcomingTours, setUpcomingTours] = useState([]);
  const [completedTours, setCompletedTours] = useState([]);
  const [selectedTour, setSelectedTour] = useState(null);

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
      const token = sessionStorage.getItem("token");
      console.log("Token:", token);
      const res = await axios.get(`${API}/api/staff-dashboard/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Dashboard Response:", res.data);
      setStaff(res.data.staff);
      setTodayTrips(res.data.todayTrips || []);
      setUpcomingTrips(res.data.upcomingTrips || []);
      setCompletedTrips(res.data.completedTrips || []);

      setTodayTours(res.data.todayTours || []);
      setUpcomingTours(res.data.upcomingTours || []);
      setCompletedTours(res.data.completedTours || []);

      console.log("Staff data:", res.data.staff);
      console.log("Today trips:", res.data.todayTrips);
      console.log("Today tours:", res.data.todayTours);
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

  // Update trip status
  const fetchTourDetails = async (tour_id) => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get(
        `${API}/api/staff-dashboard/tour/${tour_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setSelectedTour(res.data.tour);
      setPassengers(res.data.passengers);
    } catch (err) {
      console.error("Error fetching tour details", err);
      alert("Error loading tour details");
    }
  };
  const fetchTripDetails = async (trip_id) => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get(
        `${API}/api/staff-dashboard/trip/${trip_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
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
      const token = sessionStorage.getItem("token");
      await axios.put(
        `${API}/api/staff-dashboard/trip/${trip_id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      alert(`✅ Trip status updated to ${newStatus}`);
      fetchDashboard(); // Refresh dashboard
      setSelectedTrip(null);
    } catch (err) {
      console.error("Error updating status", err);
      alert(err.response?.data?.message || "Error updating status");
    }
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
    <div style={{ minHeight: "100vh", backgroundColor: "#f0f4f8" }}>
      {/* HEADER SECTION */}
      <nav
        className="navbar navbar-expand-lg navbar-dark"
        style={{ backgroundColor: "#0066cc" }}
      >
        <div className="container-fluid">
          <div className="navbar-brand fw-bold d-flex align-items-center gap-2">
            <span
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.18)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <img
                src={staffLogo}
                alt="Staff"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </span>
            <span style={{ fontSize: "24px", color: "white" }}>
              Staff Dashboard
            </span>
          </div>
          <button
            className="btn btn-danger ms-auto fw-bold"
            onClick={() => {
              sessionStorage.clear();
              navigate("/login");
            }}
          >
            🚪 Logout
          </button>
        </div>
      </nav>

      <div className="container-fluid p-4">
        {/* Profile and Stats in one compact row */}
        <div className="row g-3 mb-3">
          {/* Staff Info Card */}
          <div className="col-lg-7">
            <div
              className="card border-0 shadow-sm h-100"
              style={{ borderRadius: "12px", overflow: "hidden" }}
            >
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #0066cc 0%, #0d47a1 100%)",
                  padding: "15px 20px",
                  color: "white",
                }}
              >
                <div className="d-flex align-items-center gap-3">
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "14px",
                      background: "rgba(255,255,255,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={staffLogo}
                      alt="Staff profile"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  <div>
                    <h5 className="mb-0">{staff?.name}</h5>
                    <small style={{ opacity: 0.9, fontSize: "12px" }}>
                      {staff?.designation === "driver"
                        ? "Registered Bus Driver"
                        : "Certified Tour Guide"}
                    </small>
                  </div>
                </div>
              </div>
              <div className="card-body p-3">
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-primary">📧</span>
                      <div>
                        <small
                          className="text-muted d-block"
                          style={{ fontSize: "10px" }}
                        >
                          Email
                        </small>
                        <strong style={{ fontSize: "13px" }}>
                          {staff?.email || "N/A"}
                        </strong>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-primary">📞</span>
                      <div>
                        <small
                          className="text-muted d-block"
                          style={{ fontSize: "10px" }}
                        >
                          Contact
                        </small>
                        <strong style={{ fontSize: "13px" }}>
                          {staff?.contact_no || "N/A"}
                        </strong>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-primary">📅</span>
                      <div>
                        <small
                          className="text-muted d-block"
                          style={{ fontSize: "10px" }}
                        >
                          Joined
                        </small>
                        <strong style={{ fontSize: "13px" }}>
                          {staff?.date_of_joining || "N/A"}
                        </strong>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-primary">⭐</span>
                      <div>
                        <small
                          className="text-muted d-block"
                          style={{ fontSize: "10px" }}
                        >
                          Experience
                        </small>
                        <strong style={{ fontSize: "13px" }}>
                          {staff?.experience || "N/A"}
                        </strong>
                      </div>
                    </div>
                  </div>
                  {staff?.designation === "driver" && (
                    <div className="col-md-4">
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-primary">🎫</span>
                        <div>
                          <small
                            className="text-muted d-block"
                            style={{ fontSize: "10px" }}
                          >
                            License
                          </small>
                          <strong style={{ fontSize: "13px" }}>
                            {staff?.driver_license || "N/A"}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards - Horizontal Layout for better space usage */}
          <div className="col-lg-5">
            <div className="row g-2 h-100">
              <div className="col-4 h-100">
                <div
                  className="card border-0 shadow-sm h-100 text-center"
                  style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    color: "#333333",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <div className="card-body d-flex flex-column justify-content-center p-2">
                    <div style={{ fontSize: "20px" }}>📋</div>
                    <h3 className="mb-0 fw-bold" style={{ color: "#FF6B6B" }}>
                      {todayTrips.length + todayTours.length}
                    </h3>
                    <small
                      className="text-muted fw-bold"
                      style={{ fontSize: "11px" }}
                    >
                      Today
                    </small>
                  </div>
                </div>
              </div>
              <div className="col-4 h-100">
                <div
                  className="card border-0 shadow-sm h-100 text-center"
                  style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    color: "#333333",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <div className="card-body d-flex flex-column justify-content-center p-2">
                    <div style={{ fontSize: "20px" }}>📅</div>
                    <h3 className="mb-0 fw-bold" style={{ color: "#4ECDC4" }}>
                      {upcomingTrips.length + upcomingTours.length}
                    </h3>
                    <small
                      className="text-muted fw-bold"
                      style={{ fontSize: "11px" }}
                    >
                      Upcoming
                    </small>
                  </div>
                </div>
              </div>
              <div className="col-4 h-100">
                <div
                  className="card border-0 shadow-sm h-100 text-center"
                  style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    color: "#333333",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <div className="card-body d-flex flex-column justify-content-center p-2">
                    <div style={{ fontSize: "20px" }}>✅</div>
                    <h3 className="mb-0 fw-bold" style={{ color: "#10ac84" }}>
                      {completedTrips.length + completedTours.length}
                    </h3>
                    <small
                      className="text-muted fw-bold"
                      style={{ fontSize: "11px" }}
                    >
                      Done
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Tabs Row */}
        <div className="row g-3">
          <div className="col-12">
            <div
              className="card border-0 shadow-sm"
              style={{ borderRadius: "12px" }}
            >
              <div className="card-header bg-white border-0 pt-3 px-3">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <ul className="nav nav-pills gap-2 flex-grow-1">
                    <li className="nav-item">
                      <button
                        className={`nav-link px-4 ${
                          activeTab === "today"
                            ? "active shadow-sm"
                            : "hover-light"
                        }`}
                        onClick={() => setActiveTab("today")}
                        style={
                          activeTab === "today"
                            ? { backgroundColor: "#0066cc" }
                            : { color: "#555" }
                        }
                      >
                        🗓️ Today's Task ({todayTrips.length + todayTours.length}
                        )
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link px-4 ${
                          activeTab === "upcoming"
                            ? "active shadow-sm"
                            : "hover-light"
                        }`}
                        onClick={() => setActiveTab("upcoming")}
                        style={
                          activeTab === "upcoming"
                            ? { backgroundColor: "#0066cc" }
                            : { color: "#555" }
                        }
                      >
                        🔜 Upcoming (
                        {upcomingTrips.length + upcomingTours.length})
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link px-4 ${
                          activeTab === "completed"
                            ? "active shadow-sm"
                            : "hover-light"
                        }`}
                        onClick={() => setActiveTab("completed")}
                        style={
                          activeTab === "completed"
                            ? { backgroundColor: "#0066cc" }
                            : { color: "#555" }
                        }
                      >
                        ✔️ Completed
                      </button>
                    </li>
                  </ul>

                  {/* Search Bar Refined */}
                  <div className="search-box" style={{ minWidth: "250px" }}>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-light border-end-0">
                        🔍
                      </span>
                      <input
                        type="text"
                        className="form-control bg-light border-start-0"
                        placeholder="Search task..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-body p-3">
                {/* Tab Content Display */}
                <div className="tab-content mt-2">
                  {/* Content for each tab will go here or keep existing logic below if large */}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content Logic (Reusing and fixing existing) */}
        <div className="mt-4">
          {/* TODAY'S WORKS */}
          {activeTab === "today" && (
            <div>
              {todayTrips.length === 0 && todayTours.length === 0 ? (
                <div className="alert alert-info">
                  No trips or tours scheduled for today
                </div>
              ) : (
                <div className="row">
                  {/* --- RENDER TRIPS (for drivers) --- */}
                  {todayTrips.map((trip) => (
                    <div key={trip._id} className="col-md-6 mb-4">
                      <div
                        className="card border-0 shadow"
                        style={{
                          borderRadius: "12px",
                          overflow: "hidden",
                          borderLeft: "5px solid #0066cc",
                        }}
                      >
                        <div
                          style={{
                            background:
                              "linear-gradient(135deg, #0066cc 0%, #0047a3 100%)",
                            padding: "20px 15px",
                            borderBottom: "3px solid #004292",
                            color: "white",
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h5
                                className="mb-1"
                                style={{
                                  color: "white",
                                  fontWeight: "bold",
                                  fontSize: "18px",
                                }}
                              >
                                🚌 {trip.bus_id?.bus_number || "No Bus"}
                              </h5>
                              <small style={{ color: "#e0e0ff" }}>
                                {trip.bus_id?.bus_type || "Bus"}
                              </small>
                            </div>
                            <span
                              className="badge"
                              style={{
                                background:
                                  trip.status === "Running"
                                    ? "#ff9800"
                                    : trip.status === "Completed"
                                      ? "#4caf50"
                                      : "#2196f3",
                                padding: "8px 12px",
                                fontSize: "12px",
                                fontWeight: "bold",
                              }}
                            >
                              {trip.status}
                            </span>
                          </div>
                        </div>
                        <div className="card-body">
                          <div className="mb-3">
                            <p className="mb-2">
                              <strong>� Date:</strong>
                              <br />
                              <span
                                style={{ color: "#0066cc", fontWeight: "500" }}
                              >
                                {formatDate(trip.trip_date)}
                              </span>
                            </p>
                            <p className="mb-2">
                              <strong>�📍 Route:</strong>
                              <br />
                              <span
                                style={{ color: "#0066cc", fontWeight: "500" }}
                              >
                                {trip.schedule_id?.route_id?.boarding_from ||
                                  "N/A"}{" "}
                                →{" "}
                                {trip.schedule_id?.route_id?.destination ||
                                  "N/A"}
                              </span>
                            </p>
                            <p className="mb-2">
                              <strong>⏰ Time:</strong>
                              <br />
                              {to12HourDisplay(
                                trip.schedule_id?.departure_time,
                              )}{" "}
                              -{" "}
                              {to12HourDisplay(trip.schedule_id?.arrival_time)}
                            </p>
                            <p className="mb-0">
                              <strong>👥 Passengers:</strong>{" "}
                              {trip.total_passengers || 0}
                            </p>
                          </div>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm"
                              style={{
                                background: "#0066cc",
                                color: "white",
                                borderRadius: "8px",
                                flex: 1,
                              }}
                              onClick={() => fetchTripDetails(trip._id)}
                              data-bs-toggle="modal"
                              data-bs-target="#tripModal"
                            >
                              👥 View Details
                            </button>
                            {trip.status === "Scheduled" && (
                              <button
                                className="btn btn-sm"
                                style={{
                                  background: "#ff9800",
                                  color: "white",
                                  borderRadius: "8px",
                                }}
                                onClick={() =>
                                  updateTripStatus(trip._id, "Running")
                                }
                              >
                                ▶️ Start
                              </button>
                            )}
                            {trip.status === "Running" && (
                              <button
                                className="btn btn-sm"
                                style={{
                                  background: "#4caf50",
                                  color: "white",
                                  borderRadius: "8px",
                                }}
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

                  {/* --- RENDER TOURS --- */}
                  {todayTours.map((tour) => (
                    <div key={tour._id} className="col-md-6 mb-4">
                      <div
                        className="card border-0 shadow"
                        style={{
                          borderRadius: "12px",
                          overflow: "hidden",
                          borderLeft: "5px solid #20B2AA",
                        }}
                      >
                        <div
                          style={{
                            background:
                              "linear-gradient(135deg, #20B2AA 0%, #008B8B 100%)",
                            padding: "20px 15px",
                            borderBottom: "3px solid #006666",
                            color: "white",
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h5
                                className="mb-1"
                                style={{
                                  color: "white",
                                  fontWeight: "bold",
                                  fontSize: "18px",
                                }}
                              >
                                🏕️ {tour.package_id?.package_name || "Tour"}
                              </h5>
                              <small style={{ color: "#e0f5f5" }}>
                                Bus: {tour.bus_id?.bus_number || "Not assigned"}
                              </small>
                            </div>
                            <span
                              className={`badge bg-${
                                tour.departure_status === "Open"
                                  ? "success"
                                  : tour.departure_status === "Draft"
                                    ? "warning"
                                    : "secondary"
                              }`}
                              style={{
                                padding: "8px 12px",
                                fontSize: "12px",
                                fontWeight: "bold",
                              }}
                            >
                              {tour.departure_status}
                            </span>
                          </div>
                        </div>
                        <div className="card-body">
                          <div className="mb-3">
                            <p className="mb-2">
                              <strong>📍 Route:</strong>
                              <br />
                              <span
                                style={{ color: "#20B2AA", fontWeight: "500" }}
                              >
                                {tour.package_id?.source_city || "N/A"} →{" "}
                                {tour.package_id?.destination || "N/A"}
                              </span>
                            </p>
                            <p className="mb-2">
                              <strong>📅 Dates:</strong>
                              <br />
                              {formatDate(tour.start_date)} to{" "}
                              {formatDate(tour.end_date)}
                            </p>
                          </div>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm"
                              style={{
                                background: "#20B2AA",
                                color: "white",
                                borderRadius: "8px",
                                flex: 1,
                                fontWeight: "bold",
                              }}
                              onClick={() => {
                                fetchTourDetails(tour._id);
                                setSelectedTrip(null);
                              }}
                              data-bs-toggle="modal"
                              data-bs-target="#tourModal"
                            >
                              👥 View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* UPCOMING WORKS */}
          {activeTab === "upcoming" && (
            <div>
              {upcomingTrips.length === 0 && upcomingTours.length === 0 ? (
                <div className="alert alert-info">
                  No upcoming trips or tours
                </div>
              ) : (
                <div className="row">
                  {/* --- RENDER TRIPS --- */}
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
                                {trip.bus_id.bus_type}
                              </small>
                            </div>
                            <span className="badge bg-secondary">
                              {trip.status}
                            </span>
                          </div>

                          <div className="mb-3 pb-3 border-bottom">
                            <p className="mb-2">
                              <strong>📅 Date:</strong>
                              <br />
                              {formatDate(trip.trip_date)}
                            </p>
                            <p className="mb-2">
                              <strong>Route:</strong>
                              <br />
                              {trip.schedule_id?.route_id?.boarding_from ||
                                "N/A"}{" "}
                              →{" "}
                              {trip.schedule_id?.route_id?.destination || "N/A"}
                            </p>
                            <p className="mb-2">
                              <strong>Time:</strong>{" "}
                              {to12HourDisplay(
                                trip.schedule_id?.departure_time,
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

                  {/* --- RENDER TOURS --- */}
                  {upcomingTours.map((tour) => (
                    <div key={tour._id} className="col-md-6 mb-4">
                      <div className="card border-0 shadow-sm h-100 border-start border-4 border-info">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <h5 className="card-title mb-1 text-info">
                                🏕️ Tour: {tour.package_id?.package_name}
                              </h5>
                              <small className="text-muted">
                                {formatDate(tour.start_date)} -{" "}
                                {formatDate(tour.end_date)}
                              </small>
                            </div>
                            <span className="badge bg-secondary">
                              {tour.departure_status}
                            </span>
                          </div>

                          <div className="mb-3 pb-3 border-bottom">
                            <p className="mb-2">
                              <strong>Location:</strong>{" "}
                              {tour.package_id?.destination}
                            </p>
                            <p className="mb-2">
                              <strong>Duration:</strong>{" "}
                              {tour.package_id?.duration}
                            </p>
                          </div>

                          <button
                            className="btn btn-info btn-sm w-100 text-white"
                            onClick={() => {
                              fetchTourDetails(tour._id);
                              setSelectedTrip(null);
                            }}
                            data-bs-toggle="modal"
                            data-bs-target="#tourModal"
                          >
                            👥 View Details & Hotels
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* COMPLETED WORKS */}
          {activeTab === "completed" && (
            <div>
              {completedTrips.length === 0 && completedTours.length === 0 ? (
                <div className="alert alert-info">No completed works yet</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Type / Info</th>
                        <th>Route / Location</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* TRIPS */}
                      {completedTrips.map((trip) => (
                        <tr key={trip._id}>
                          <td>
                            <strong>{trip.bus_id.bus_number}</strong>
                          </td>
                          <td>
                            {trip.schedule_id?.route_id?.boarding_from || "-"} →{" "}
                            {trip.schedule_id?.route_id?.destination || "-"}
                          </td>
                          <td>{formatDate(trip.trip_date)}</td>
                          <td>
                            <span className="badge bg-success">
                              ✅ Completed
                            </span>
                          </td>
                        </tr>
                      ))}

                      {/* TOURS */}
                      {completedTours.map((tour) => (
                        <tr key={tour._id} className="table-info">
                          <td>
                            <strong>
                              Tour: {tour.package_id?.package_name}
                            </strong>
                            <br />
                            <small>Bus: {tour.bus_id?.bus_number}</small>
                          </td>
                          <td>
                            {tour.package_id?.source_city} →{" "}
                            {tour.package_id?.destination}
                          </td>
                          <td>{formatDate(tour.end_date)}</td>
                          <td>
                            <span className="badge bg-success">
                              ✅ Completed
                            </span>
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
                        <p className="mb-0 fw-bold text-primary">
                          {selectedTrip.route.from} → {selectedTrip.route.to}
                        </p>
                      </div>
                      <div className="col-md-6 mb-2">
                        <small className="text-muted">
                          Departure Date & Time
                        </small>
                        <p className="mb-0 fw-bold">
                          {formatDate(selectedTrip.tripDate)} |{" "}
                          {to12HourDisplay(selectedTrip.route.departureTime)}
                        </p>
                      </div>
                    </div>

                    {/* ✅ Detailed Boarding & Drop-off Points */}
                    <div className="row mt-3 bg-light p-3 rounded mx-0 border-start border-4 border-primary">
                      <div className="col-md-6">
                        <small
                          className="text-muted d-block mb-2 fw-bold text-uppercase"
                          style={{ fontSize: "10px" }}
                        >
                          🚩 Boarding Points
                        </small>
                        <div className="d-flex flex-wrap gap-1">
                          {selectedTrip.boardingPoints?.length > 0 ? (
                            selectedTrip.boardingPoints.map((point, idx) => (
                              <span
                                key={idx}
                                className="badge bg-white text-dark border p-1"
                                style={{ fontSize: "11px" }}
                              >
                                {point}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted small italic">
                              Main Boarding Point Only
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <small
                          className="text-muted d-block mb-2 fw-bold text-uppercase"
                          style={{ fontSize: "10px" }}
                        >
                          🎯 Drop-off Points
                        </small>
                        <div className="d-flex flex-wrap gap-1">
                          {selectedTrip.dropPoints?.length > 0 ? (
                            selectedTrip.dropPoints.map((point, idx) => (
                              <span
                                key={idx}
                                className="badge bg-white text-dark border p-1"
                                style={{ fontSize: "11px" }}
                              >
                                {point}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted small italic">
                              Final Destination Only
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Occupancy */}
                    <div className="mt-3">
                      <small className="text-muted d-block mb-2">
                        Occupancy
                      </small>
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

        {/* Tour Details Modal */}
        <div
          className="modal fade"
          id="tourModal"
          tabIndex="-1"
          aria-labelledby="tourModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title" id="tourModalLabel">
                  🏕️ Tour Details - {selectedTour?.package}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body">
                {selectedTour && (
                  <div className="mb-4">
                    <h6 className="mb-3 text-info">📍 Overview</h6>
                    <div className="row">
                      <div className="col-md-6 mb-2">
                        <small className="text-muted">Route / Location</small>
                        <p className="mb-0">
                          {selectedTour.source} → {selectedTour.destination}
                        </p>
                      </div>
                      <div className="col-md-6 mb-2">
                        <small className="text-muted">Dates</small>
                        <p className="mb-0">
                          {formatDate(selectedTour.startDate)} to{" "}
                          {formatDate(selectedTour.endDate)}
                        </p>
                      </div>
                      <div className="col-md-6 mb-2">
                        <small className="text-muted">Bus Assigned</small>
                        <p className="mb-0">{selectedTour.busNumber}</p>
                      </div>
                      <div className="col-md-6 mb-2">
                        <small className="text-muted">Total Passengers</small>
                        <p className="mb-0">
                          <span className="badge bg-primary">
                            {selectedTour.stats?.totalPassengers ||
                              passengers.reduce(
                                (sum, p) =>
                                  sum + (p.passengerDetails?.length || 0),
                                0,
                              )}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hotels Section */}
                {selectedTour?.hotels && selectedTour.hotels.length > 0 && (
                  <div className="mb-4">
                    <h6 className="mb-3 text-info">
                      🏨 Accommodation / Hotels
                    </h6>
                    <div className="row">
                      {selectedTour.hotels.map((hotel, index) => (
                        <div className="col-md-6 mb-3" key={index}>
                          <div className="card shadow-sm border-0 bg-light">
                            <div className="card-body">
                              <h6 className="card-title mb-1">
                                {hotel.hotel_name}
                              </h6>
                              <p className="small text-muted mb-1 border-bottom pb-2">
                                {hotel.hotel_type} |{" "}
                                {hotel.location || "No exact location"}
                              </p>
                              <p className="small mb-1">
                                <strong>📞 Manager:</strong>{" "}
                                {hotel.contact_number || "N/A"}
                              </p>
                              <p className="small mb-0">
                                <strong>✉️ Email:</strong>{" "}
                                {hotel.email || "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tourists List */}
                <div className="table-responsive">
                  <h6 className="mb-3 text-info">👥 Tourist List</h6>
                  {passengers.length === 0 ? (
                    <p className="text-muted text-center py-3">
                      No confirmed bookings yet.
                    </p>
                  ) : (
                    <table className="table table-bordered table-hover mt-3">
                      <thead className="table-light">
                        <tr>
                          <th>Primary Contact</th>
                          <th>Contact No.</th>
                          <th>Pickup Location</th>
                          <th>Members</th>
                        </tr>
                      </thead>
                      <tbody>
                        {passengers.map((p) => (
                          <tr key={p.id}>
                            <td>{p.name}</td>
                            <td>
                              <a
                                href={`tel:${p.phone}`}
                                className="text-decoration-none"
                              >
                                📞 {p.phone}
                              </a>
                            </td>
                            <td>
                              <span className="badge bg-secondary">
                                {p.pickup_location || "Not specified"}
                              </span>
                            </td>
                            <td>
                              {p.passengerDetails?.map((pd, index) => (
                                <div
                                  key={index}
                                  className="badge bg-secondary me-1 mb-1"
                                >
                                  {pd.name} ({pd.age}, {pd.gender?.charAt(0)})
                                </div>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="modal-footer border-0">
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
    </div>
  );
};

export default StaffDashboard;
