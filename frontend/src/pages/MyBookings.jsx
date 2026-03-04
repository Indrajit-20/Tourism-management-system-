import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const MyBookings = () => {
  const [packageBookings, setPackageBookings] = useState([]);
  const [busBookings, setBusBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("packages");

  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedForFeedback, setSelectedForFeedback] = useState({
    packageId: "",
    bookingId: "",
  });
  const [feedback, setFeedback] = useState({ rating: 5, review_text: "" });

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
      const packageRes = await axios.get(
        "http://localhost:4000/api/bookings/my-bookings",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPackageBookings(packageRes.data || []);

      // Fetch bus bookings
      const busRes = await axios.get(
        "http://localhost:4000/api/bus-bookings/my-bookings",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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
      amount: booking.total_amount,
    });
    setShowCancelModal(true);
  };

  const handleCancelSuccess = () => {
    setShowCancelModal(false);
    setSelectedBooking(null);
    fetchBookings(); // Refresh list to show updated status
  };

  const closeModal = () => {
    setShowCancelModal(false);
    setSelectedBooking(null);
  };

  // Handle feedback input
  const handleFeedbackChange = (e) => {
    const { name, value } = e.target;
    setFeedback({ ...feedback, [name]: value });
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:4000/api/feedback/submit",
        {
          rating: parseInt(feedback.rating),
          review_text: feedback.review_text,
          package_booking_id: selectedForFeedback.bookingId,
          package_id: selectedForFeedback.packageId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Thank you for your feedback!");
      setShowFeedbackModal(false);
      setFeedback({ rating: 5, review_text: "" });
    } catch (err) {
      alert("Error submitting feedback");
      console.error(err);
    }
  };

  const openFeedbackModal = (packageId, bookingId) => {
    setSelectedForFeedback({ packageId, bookingId });
    setShowFeedbackModal(true);
  };

  // Generate invoice for a booking
  const handleGetInvoice = async (bookingId, bookingType) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:4000/api/invoice/create",
        { booking_id: bookingId, booking_type: bookingType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Invoice created! Go to My Invoices to view it.");
    } catch (err) {
      if (err.response?.data?.message === "Invoice already exists") {
        alert("Invoice already exists! Go to My Invoices to view it.");
      } else {
        alert(
          "Error creating invoice: " +
            (err.response?.data?.message || err.message)
        );
      }
    }
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
      <div className="container mt-5">
        <h2 className="mb-4">My Bookings</h2>

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
                    <div className="card h-100 shadow-sm border-0">
                      <div className="card-body">
                        <h5 className="card-title fw-bold text-primary">
                          {booking.Package_id?.package_name || "Package Tour"}
                        </h5>

                        <div className="mb-3">
                          <p className="text-muted mb-1">
                            <small>Travellers</small>
                          </p>
                          <p className="mb-0">
                            {booking.travellers || 0} people
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
                            <small>Booking Date</small>
                          </p>
                          <p className="mb-0">
                            {new Date(booking.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="mb-3">
                          <p className="text-muted mb-1">
                            <small>Status</small>
                          </p>
                          <span
                            className={`badge ${
                              booking.booking_status === "Cancelled"
                                ? "bg-danger"
                                : booking.booking_status === "Confirmed"
                                ? "bg-success"
                                : "bg-warning text-dark"
                            }`}
                          >
                            {booking.booking_status}
                          </span>
                        </div>

                        {booking.booking_status !== "Cancelled" && (
                          <div className="d-flex flex-column gap-2">
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-outline-primary flex-grow-1"
                                onClick={() =>
                                  handleGetInvoice(booking._id, "Package")
                                }
                              >
                                Invoice
                              </button>
                              <button
                                className="btn btn-outline-danger flex-grow-1"
                                onClick={() =>
                                  handleCancelClick(booking, "package")
                                }
                              >
                                Cancel
                              </button>
                            </div>
                            <button
                              className="btn btn-success w-100"
                              onClick={() =>
                                openFeedbackModal(
                                  booking.Package_id?._id,
                                  booking._id
                                )
                              }
                            >
                              Share Review
                            </button>
                          </div>
                        )}
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

                        <div className="mb-3">
                          <p className="text-muted mb-1">
                            <small>Status</small>
                          </p>
                          <span
                            className={`badge ${
                              booking.booking_status === "Cancelled"
                                ? "bg-danger"
                                : booking.booking_status === "Confirmed"
                                ? "bg-success"
                                : "bg-warning text-dark"
                            }`}
                          >
                            {booking.booking_status}
                          </span>
                        </div>

                        {booking.booking_status !== "Cancelled" && (
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-outline-primary flex-grow-1"
                              onClick={() =>
                                handleGetInvoice(booking._id, "Bus")
                              }
                            >
                              Get Invoice
                            </button>
                            <button
                              className="btn btn-danger flex-grow-1"
                              onClick={() => handleCancelClick(booking, "bus")}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cancel Modal */}
        {
          selectedBooking && (
            <CancelBookingModal
              show={showCancelModal}
              bookingId={selectedBooking.id}
              bookingType={
                selectedBooking.type === "package" ? "Package" : "Bus"
              }
              amount={selectedBooking.amount}
              onClose={closeModal}
              onSuccess={handleCancelSuccess}
            />
          )

          /* --- FEEDBACK MODAL --- */
        }
        {showFeedbackModal && (
          <div
            className="modal d-block"
            style={{
              backgroundColor: "rgba(0,0,0,0.5)",
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 1050,
            }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">Share Your Experience</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowFeedbackModal(false)}
                  />
                </div>
                <div className="modal-body p-4">
                  <form onSubmit={handleFeedbackSubmit}>
                    <div className="mb-3 text-center">
                      <label className="form-label d-block fw-bold">
                        How was your trip?
                      </label>
                      <select
                        name="rating"
                        className="form-select form-select-lg"
                        value={feedback.rating}
                        onChange={handleFeedbackChange}
                        required
                      >
                        <option value={5}>⭐⭐⭐⭐⭐ Excellent</option>
                        <option value={4}>⭐⭐⭐⭐ Good</option>
                        <option value={3}>⭐⭐⭐ Average</option>
                        <option value={2}>⭐⭐ Below Average</option>
                        <option value={1}>⭐ Poor</option>
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-bold">Your Message</label>
                      <textarea
                        name="review_text"
                        className="form-control"
                        placeholder="Tell us what you loved about this tour..."
                        rows="4"
                        value={feedback.review_text}
                        onChange={handleFeedbackChange}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-100 py-2 fs-5 shadow-sm"
                    >
                      Submit Review
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MyBookings;
