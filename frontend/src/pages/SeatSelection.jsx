// Frontend Component for Bus Seat Selection
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import CancelBookingModal from "../components/CancelBookingModal";

// Simple SVG or CSS Grid Layout for Bus
// 30 Seeds: Two Columns - Aisle - Two Columns
// Rows 1-7
const BusLayout = ({ bookedSeats, selectedSeats, onSeatClick }) => {
  const rows = 7;
  const colsLeft = ["A", "B"];
  const colsRight = ["C", "D"];

  const renderSeat = (seatNum) => {
    const isBooked = bookedSeats.includes(seatNum);
    const isSelected = selectedSeats.includes(seatNum);

    let colorClass = "btn-outline-primary"; // Default Available
    if (isBooked) colorClass = "btn-secondary disabled"; // Taken
    if (isSelected) colorClass = "btn-success"; // Selected

    return (
      <button
        key={seatNum}
        className={`btn btn-sm m-1 ${colorClass}`}
        style={{ width: "40px", height: "40px" }}
        onClick={() => !isBooked && onSeatClick(seatNum)}
        disabled={isBooked}
      >
        {seatNum}
      </button>
    );
  };

  return (
    <div
      className="d-flex justify-content-center bg-light p-3 rounded"
      style={{ maxWidth: "300px", margin: "0 auto" }}
    >
      {/* Left Side */}
      <div className="me-4">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="d-flex">
            {colsLeft.map((c) => renderSeat(`${r + 1}${c}`))}
          </div>
        ))}
      </div>

      {/* Aisle (Spacer) */}
      <div style={{ width: "20px" }}></div>

      {/* Right Side */}
      <div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="d-flex">
            {colsRight.map((c) => renderSeat(`${r + 1}${c}`))}
          </div>
        ))}
      </div>
    </div>
  );
};

const SeatSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // We expect Route ID and Travel Date to be passed via state from previous page
  const { route, date } = location.state || {}; // e.g. { route: {...}, date: "2024-05-01" }

  const [bookedSeats, setBookedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookingId, setBookingId] = useState(null);
  const [bookingAmount, setBookingAmount] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Feedback state
  const [feedback, setFeedback] = useState({
    rating: 5,
    review_text: "",
  });

  useEffect(() => {
    if (!route || !date) {
      alert("Please select a route first");
      navigate("/book-bus");
      return;
    }
    fetchBookedSeats();
  }, [route, date]);

  const fetchBookedSeats = async () => {
    try {
      const res = await axios.get(
        `http://localhost:4000/api/bus-bookings/seats?route_id=${route._id}&travel_date=${date}`
      );
      setBookedSeats(res.data); // ["1A", "2B"]
    } catch (err) {
      console.error("Error fetching seats", err);
    }
  };

  // Handle feedback input
  const handleFeedbackChange = (e) => {
    const { name, value } = e.target;
    setFeedback({ ...feedback, [name]: value });
  };

  // Submit Feedback
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:4000/api/feedback/submit",
        {
          rating: parseInt(feedback.rating),
          review_text: feedback.review_text,
          bus_booking_id: bookingId,
          route_id: route._id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Thank you for your feedback!");
      setShowFeedbackModal(false);
      setFeedback({ rating: 5, review_text: "" });
      navigate("/");
    } catch (err) {
      alert("Error submitting feedback");
      console.error(err);
    }
  };

  const handleConfirmBooking = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Login required");
      navigate("/login");
      return;
    }

    try {
      const bookRes = await axios.post(
        "http://localhost:4000/api/bus-bookings/book",
        {
          route_id: route._id,
          travel_date: date,
          seat_numbers: selectedSeats, // Send Array!
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Save booking ID for feedback
      setBookingId(bookRes.data.booking._id);

      const totalAmountToPay = selectedSeats.length * route.price_per_seat;
      setBookingAmount(totalAmountToPay);
      const resOrder = await axios.post(
        "http://localhost:4000/api/payment/create-order",
        { amount: totalAmountToPay }
      );

      const options = {
        key: "rzp_test_SMPUHkAalgy2kE",
        amount: resOrder.data.amount,
        currency: "INR",
        name: "Bus Booking",
        order_id: resOrder.data.id,
        handler: function () {
          alert("Payment Successful!");
          // Show feedback modal after payment
          setShowFeedbackModal(true);
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert(err.response?.data?.message || "Booking Failed");
    }
  };

  const handleSeatClick = (seatNum) => {
    // This function WAS missing in the body
    if (selectedSeats.includes(seatNum)) {
      // Deselect
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNum));
    } else {
      // Select (Max 5)
      if (selectedSeats.length >= 5) return alert("Max 5 seats");
      setSelectedSeats([...selectedSeats, seatNum]);
    }
  };

  if (!route) return null;

  return (
    <div className="container mt-4 text-center">
      <h3>Select Seats</h3>
      <p className="text-muted">
        {route.boarding_from} &rarr; {route.destination} on {date}
      </p>

      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="mb-3">
            <span className="badge bg-secondary me-2">Booked</span>
            <span className="badge bg-success me-2">Selected</span>
            <span className="badge btn-outline-primary text-dark border">
              Available
            </span>
          </div>

          <BusLayout
            bookedSeats={bookedSeats}
            selectedSeats={selectedSeats}
            onSeatClick={handleSeatClick}
          />
        </div>

        <div className="col-md-4 text-start">
          <div className="card p-3">
            <h5>Booking Summary</h5>
            <p>
              <strong>Seats:</strong> {selectedSeats.join(", ") || "None"}
            </p>
            <p>
              <strong>Price Per Seat:</strong> ₹{route.price_per_seat}
            </p>
            <h4 className="text-success">
              Total: ₹{selectedSeats.length * route.price_per_seat}
            </h4>

            <button
              className="btn btn-primary w-100 mt-3"
              disabled={selectedSeats.length === 0}
              onClick={handleConfirmBooking}
            >
              Confirm Booking
            </button>

            {bookingId && (
              <button
                className="btn btn-danger w-100 mt-2"
                onClick={() => setShowCancelModal(true)}
              >
                Cancel This Booking
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- FEEDBACK MODAL --- */}
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
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Share Your Feedback</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowFeedbackModal(false);
                    navigate("/");
                  }}
                />
              </div>
              <div className="modal-body">
                <form onSubmit={handleFeedbackSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Rating</label>
                    <select
                      name="rating"
                      className="form-select"
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

                  <div className="mb-3">
                    <label className="form-label">Your Review</label>
                    <textarea
                      name="review_text"
                      className="form-control"
                      placeholder="Share your experience..."
                      rows="4"
                      value={feedback.review_text}
                      onChange={handleFeedbackChange}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-100">
                    Submit Feedback
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- CANCEL BOOKING MODAL --- */}
      <CancelBookingModal
        show={showCancelModal}
        bookingId={bookingId}
        bookingType="Bus"
        amount={bookingAmount}
        onClose={() => setShowCancelModal(false)}
        onSuccess={() => {
          alert("Booking cancelled successfully!");
          navigate("/book-bus");
        }}
      />
    </div>
  );
};

export default SeatSelection;
