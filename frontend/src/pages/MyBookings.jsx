import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:4000";

// ─────────────────────────────────────────────
// Countdown Timer
// Shows how much time is left to pay
// Example: "28m 45s"
// ─────────────────────────────────────────────
const CountdownTimer = ({ deadline, onExpired }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // This function runs every 1 second
    const tick = () => {
      const now = new Date();
      const deadlineTime = new Date(deadline);

      // difference in milliseconds
      const diff = deadlineTime - now;

      // If time is up
      if (diff <= 0) {
        setTimeLeft("Expired");
        setIsExpired(true);
        onExpired && onExpired(); // tell parent component time is up
        return;
      }

      // Convert milliseconds to minutes and seconds
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}m ${seconds}s`);
    };

    tick(); // run immediately first time
    const timer = setInterval(tick, 1000); // then run every 1 second

    // Cleanup — stop timer when component removed
    return () => clearInterval(timer);
  }, [deadline]);

  // If expired show red badge
  if (isExpired) {
    return <span className="badge bg-danger">⏰ Time Expired</span>;
  }

  // If less than 5 minutes left — show red (urgent)
  // Otherwise show yellow
  const minutes = parseInt(timeLeft);
  const isUrgent = minutes < 5;

  return (
    <span
      className={`badge ${isUrgent ? "bg-danger" : "bg-warning text-dark"}`}
    >
      ⏰ Pay in: {timeLeft}
    </span>
  );
};

// ─────────────────────────────────────────────
// MyBookings Page
// Shows all bookings of logged in user
// ─────────────────────────────────────────────
const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All"); // filter by status
  const navigate = useNavigate();

  // Load bookings when page opens
  useEffect(() => {
    fetchMyBookings();
  }, []);

  // Fetch all bookings of this user from backend
  const fetchMyBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/bus-bookings/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(res.data || []);
    } catch (err) {
      console.error("Error fetching bookings", err);
    } finally {
      setLoading(false);
    }
  };

  // Get route name from booking
  // booking → trip → schedule → route → boarding_from + destination
  const getRouteName = (booking) => {
    const route = booking.trip_id?.schedule_id?.route_id;
    if (!route) return "—";
    return `${route.boarding_from} → ${route.destination}`;
  };

  // Format date nicely
  // Example: "25 Mar 2024"
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Show colored badge for booking status
  const getStatusBadge = (status) => {
    if (status === "Pending")
      return <span className="badge bg-warning text-dark">Pending</span>;
    if (status === "Approved")
      return <span className="badge bg-info text-dark">Approved</span>;
    if (status === "Confirmed")
      return <span className="badge bg-success">Confirmed</span>;
    if (status === "Rejected")
      return <span className="badge bg-danger">Rejected</span>;
    if (status === "Cancelled")
      return <span className="badge bg-secondary">Cancelled</span>;
    return <span className="badge bg-secondary">{status}</span>;
  };

  // When user clicks Pay Now button
  const handlePayNow = async (booking) => {
    try {
      // Step 1 — Create payment order on backend
      const orderRes = await axios.post(`${API}/api/payment/create-order`, {
        amount: booking.total_amount,
      });

      const route = booking.trip_id?.schedule_id?.route_id;

      // Step 2 — Open Razorpay payment popup
      const options = {
        key: "rzp_test_SMPUHkAalgy2kE",
        amount: orderRes.data.amount,
        currency: "INR",
        name: "Bus Ticket Payment",
        description: route
          ? `${route.boarding_from} → ${route.destination}`
          : "Bus Booking",
        order_id: orderRes.data.id,

        // Step 3 — After payment success
        handler: async (response) => {
          try {
            const token = localStorage.getItem("token");

            // Tell backend payment is done
            await axios.post(
              `${API}/api/bus-bookings/confirm-payment`,
              {
                booking_id: booking._id,
                payment_id: response.razorpay_payment_id,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            alert("🎉 Payment Successful! Your ticket is confirmed.");
            fetchMyBookings(); // Refresh list to show Confirmed status
          } catch (err) {
            alert(
              err.response?.data?.message ||
                "Payment confirmation failed. Contact support."
            );
          }
        },

        // If user closes payment popup without paying
        modal: {
          ondismiss: () =>
            alert("Payment cancelled. You can pay again from My Bookings."),
        },
      };

      // Open Razorpay
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert("Unable to start payment. Please try again.");
    }
  };

  // ✅ NEW: Cancel booking
  const handleCancelBooking = async (booking) => {
    // Pending, Approved, or Confirmed bookings can be cancelled
    if (
      booking.booking_status !== "Pending" &&
      booking.booking_status !== "Approved" &&
      booking.booking_status !== "Confirmed"
    ) {
      alert("Only pending, approved, or confirmed bookings can be cancelled.");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to cancel this booking? Refund will be processed if payment was made."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API}/api/bus-bookings/cancel/${booking._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("✅ Booking cancelled successfully. Seats released.");
      fetchMyBookings(); // Refresh list
    } catch (err) {
      alert(
        err.response?.data?.message || "Error cancelling booking. Try again."
      );
    }
  };

  // ✅ NEW: Download ticket as PDF/HTML
  const handleDownloadTicket = async (booking) => {
    if (booking.booking_status !== "Confirmed") {
      alert("Ticket is only available for confirmed bookings.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // Fetch ticket HTML from backend
      const res = await axios.get(
        `${API}/api/tickets/${booking._id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const { html, fileName } = res.data;

      // Create blob and download
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);

      // Option 1: Download as HTML file
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Option 2: Open in new tab to print as PDF (user can choose)
      // Uncomment below if you want to open in new tab instead
      // window.open(url, "_blank");

      URL.revokeObjectURL(url);
      alert("📥 Ticket downloaded successfully!");
    } catch (err) {
      alert(
        err.response?.data?.message || "Unable to download ticket. Try again."
      );
    }
  };

  // Filter bookings based on selected filter tab
  const filteredBookings =
    filter === "All"
      ? bookings
      : bookings.filter((b) => b.booking_status === filter);

  // Count approved bookings (to show red notification dot)
  const approvedCount = bookings.filter(
    (b) => b.booking_status === "Approved"
  ).length;

  // Show loading spinner
  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-3">Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2 className="fw-bold mb-3">My Bus Bookings</h2>

      {/* Booking flow info */}
      <div className="alert alert-info mb-4">
        <strong>How it works:</strong> You Book → Admin Approves → You Pay
        within 30 mins → Ticket Confirmed ✅
      </div>

      {/* Filter buttons — All, Pending, Approved, etc */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {[
          "All",
          "Pending",
          "Approved",
          "Confirmed",
          "Rejected",
          "Cancelled",
        ].map((f) => (
          <button
            key={f}
            className={`btn btn-sm ${
              filter === f ? "btn-primary" : "btn-outline-secondary"
            }`}
            onClick={() => setFilter(f)}
          >
            {f}
            {/* Show red dot on Approved button if there are approved bookings */}
            {f === "Approved" && approvedCount > 0 && (
              <span className="badge bg-danger ms-1">{approvedCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* No bookings message */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-5">
          <h5 className="text-muted">No bookings found</h5>
          <button
            className="btn btn-primary mt-3"
            onClick={() => navigate("/book-bus")}
          >
            Book a Bus
          </button>
        </div>
      ) : (
        // Bookings list
        <div className="row g-3">
          {filteredBookings.map((booking) => (
            <div key={booking._id} className="col-12">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="row align-items-center">
                    {/* Column 1 — Route, Travel Date, and Boarding Points */}
                    <div className="col-md-3">
                      <h6 className="fw-bold text-primary mb-1">
                        {getRouteName(booking)}
                      </h6>
                      <small className="text-muted d-block">
                        {formatDate(booking.travel_date)}
                      </small>

                      {/* Boarding Points */}
                      {booking.trip_id?.boarding_points &&
                        booking.trip_id.boarding_points.length > 0 && (
                          <div className="mt-2 pt-2 border-top">
                            <small className="text-muted d-block mb-1">
                              🚩 Boarding:
                            </small>
                            <div className="d-flex flex-wrap gap-1">
                              {booking.trip_id.boarding_points.map(
                                (point, idx) => (
                                  <span
                                    key={idx}
                                    className="badge bg-success bg-opacity-75 small"
                                  >
                                    {point}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* Drop Point */}
                      <div className="mt-2">
                        <small className="text-muted d-block">📍 Drop:</small>
                        <small className="fw-bold">
                          {getRouteName(booking).split("→")[1]?.trim()}
                        </small>
                      </div>
                    </div>

                    {/* Column 2 — Seats with individual prices */}
                    <div className="col-md-2">
                      <small className="text-muted d-block mb-1">Seats</small>
                      <div className="d-flex flex-wrap gap-1">
                        {booking.seat_numbers?.map((seatNum, index) => (
                          <span
                            key={seatNum}
                            className="badge bg-light text-dark border"
                            style={{ fontSize: "0.75rem" }}
                          >
                            {seatNum}
                            {/* Show price of this specific seat */}
                            {booking.seat_prices?.[index] && (
                              <span className="text-primary ms-1">
                                ₹{booking.seat_prices[index]}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Column 3 — Total Amount */}
                    <div className="col-md-2">
                      <small className="text-muted d-block">Total</small>
                      <strong className="text-success">
                        ₹{booking.total_amount}
                      </strong>
                    </div>

                    {/* Column 4 — Booking Status + Payment Status */}
                    <div className="col-md-2">
                      {getStatusBadge(booking.booking_status)}
                      <div className="mt-1">
                        <span
                          className={`badge ${
                            booking.payment_status === "Paid"
                              ? "bg-success"
                              : "bg-secondary"
                          }`}
                        >
                          {booking.payment_status}
                        </span>
                      </div>
                    </div>

                    {/* Column 5 — Action buttons */}
                    <div className="col-md-2 text-end">
                      {/* APPROVED — show countdown timer + Pay Now button */}
                      {booking.booking_status === "Approved" &&
                        booking.payment_status === "Pending" && (
                          <div>
                            {booking.payment_deadline && (
                              <div className="mb-2">
                                <CountdownTimer
                                  deadline={booking.payment_deadline}
                                  onExpired={fetchMyBookings}
                                />
                              </div>
                            )}
                            <button
                              className="btn btn-success btn-sm w-100 mb-2"
                              onClick={() => handlePayNow(booking)}
                            >
                              💳 Pay Now
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm w-100"
                              onClick={() => handleCancelBooking(booking)}
                            >
                              ❌ Cancel
                            </button>
                          </div>
                        )}

                      {/* PENDING — show cancel + waiting message */}
                      {booking.booking_status === "Pending" && (
                        <div>
                          <small className="text-muted d-block mb-2">
                            ⏳ Waiting for admin
                          </small>
                          <button
                            className="btn btn-outline-danger btn-sm w-100"
                            onClick={() => handleCancelBooking(booking)}
                          >
                            ❌ Cancel
                          </button>
                        </div>
                      )}

                      {/* CONFIRMED — show download + cancel + details */}
                      {booking.booking_status === "Confirmed" && (
                        <div>
                          <button
                            className="btn btn-primary btn-sm w-100 mb-2"
                            onClick={() => handleDownloadTicket(booking)}
                          >
                            📥 Download Ticket
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm w-100 mb-2"
                            onClick={() => handleCancelBooking(booking)}
                          >
                            ❌ Cancel
                          </button>
                          <small className="text-success d-block">
                            ✅ Confirmed
                          </small>
                          {booking.payment_id && (
                            <small
                              className="text-muted d-block"
                              style={{ fontSize: "0.7rem" }}
                            >
                              ID: {booking.payment_id.slice(-8)}
                            </small>
                          )}
                        </div>
                      )}

                      {/* REJECTED — show status */}
                      {booking.booking_status === "Rejected" && (
                        <div className="text-danger small">
                          ❌ Rejected
                          <small className="d-block mt-1">
                            <button
                              className="btn btn-link btn-sm p-0"
                              onClick={() => navigate("/book-bus")}
                            >
                              Book again
                            </button>
                          </small>
                        </div>
                      )}

                      {/* CANCELLED — show status */}
                      {booking.booking_status === "Cancelled" && (
                        <div className="text-secondary small">
                          ⏸️ Cancelled
                          <small className="d-block mt-1">
                            <button
                              className="btn btn-link btn-sm p-0"
                              onClick={() => navigate("/book-bus")}
                            >
                              Book again
                            </button>
                          </small>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Warning banner — only for Approved bookings */}
                  {booking.booking_status === "Approved" &&
                    booking.payment_deadline && (
                      <div className="alert alert-warning mt-3 mb-0 py-2">
                        ⚠️ <strong>Please pay before </strong>
                        {new Date(booking.payment_deadline).toLocaleTimeString(
                          "en-IN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          }
                        )}{" "}
                        — otherwise booking will be auto cancelled!
                      </div>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
