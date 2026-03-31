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
  const [packageBookings, setPackageBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All"); // filter by status
  const [bookingTypeFilter, setBookingTypeFilter] = useState("All");
  const [reviewDrafts, setReviewDrafts] = useState({});
  const navigate = useNavigate();
  const normalizeStatus = (value) => String(value || "").toLowerCase();

  // Load bookings when page opens
  useEffect(() => {
    fetchMyBookings();
  }, []);

  // Fetch all bookings of this user from backend
  const fetchMyBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [busRes, packageRes] = await Promise.all([
        axios.get(`${API}/api/bus-bookings/my-bookings`, { headers }),
        axios.get(`${API}/api/bookings/my-bookings`, { headers }),
      ]);

      setBookings(busRes.data || []);
      setPackageBookings(packageRes.data || []);
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

  const getPackageRouteName = (booking) => {
    const source = booking?.Package_id?.source_city || "-";
    const destination = booking?.Package_id?.destination || "-";
    return `${source} → ${destination}`;
  };

  // Show colored badge for booking status
  const getStatusBadge = (status) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "pending")
      return <span className="badge bg-warning text-dark">Pending</span>;
    if (normalized === "approved")
      return <span className="badge bg-info text-dark">Approved</span>;
    if (normalized === "confirmed")
      return <span className="badge bg-success">Confirmed</span>;
    if (normalized === "rejected")
      return <span className="badge bg-danger">Rejected</span>;
    if (normalized === "cancelled")
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
              { headers: { Authorization: `Bearer ${token}` } },
            );

            alert("🎉 Payment Successful! Your ticket is confirmed.");
            fetchMyBookings(); // Refresh list to show Confirmed status
          } catch (err) {
            alert(
              err.response?.data?.message ||
                "Payment confirmation failed. Contact support.",
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
        "Are you sure you want to cancel this booking? Refund will be processed if payment was made.",
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API}/api/bus-bookings/cancel/${booking._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      alert("✅ Booking cancelled successfully. Seats released.");
      fetchMyBookings(); // Refresh list
    } catch (err) {
      alert(
        err.response?.data?.message || "Error cancelling booking. Try again.",
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
        },
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
        err.response?.data?.message || "Unable to download ticket. Try again.",
      );
    }
  };

  const handleCancelPackageBooking = async (booking) => {
    const normalizedStatus = String(booking.booking_status || "").toLowerCase();
    if (
      normalizedStatus !== "pending" &&
      normalizedStatus !== "confirmed" &&
      normalizedStatus !== "approved"
    ) {
      alert(
        "Only pending, approved, or confirmed package bookings can be cancelled.",
      );
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const previewRes = await axios.post(
        `${API}/api/cancellation/preview`,
        { booking_id: booking._id },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const preview = previewRes.data;
      const confirmText = [
        `Amount paid: Rs. ${preview.amount_paid || 0}`,
        `Refund amount: Rs. ${preview.refund_amount || 0}`,
        `Non-refundable amount: Rs. ${preview.non_refundable_amount || 0}`,
        "",
        "Do you want to proceed with cancellation?",
      ].join("\n");

      if (!window.confirm(confirmText)) {
        return;
      }

      await axios.post(
        `${API}/api/cancellation/cancel`,
        {
          booking_id: booking._id,
          booking_type: "Package",
          reason: "Cancelled by user from My Bookings",
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      alert("✅ Package booking cancelled successfully.");
      fetchMyBookings();
    } catch (err) {
      alert(err.response?.data?.message || "Error cancelling package booking.");
    }
  };

  const handlePayNowPackage = async (booking) => {
    try {
      const token = localStorage.getItem("token");

      const orderRes = await axios.post(`${API}/api/payment/create-order`, {
        amount: booking.total_amount,
      });

      const options = {
        key: "rzp_test_SMPUHkAalgy2kE",
        amount: orderRes.data.amount,
        currency: "INR",
        name: "Tour Package Payment",
        description: booking.Package_id?.package_name || "Tour Booking",
        order_id: orderRes.data.id,
        handler: async (response) => {
          await axios.post(
            `${API}/api/bookings/confirm-payment`,
            {
              booking_id: booking._id,
              payment_id: response.razorpay_payment_id,
            },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          alert("Payment successful! Booking confirmed.");
          fetchMyBookings();
        },
        modal: {
          ondismiss: () =>
            alert("Payment cancelled. You can pay again from My Bookings."),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert(
        err.response?.data?.message || "Unable to process package payment.",
      );
    }
  };

  const handleReviewChange = (bookingId, field, value) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [bookingId]: {
        rating: prev[bookingId]?.rating || 5,
        review_text: prev[bookingId]?.review_text || "",
        [field]: value,
      },
    }));
  };

  const handleSubmitReview = async (booking) => {
    try {
      const token = localStorage.getItem("token");
      const draft = reviewDrafts[booking._id] || { rating: 5, review_text: "" };

      if (!draft.review_text || !String(draft.review_text).trim()) {
        alert("Please write a review before submitting.");
        return;
      }

      await axios.post(
        `${API}/api/feedback/submit`,
        {
          package_booking_id: booking._id,
          rating: Number(draft.rating || 5),
          review_text: String(draft.review_text).trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      alert("Review submitted successfully.");
      fetchMyBookings();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit review.");
    }
  };

  // Filter bookings based on selected filter tab
  const filteredBookings =
    filter === "All"
      ? bookings
      : bookings.filter((b) => b.booking_status === filter);

  const filteredPackageBookings =
    filter === "All"
      ? packageBookings
      : packageBookings.filter(
          (b) => normalizeStatus(b.booking_status) === normalizeStatus(filter),
        );

  // Count approved bookings (to show red notification dot)
  const approvedCount = bookings.filter(
    (b) => b.booking_status === "Approved",
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
      <h2 className="fw-bold mb-3">My Bookings</h2>

      <div className="d-flex gap-2 mb-3 flex-wrap">
        {["All", "Bus", "Package"].map((type) => (
          <button
            key={type}
            className={`btn btn-lg px-4 py-2 fw-semibold ${
              bookingTypeFilter === type ? "btn-dark" : "btn-outline-dark"
            }`}
            onClick={() => setBookingTypeFilter(type)}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Status filter for both bus and package bookings */}
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
            {/* Show red dot on Approved button if there are approved bus bookings */}
            {f === "Approved" && approvedCount > 0 && (
              <span className="badge bg-danger ms-1">{approvedCount}</span>
            )}
          </button>
        ))}
      </div>

      {(bookingTypeFilter === "All" || bookingTypeFilter === "Bus") && (
        <>
          <h5 className="mb-3">Bus Bookings</h5>

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
                                    ),
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Drop Point */}
                          <div className="mt-2">
                            <small className="text-muted d-block">
                              📍 Drop:
                            </small>
                            <small className="fw-bold">
                              {getRouteName(booking).split("→")[1]?.trim()}
                            </small>
                          </div>
                        </div>

                        {/* Column 2 — Seats with individual prices */}
                        <div className="col-md-2">
                          <small className="text-muted d-block mb-1">
                            Seats
                          </small>
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
                          {/* CONFIRMED — show countdown timer + Pay Now button (if not yet paid) */}
                          {booking.booking_status === "Confirmed" &&
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

                          {/* CONFIRMED + PAID — show download + cancel + details */}
                          {booking.booking_status === "Confirmed" &&
                            booking.payment_status === "Paid" && (
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
                                  ✅ Confirmed & Paid
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
                            {new Date(
                              booking.payment_deadline,
                            ).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}{" "}
                            — otherwise booking will be auto cancelled!
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {(bookingTypeFilter === "All" || bookingTypeFilter === "Package") && (
        <div className="mt-5">
          <h5 className="mb-3">Tour Package Bookings</h5>

          {filteredPackageBookings.length === 0 ? (
            <div className="text-center py-4 border rounded bg-light">
              <h6 className="text-muted">No package bookings found</h6>
              <button
                className="btn btn-primary mt-2"
                onClick={() => navigate("/packages")}
              >
                Browse Packages
              </button>
            </div>
          ) : (
            <div className="row g-3">
              {filteredPackageBookings.map((booking) => {
                const packageInfo = booking.Package_id || {};
                return (
                  <div key={booking._id} className="col-12">
                    <div className="card shadow-sm">
                      <div className="card-body">
                        <div className="row align-items-center g-3">
                          <div className="col-md-3">
                            <h6 className="fw-bold text-primary mb-1">
                              {packageInfo.package_name || "Tour Package"}
                            </h6>
                            <small className="text-muted d-block">
                              {getPackageRouteName(booking)}
                            </small>
                            <small className="text-muted d-block mt-1">
                              Start:{" "}
                              {formatDate(
                                booking?.tour_schedule_id?.start_date,
                              )}
                            </small>
                            <small className="text-muted d-block">
                              End:{" "}
                              {formatDate(booking?.tour_schedule_id?.end_date)}
                            </small>
                          </div>

                          <div className="col-md-2">
                            <small className="text-muted d-block mb-1">
                              Seats
                            </small>
                            <div className="d-flex flex-wrap gap-1">
                              {(booking.seat_numbers || []).map((seat) => (
                                <span
                                  key={seat}
                                  className="badge bg-light text-dark border"
                                >
                                  {seat}
                                </span>
                              ))}
                              {(!booking.seat_numbers ||
                                booking.seat_numbers.length === 0) && (
                                <span className="text-muted">—</span>
                              )}
                            </div>
                          </div>

                          <div className="col-md-2">
                            <small className="text-muted d-block">
                              Travellers
                            </small>
                            <strong>{booking.travellers || 0}</strong>
                            <small className="text-muted d-block mt-1">
                              Duration
                            </small>
                            <strong>{packageInfo.duration || "-"}</strong>
                          </div>

                          <div className="col-md-2">
                            <small className="text-muted d-block">Total</small>
                            <strong className="text-success">
                              ₹{booking.total_amount || 0}
                            </strong>
                            <small className="text-muted d-block mt-1">
                              Booked On
                            </small>
                            <strong>
                              {formatDate(
                                booking.createdAt || booking.booking_date,
                              )}
                            </strong>
                          </div>

                          <div className="col-md-1">
                            {getStatusBadge(booking.booking_status)}
                          </div>

                          <div className="col-md-2 text-end">
                            {normalizeStatus(booking.booking_status) ===
                              "approved" && (
                              <button
                                className="btn btn-success btn-sm w-100 mb-2"
                                onClick={() => handlePayNowPackage(booking)}
                              >
                                💳 Pay Now
                              </button>
                            )}

                            {normalizeStatus(booking.booking_status) !==
                              "cancelled" &&
                            normalizeStatus(booking.booking_status) !==
                              "rejected" ? (
                              <button
                                className="btn btn-outline-danger btn-sm w-100"
                                onClick={() =>
                                  handleCancelPackageBooking(booking)
                                }
                              >
                                ❌ Cancel
                              </button>
                            ) : (
                              <small className="text-muted">No actions</small>
                            )}
                          </div>

                          {normalizeStatus(booking.booking_status) ===
                            "completed" &&
                            !booking.review_submitted && (
                              <div className="col-12 mt-2">
                                <div className="border rounded p-3 bg-light">
                                  <h6 className="mb-2">Write a Review</h6>
                                  <div className="row g-2">
                                    <div className="col-md-2">
                                      <select
                                        className="form-select"
                                        value={
                                          reviewDrafts[booking._id]?.rating || 5
                                        }
                                        onChange={(e) =>
                                          handleReviewChange(
                                            booking._id,
                                            "rating",
                                            e.target.value,
                                          )
                                        }
                                      >
                                        {[5, 4, 3, 2, 1].map((value) => (
                                          <option key={value} value={value}>
                                            {value} Star
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="col-md-8">
                                      <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Share your experience"
                                        value={
                                          reviewDrafts[booking._id]
                                            ?.review_text || ""
                                        }
                                        onChange={(e) =>
                                          handleReviewChange(
                                            booking._id,
                                            "review_text",
                                            e.target.value,
                                          )
                                        }
                                      />
                                    </div>
                                    <div className="col-md-2 d-grid">
                                      <button
                                        className="btn btn-primary"
                                        onClick={() =>
                                          handleSubmitReview(booking)
                                        }
                                      >
                                        Submit
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                          {normalizeStatus(booking.booking_status) ===
                            "completed" &&
                            booking.review_submitted && (
                              <div className="col-12 mt-2">
                                <small className="text-success">
                                  Review already submitted for this booking.
                                </small>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
