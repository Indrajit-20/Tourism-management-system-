import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import BusLayout from "../components/BusLayout";

// ✅ Single place to change your API URL
const API = "http://localhost:4000";

// ✅ Load Razorpay script dynamically
const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const SeatSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Data passed from BookBus page
  const { route, date, trip: passedTrip } = location.state || {};

  const [trip, setTrip] = useState(passedTrip || null);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(!passedTrip);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // No route data — go back
    if (!route || !date) {
      alert("Please select a route first");
      navigate("/book-bus");
      return;
    }

    // Trip already passed — use directly
    if (passedTrip) {
      fetchBookedSeats(passedTrip._id);
      setLoading(false);
      return;
    }

    fetchTripForRoute();
  }, [route, date]);

  // Fetch trip for this route + date
  const fetchTripForRoute = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${API}/api/bus-trips?route_id=${route._id}&date=${date}`,
      );
      const foundTrip = (res.data || [])[0];

      if (!foundTrip) {
        setError("No trip available on this date. Please choose another date.");
        return;
      }

      setTrip(foundTrip);
      fetchBookedSeats(foundTrip._id);
    } catch (err) {
      console.error("Error fetching trip:", err);
      setError("Unable to load trip. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch already booked seats for this trip
  const fetchBookedSeats = async (tripId) => {
    try {
      const res = await axios.get(
        `${API}/api/bus-bookings/seats?trip_id=${tripId}`,
      );
      setBookedSeats(res.data || []);
    } catch (err) {
      console.error("Error fetching booked seats:", err);
    }
  };

  // User clicks a seat — toggle select/deselect
  const handleSeatClick = (seatNumber) => {
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNumber));
      return;
    }
    if (selectedSeats.length >= 5) {
      alert("Maximum 5 seats per booking.");
      return;
    }
    setSelectedSeats([...selectedSeats, seatNumber]);
  };

  // Calculate total price of selected seats
  const calculateTotal = () => {
    if (!trip?.seats || selectedSeats.length === 0) return 0;
    let total = 0;
    selectedSeats.forEach((seatNumber) => {
      const seat = trip.seats.find((s) => s.seat_number === seatNumber);
      total += seat?.price || route?.price_per_seat || 0;
    });
    return total;
  };

  const formatDateDMY = (value) => {
    if (!value) return "-";
    const dateObj = new Date(value);
    if (Number.isNaN(dateObj.getTime())) return String(value);
    return dateObj.toLocaleDateString("en-GB");
  };

  // Main booking + payment handler
  const handleSubmitRequest = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (selectedSeats.length === 0) {
      alert("Please select at least one seat.");
      return;
    }

    setSubmitting(true);

    try {
      // ── STEP 1: Re-check seats are still free ──
      const checkRes = await axios.get(
        `${API}/api/bus-bookings/seats?trip_id=${trip._id}`,
      );
      const latestBooked = checkRes.data || [];
      const conflictSeats = selectedSeats.filter((s) =>
        latestBooked.includes(s),
      );

      if (conflictSeats.length > 0) {
        alert(
          `Seat(s) ${conflictSeats.join(
            ", ",
          )} were just booked. Please reselect.`,
        );
        setBookedSeats(latestBooked);
        setSelectedSeats(
          selectedSeats.filter((s) => !conflictSeats.includes(s)),
        );
        setSubmitting(false);
        return;
      }

      // ── STEP 2: Calculate total ──
      const totalAmount = calculateTotal();

      // ── STEP 3: Create Razorpay order from backend ──
      const orderRes = await axios.post(
        `${API}/api/payment/create-order`,
        { amount: totalAmount },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const { id: orderId } = orderRes.data;

      // ── STEP 4: Load Razorpay script ──
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        alert("Failed to load Razorpay. Please try again.");
        setSubmitting(false);
        return;
      }

      // ── STEP 5: Open Razorpay popup ──
      const options = {
        key: "rzp_test_SMPUHkAalgy2kE", // ✅ Must match backend key_id
        amount: totalAmount * 100, // Razorpay needs paise
        currency: "INR",
        order_id: orderId,

        handler: async (response) => {
          // ── PAYMENT SUCCESS: create booking then confirm payment ──
          try {
            // Create booking after payment success
            const bookingRes = await axios.post(
              `${API}/api/bus-bookings/book`,
              {
                trip_id: trip._id,
                seat_numbers: selectedSeats,
              },
              { headers: { Authorization: `Bearer ${token}` } },
            );

            const booking = bookingRes.data.booking;

            // Confirm payment in backend
            await axios.post(
              `${API}/api/bus-bookings/confirm-payment`,
              {
                booking_id: booking._id,
                payment_id: response.razorpay_payment_id,
              },
              { headers: { Authorization: `Bearer ${token}` } },
            );

            // Create invoice for this paid booking (safe if already exists)
            try {
              await axios.post(
                `${API}/api/invoice/create`,
                {
                  booking_id: booking._id,
                  booking_type: "Bus",
                  transaction_id: response.razorpay_payment_id,
                },
                { headers: { Authorization: `Bearer ${token}` } },
              );
            } catch (invoiceErr) {
              const message = String(
                invoiceErr?.response?.data?.message || "",
              ).toLowerCase();
              if (!message.includes("already exists")) {
                console.error("Invoice creation failed:", invoiceErr);
              }
            }

            alert("✅ Payment successful! Your ticket is confirmed.");
            navigate("/my-bookings");
          } catch (err) {
            console.error("Booking after payment failed:", err);
            alert(
              "Payment received but booking failed. Please contact support.",
            );
            navigate("/my-bookings");
          }
        },

        prefill: {
          name: localStorage.getItem("username") || "Customer",
          email: "customer@example.com",
        },

        theme: { color: "#3399cc" },

        modal: {
          ondismiss: () => {
            alert("Payment cancelled. Your seats are still available.");
            setSubmitting(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Error:", err);
      alert(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
      setSubmitting(false);
    }
  };

  // ── Loading state ──
  if (!route) return null;

  if (loading) {
    return (
      <div className="container mt-4 text-center">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-3">Loading trip details...</p>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="container mt-4 text-center">
        <h3>Seat Selection</h3>
        <div className="alert alert-danger">{error}</div>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/book-bus")}
        >
          ← Back to Routes
        </button>
      </div>
    );
  }

  const total = calculateTotal();
  const busType = route.bus_id?.bus_type || "AC";
  const layoutType = route.bus_id?.layout_type || "seater";
  const isSleeper = String(layoutType) === "sleeper";
  const isDoubleDecker = String(layoutType) === "double_decker";
  const seatLayout = trip?.seats || [];

  return (
    <div className="container mt-4">
      {/* ── Page Header ── */}
      <div className="text-center mb-4">
        <h3 className="fw-bold">Select {isSleeper ? "Berths" : "Seats"}</h3>
        <p className="text-muted mb-2">
          {route.boarding_from} → {route.destination} · {formatDateDMY(date)}
        </p>
        <small className="text-muted d-block mb-2">
          Boarding:{" "}
          {trip?.boarding_points?.[0] ||
            route.board_point ||
            route.boarding_from}{" "}
          | Drop:{" "}
          {trip?.drop_points?.[0] || route.drop_point || route.destination}
        </small>
        <span
          className={`badge me-2 ${
            isSleeper
              ? "bg-primary"
              : isDoubleDecker
                ? "bg-warning text-dark"
                : "bg-info"
          }`}
        >
          {isSleeper ? "Sleeper" : isDoubleDecker ? "Double Decker" : busType}{" "}
          Bus
        </span>
        <span className="badge bg-secondary">
          Bus No: {route.bus_id?.bus_number}
        </span>
      </div>

      {/* ── How booking works ── */}
      <div className="alert alert-info mb-4">
        <strong>How booking works:</strong>
        <ol className="mb-0 mt-1">
          <li>Select your {isSleeper ? "berths" : "seats"} below</li>
          <li>Click "Book & Pay Now"</li>
          <li>Complete payment via Razorpay</li>
          <li>Ticket confirmed instantly ✅</li>
        </ol>
      </div>

      {/* ── Seat availability summary ── */}
      <div className="alert alert-success mb-4">
        <div className="row g-3 text-center">
          <div className="col-md-4">
            <h5 className="mb-1">{seatLayout.length}</h5>
            <small className="text-muted">Total Seats</small>
          </div>
          <div className="col-md-4">
            <h5 className="mb-1 text-danger">{bookedSeats.length}</h5>
            <small className="text-muted">Booked</small>
          </div>
          <div className="col-md-4">
            <h5 className="mb-1 text-success">
              {seatLayout.length - bookedSeats.length}
            </h5>
            <small className="text-muted">Available</small>
          </div>
        </div>
      </div>

      <div className="row justify-content-center">
        {/* ── Seat Layout ── */}
        <div className="col-md-7 mb-4">
          <BusLayout
            seatLayout={seatLayout}
            bookedSeats={bookedSeats}
            selectedSeats={selectedSeats}
            onSeatClick={handleSeatClick}
            busType={busType}
            layoutType={layoutType}
          />
        </div>

        {/* ── Booking Summary ── */}
        <div className="col-md-4">
          <div
            className="card shadow-sm p-3"
            style={{ position: "sticky", top: 20 }}
          >
            <h5 className="fw-bold border-bottom pb-2 mb-3">Booking Summary</h5>

            <div className="mb-2">
              <small className="text-muted d-block">Route</small>
              <strong>
                {route.boarding_from} → {route.destination}
              </strong>
            </div>

            <div className="mb-2">
              <small className="text-muted d-block">Boarding / Drop</small>
              <strong>
                {trip?.boarding_points?.[0] ||
                  route.board_point ||
                  route.boarding_from}{" "}
                →{" "}
                {trip?.drop_points?.[0] ||
                  route.drop_point ||
                  route.destination}
              </strong>
            </div>

            <div className="mb-2">
              <small className="text-muted d-block">Travel Date</small>
              <strong>{formatDateDMY(date)}</strong>
            </div>

            <div className="mb-3 pb-2 border-bottom">
              <small className="text-muted d-block">Bus Type</small>
              <strong>{busType}</strong>
            </div>

            {/* Boarding Points */}
            {trip?.boarding_points?.length > 0 && (
              <div className="mb-3 pb-2 border-bottom">
                <small className="text-muted d-block mb-1">
                  Boarding Points
                </small>
                <div className="d-flex flex-wrap gap-1">
                  {trip.boarding_points.map((point, idx) => (
                    <span key={idx} className="badge bg-success">
                      {point}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Selected seats */}
            <div className="mb-3 pb-2 border-bottom">
              <small className="text-muted d-block mb-1">
                Selected {isSleeper ? "Berths" : "Seats"}
              </small>

              {selectedSeats.length === 0 ? (
                <small className="text-muted">No seats selected yet</small>
              ) : (
                selectedSeats.map((seatNumber) => {
                  const seat = trip?.seats?.find(
                    (s) => s.seat_number === seatNumber,
                  );
                  return (
                    <div
                      key={seatNumber}
                      className="d-flex justify-content-between align-items-center mb-1"
                    >
                      <span>
                        <strong>{seatNumber}</strong>
                        <small className="text-muted ms-1">
                          ({seat?.type})
                        </small>
                      </span>
                      <span className="text-primary fw-bold">
                        ₹{seat?.price || 0}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Total */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-muted">Total Amount</span>
              <h4 className="text-success fw-bold mb-0">₹{total}</h4>
            </div>

            {/* Book Button */}
            <button
              className="btn btn-success w-100 py-2"
              onClick={handleSubmitRequest}
              disabled={selectedSeats.length === 0 || submitting}
            >
              {submitting
                ? "Processing..."
                : `Book & Pay Now (${selectedSeats.length} ${
                    isSleeper ? "berth" : "seat"
                  }${selectedSeats.length !== 1 ? "s" : ""})`}
            </button>

            {/* Back Button */}
            <button
              className="btn btn-outline-secondary w-100 mt-2"
              onClick={() => navigate("/book-bus")}
            >
              ← Change Route
            </button>

            <p
              className="text-muted text-center mt-2 mb-0"
              style={{ fontSize: "0.78rem" }}
            >
              Razorpay will open after you click "Book & Pay Now"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;
