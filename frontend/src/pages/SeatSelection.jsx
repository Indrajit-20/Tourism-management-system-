import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import BusLayout from "../components/BusLayout";

const API = "http://localhost:4000";

const SeatSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Data passed from BookBus page
  const { route, date, trip: passedTrip } = location.state || {};

  const [trip, setTrip] = useState(passedTrip || null);
  const [bookedSeats, setBookedSeats] = useState([]); // booked by others
  const [selectedSeats, setSelectedSeats] = useState([]); // picked by this user
  const [loading, setLoading] = useState(!passedTrip);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Run when page opens
  useEffect(() => {
    // No route data — go back
    if (!route || !date) {
      alert("Please select a route first");
      navigate("/book-bus");
      return;
    }

    // Trip already passed from BookBus — use directly (faster)
    if (passedTrip) {
      fetchBookedSeats(passedTrip._id);
      setLoading(false);
      return;
    }

    // No trip passed — fetch from backend
    fetchTripForRoute();
  }, [route, date]);

  // Fetch trip for this route + date
  const fetchTripForRoute = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${API}/api/bus-trips?route_id=${route._id}&date=${date}`
      );
      const foundTrip = (res.data || [])[0];

      if (!foundTrip) {
        setError("No trip available on this date. Please choose another date.");
        return;
      }

      setTrip(foundTrip);
      fetchBookedSeats(foundTrip._id);
    } catch (err) {
      console.error("Error fetching trip", err);
      setError("Unable to load trip. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch which seats are already booked for this trip
  const fetchBookedSeats = async (tripId) => {
    try {
      const res = await axios.get(
        `${API}/api/bus-bookings/seats?trip_id=${tripId}`
      );
      setBookedSeats(res.data || []);
    } catch (err) {
      console.error("Error fetching booked seats", err);
    }
  };

  // User clicks on a seat
  const handleSeatClick = (seatNumber) => {
    // Already selected — remove it (deselect)
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNumber));
      return;
    }

    // Max 5 seats per booking
    if (selectedSeats.length >= 5) {
      alert("Maximum 5 seats per booking.");
      return;
    }

    // Add to selected
    setSelectedSeats([...selectedSeats, seatNumber]);
  };

  // Calculate total — adds up each seat's individual price
  const calculateTotal = () => {
    if (!trip?.seats || selectedSeats.length === 0) return 0;

    let total = 0;
    selectedSeats.forEach((seatNumber) => {
      const seat = trip.seats.find((s) => s.seat_number === seatNumber);
      // Use seat's dynamic price, fallback to route base price
      total += seat?.price || route?.price_per_seat || 0;
    });
    return total;
  };

  // Submit booking request — NO payment here!
  // Payment happens AFTER admin approves from MyBookings page
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
      // Step 1 — Check seats are still free
      // Someone else may have booked while user was selecting
      const checkRes = await axios.get(
        `${API}/api/bus-bookings/seats?trip_id=${trip._id}`
      );
      const latestBooked = checkRes.data || [];

      // Find if any selected seat is now taken
      const conflictSeats = selectedSeats.filter((s) =>
        latestBooked.includes(s)
      );
      if (conflictSeats.length > 0) {
        alert(
          `Seat(s) ${conflictSeats.join(
            ", "
          )} were just booked. Please reselect.`
        );
        setBookedSeats(latestBooked);
        setSelectedSeats(
          selectedSeats.filter((s) => !conflictSeats.includes(s))
        );
        return;
      }

      // Step 2 — Submit booking request to backend
      // booking_status will be "Pending" — admin must approve
      await axios.post(
        `${API}/api/bus-bookings/book`,
        {
          trip_id: trip._id,
          seat_numbers: selectedSeats,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Step 3 — Tell user what happens next
      alert(
        " Booking request submitted!\n\n" +
          "Status: PENDING\n\n" +
          "Admin will review your request.\n" +
          "You will receive an email once approved.\n" +
          "After approval — pay within 30 minutes."
      );

      navigate("/my-bookings");
    } catch (err) {
      alert(err.response?.data?.message || "Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ──
  if (!route) return null;

  if (loading) {
    return (
      <div className="container mt-4 text-center">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-3">Loading trip details...</p>
      </div>
    );
  }

  // ── Error ──
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
  const isSleeper = busType === "Sleeper";
  const seatLayout = trip?.seats || [];

  return (
    <div className="container mt-4">
      {/* ── Page Header ── */}
      <div className="text-center mb-4">
        <h3 className="fw-bold">Select {isSleeper ? "Berths" : "Seats"}</h3>
        <p className="text-muted mb-2">
          {route.boarding_from} &rarr; {route.destination} &nbsp;·&nbsp; {date}
        </p>
        <span className={`badge me-2 ${isSleeper ? "bg-primary" : "bg-info"}`}>
          {isSleeper ? "🛏 Sleeper" : "🪑 " + busType} Bus
        </span>
        <span className="badge bg-secondary">
          Bus No: {route.bus_id?.bus_number}
        </span>
      </div>

      {/* ── Booking flow info ── */}
      <div className="alert alert-info mb-4">
        <strong>ℹ️ How booking works:</strong>
        <ol className="mb-0 mt-1">
          <li>
            Select your {isSleeper ? "berths" : "seats"} from the layout below
          </li>
          <li>Click Submit Booking Request</li>
          <li>Admin approves → you receive an email</li>
          <li>
            Pay within <strong>30 minutes</strong> → Ticket confirmed ✅
          </li>
        </ol>
      </div>

      {/* ✅ NEW: Seat Availability Info */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="alert alert-success mb-0">
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
        </div>
      </div>

      <div className="row justify-content-center">
        {/* ── Seat / Berth Layout ── */}
        <div className="col-md-7 mb-4">
          <BusLayout
            seatLayout={trip?.seats || []}
            bookedSeats={bookedSeats}
            selectedSeats={selectedSeats}
            onSeatClick={handleSeatClick}
            busType={busType}
          />
        </div>

        {/* ── Booking Summary ── */}
        <div className="col-md-4">
          <div
            className="card shadow-sm p-3"
            style={{ position: "sticky", top: 20 }}
          >
            <h5 className="fw-bold border-bottom pb-2 mb-3">Booking Summary</h5>

            {/* Route */}
            <div className="mb-2">
              <small className="text-muted d-block">Route</small>
              <strong>
                {route.boarding_from} → {route.destination}
              </strong>
            </div>

            {/* Date */}
            <div className="mb-2">
              <small className="text-muted d-block">Travel Date</small>
              <strong>{date}</strong>
            </div>

            {/* Bus Type */}
            <div className="mb-3 pb-2 border-bottom">
              <small className="text-muted d-block">Bus Type</small>
              <strong>{busType}</strong>
            </div>

            {/* ✅ NEW: Boarding & Drop Points */}
            {trip?.boarding_points && trip.boarding_points.length > 0 && (
              <div className="mb-3 pb-2 border-bottom">
                <small className="text-muted d-block mb-1">
                  📍 Boarding Point
                </small>
                {trip.boarding_points.map((point, index) => (
                  <span key={index} className="badge bg-info me-1 mb-1">
                    {point}
                  </span>
                ))}
              </div>
            )}

            {/* Boarding Points */}
            {trip?.boarding_points && trip.boarding_points.length > 0 && (
              <div className="mb-3 pb-2 border-bottom">
                <small className="text-muted d-block mb-1">
                  🚩 Boarding Points
                </small>
                <div className="d-flex flex-wrap gap-2">
                  {trip.boarding_points.map((point, idx) => (
                    <span key={idx} className="badge bg-success">
                      {point}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Drop Points (if available from schedule) */}
            {trip?.schedule_id?.boarding_points &&
              trip.schedule_id.boarding_points.length > 0 && (
                <div className="mb-3 pb-2 border-bottom">
                  <small className="text-muted d-block mb-1">
                    📍 Drop Points
                  </small>
                  <div>
                    <small className="text-muted">Final Destination:</small>
                    <p className="mb-0">
                      <strong>{route.destination}</strong>
                    </p>
                  </div>
                </div>
              )}

            {/* Selected seats with individual prices */}
            <div className="mb-3 pb-2 border-bottom">
              <small className="text-muted d-block mb-1">
                Selected {isSleeper ? "Berths" : "Seats"} ({bookedSeats.length}{" "}
                booked, {seatLayout.length - bookedSeats.length} remaining)
              </small>

              {selectedSeats.length === 0 ? (
                <small className="text-muted">
                  No {isSleeper ? "berths" : "seats"} selected yet
                </small>
              ) : (
                selectedSeats.map((seatNumber) => {
                  // Find seat to get its price and type
                  const seat = trip?.seats?.find(
                    (s) => s.seat_number === seatNumber
                  );
                  return (
                    <div
                      key={seatNumber}
                      className="d-flex justify-content-between align-items-center mb-1"
                    >
                      <span>
                        {isSleeper ? "🛏" : "🪑"}
                        <strong className="ms-1">{seatNumber}</strong>
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

            {/* Total Amount */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-muted">Total Amount</span>
              <h4 className="text-success fw-bold mb-0">₹{total}</h4>
            </div>

            {/* Submit Button */}
            <button
              className="btn btn-primary w-100 py-2"
              onClick={handleSubmitRequest}
              disabled={selectedSeats.length === 0 || submitting}
            >
              {submitting
                ? "Submitting..."
                : `Submit Request (${selectedSeats.length} ${
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

            {/* Note */}
            <p
              className="text-muted text-center mt-2 mb-0"
              style={{ fontSize: "0.78rem" }}
            >
              No payment now. Pay only after admin approves.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;
