import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import ReviewsDisplay from "../components/ReviewsDisplay";
import CancelBookingModal from "../components/CancelBookingModal";

const BookPackage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [packageData, setPackageData] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [bookingAmount, setBookingAmount] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Start with 1 person
  const [passengers, setPassengers] = useState([
    { name: "", age: "", gender: "Male" },
  ]);

  // Feedback form
  const [feedback, setFeedback] = useState({
    rating: 5,
    review_text: "",
  });

  // 1. Fetch Package Data
  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/api/packages/${id}`);
        setPackageData(res.data);
      } catch (err) {
        console.error("Error fetching package details");
      }
    };
    fetchPackage();
  }, [id]);

  const addPassenger = () => {
    setPassengers([...passengers, { name: "", age: "", gender: "Male" }]);
  };

  // Update what the user types in the boxes
  const handlePassengerChange = (index, field, value) => {
    const updated = [...passengers];
    updated[index][field] = value;
    setPassengers(updated);
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
          package_booking_id: bookingId,
          package_id: id,
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

  // Submit to Backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!token) return alert("Please login first!");

    try {
      const bookingRes = await axios.post(
        "http://localhost:4000/api/bookings/book",
        {
          package_id: id,
          travellers: passengers.length, // The backend just counts how many people are in the list!
          passengers: passengers,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Save booking ID for feedback
      setBookingId(bookingRes.data.booking._id);

      // --- BASIC RAZORPAY INTEGRATION ---
      const totalAmountToPay = packageData.price * passengers.length;
      setBookingAmount(totalAmountToPay);
      const resOrder = await axios.post(
        "http://localhost:4000/api/payment/create-order",
        { amount: totalAmountToPay }
      );

      const options = {
        key: "rzp_test_SMPUHkAalgy2kE",
        amount: resOrder.data.amount,
        currency: "INR",
        name: "Package Booking",
        order_id: resOrder.data.id,
        handler: function () {
          alert("Payment Successful!");
          // Show feedback modal after payment
          setShowFeedbackModal(true);
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      // ------------------------------------
    } catch (err) {
      alert("Booking Failed.");
      console.error(err);
    }
  };

  if (!packageData) return <h3>Loading...</h3>;

  return (
    <div className="container mt-5">
      <h2>Book: {packageData.package_name}</h2>
      <p>Price: ₹{packageData.price} per person</p>

      <div className="card p-4 shadow-sm mt-3">
        <form onSubmit={handleSubmit}>
          {/* Loop through the list to show the boxes */}
          {passengers.map((person, index) => (
            <div key={index} className="border p-3 mb-3 bg-light rounded">
              <h5>Passenger {index + 1}</h5>

              <input
                type="text"
                className="form-control mb-2"
                placeholder="Full Name"
                value={person.name}
                onChange={(e) =>
                  handlePassengerChange(index, "name", e.target.value)
                }
                required
              />

              <input
                type="number"
                className="form-control mb-2"
                placeholder="Age"
                value={person.age}
                onChange={(e) =>
                  handlePassengerChange(index, "age", e.target.value)
                }
                required
              />

              <select
                className="form-select mb-2"
                value={person.gender}
                onChange={(e) =>
                  handlePassengerChange(index, "gender", e.target.value)
                }
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          ))}

          {/* THE NEW EASY BUTTON */}
          <button
            type="button"
            className="btn btn-secondary mb-3"
            onClick={addPassenger}
          >
            + Add Another Person
          </button>

          <button type="submit" className="btn btn-primary w-100 py-2">
            Confirm & Book ({passengers.length} Travelers)
          </button>

          {bookingId && (
            <button
              type="button"
              className="btn btn-danger w-100 py-2 mt-2"
              onClick={() => setShowCancelModal(true)}
            >
              Cancel This Booking
            </button>
          )}
        </form>
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
        bookingType="Package"
        amount={bookingAmount}
        onClose={() => setShowCancelModal(false)}
        onSuccess={() => {
          alert("Booking cancelled successfully!");
          navigate("/");
        }}
      />

      {/* Reviews Section */}
      <ReviewsDisplay packageId={id} type="package" />
    </div>
  );
};

export default BookPackage;
