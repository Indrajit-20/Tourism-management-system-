import React, { useState, useEffect } from "react";
import axios from "axios";
import CancelBookingModal from "../components/CancelBookingModal";
import Header from "../components/Header";

const MyBookings = () => {
  const [packageBookings, setPackageBookings] = useState([]);
  const [busBookings, setBusBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("packages");

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      // Fetch package bookings
      const packageRes = await axios.get("/api/bookings/my-bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPackageBookings(packageRes.data || []);

      // Fetch bus bookings
      const busRes = await axios.get("/api/bus-bookings/my-bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBusBookings(busRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (booking, type) => {
    setSelectedBooking({
      id: booking._id,
      type: type,
      amount: booking.total_amount, // Simplified redundant ternary operator
    });
    setShowCancelModal(true);
  };

  const handleCancelSuccess = () => {
    setShowCancelModal(false);
    setSelectedBooking(null);
    fetchBookings();
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading your bookings...</p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="container mt-5">
        <div className="mb-4">
          <h2>My Bookings</h2>
          <p className="text-muted">View and manage your reservations</p>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show">
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError("")}
            ></button>
          </div>
        )}

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "packages" ? "active" : ""}`}
              onClick={() => setActiveTab("packages")}
            >
              Package Tours ({packageBookings.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "buses" ? "active" : ""}`}
              onClick={() => setActiveTab("buses")}
            >
              Bus Tickets ({busBookings.length})
            </button>
          </li>
        </ul>

        {/* Package Bookings Tab */}
        {activeTab === "packages" && (
          <div>
            {packageBookings.length === 0 ? (
              <div className="alert alert-info">No package bookings yet</div>
            ) : (
              <div className="row">
                {packageBookings.map((booking) => (
                  <div key={booking._id} className="col-md-6 col-lg-4 mb-4">
                    <div className="card h-100">
                      <div className="card-body">
                        <h5 className="card-title">
                          {booking.Package_id?.package_name || "Package Tour"}
                        </h5>

                        <div className="mb-3">
                          <p className="text-muted mb-1">
                            <small>Travellers</small>
                          </p>
                          <p className="mb-0">{booking.travellers || 0} people</p>
                        </div>

                        <div className="mb-3">
                          <p className="text-muted mb-1">
                            <small>Price</small>
                          </p>
                          <h5 className="mb-0">
                            ₹{booking.total_amount?.toFixed(2)}
                          </h5>
                        </div>

                        <div className="mb-3">
                          <p className="text-muted mb-1">
                            <small>Booking Date</small>
                          </p>
                          <p className="mb-0">
                            {new Date(booking.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <button
                          className="btn btn-danger w-100"
                          onClick={() => handleCancelClick(booking, "package")}
                        >
                          Cancel Booking
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bus Bookings Tab */}
        {activeTab === "buses" && (
          <div>
            {busBookings.length === 0 ? (
              <div className="alert alert-info">No bus bookings yet</div>
            ) : (
              <div className="row">
                {busBookings.map((booking) => (
                  <div key={booking._id} className="col-md-6 col-lg-4 mb-4">
                    <div className="card h-100">
                      <div className="card-body">
                        <h5 className="card-title">
                          {booking.route_id?.bus_id?.bus_name || "Bus Ticket"}
                        </h5>

                        <div className="mb-3">
                          <p className="text-muted mb-1">
                            <small>Route</small>
                          </p>
                          <p className="mb-0">
                            {booking.route_id?.boarding_from || "N/A"} →{" "}
                            {booking.route_id?.destination || "N/A"}
                          </p>
                        </div>

                        <div className="mb-3">
                          <p className="text-muted mb-1">
                            <small>Seats</small>
                          </p>
                          <p className="mb-0">
                            {booking.seat_numbers?.join(", ") || "N/A"}
                          </p>
                        </div>

                        <div className="mb-3">
                          <p className="text-muted mb-1">
                            <small>Price</small>
                          </p>
                          <h5 className="mb-0">
                            ₹{booking.total_amount?.toFixed(2)}
                          </h5>
                        </div>

                        <div className="mb-3">
                          <p className="text-muted mb-1">
                            <small>Travel Date</small>
                          </p>
                          <p className="mb-0">
                            {new Date(booking.travel_date).toLocaleDateString()}
                          </p>
                        </div>

                        <button
                          className="btn btn-danger w-100"
                          onClick={() => handleCancelClick(booking, "bus")}
                        >
                          Cancel Booking
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cancel Modal */}
        {selectedBooking && (
          <CancelBookingModal
            show={showCancelModal}
            bookingId={selectedBooking.id}
            bookingType={selectedBooking.type === "package" ? "Package" : "Bus"}
            amount={selectedBooking.amount}
            onClose={() => {
              setShowCancelModal(false);
              setSelectedBooking(null);
            }}
            onSuccess={handleCancelSuccess}
          />
        )}
      </div>
    </>
  );
};

export default MyBookings;