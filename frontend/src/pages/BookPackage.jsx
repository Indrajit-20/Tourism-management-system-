import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import ReviewsDisplay from "../components/ReviewsDisplay";

const BookPackage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [packageData, setPackageData] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [bookingAmount, setBookingAmount] = useState(null);

  // Start with 1 person
  const [passengers, setPassengers] = useState([
    { name: "", age: "", gender: "Male", type: "Adult" },
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
    setPassengers([
      ...passengers,
      { name: "", age: "", gender: "Male", type: "Adult" },
    ]);
  };

  // Update what the user types in the boxes
  const handlePassengerChange = (index, field, value) => {
    const updated = [...passengers];
    updated[index][field] = value;
    setPassengers(updated);
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
      // Calculate total amount in a simple way
      let totalAmountToPay = 0;
      for (let i = 0; i < passengers.length; i++) {
        if (passengers[i].type === "Child") {
          // Child gets 50% discount (divide by 2)
          totalAmountToPay = totalAmountToPay + packageData.price / 2;
        } else {
          // Adult pays full price
          totalAmountToPay = totalAmountToPay + packageData.price;
        }
      }

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
          alert("Payment Successful! Your booking is confirmed.");
          // Instead of immediate feedback, redirect to bookings where they can review later
          navigate("/my-bookings");
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

  const currentTotal = 0; // Simple calc logic removed as we use loop below
  let totalToDisplay = 0;
  for (let i = 0; i < passengers.length; i++) {
    if (passengers[i].type === "Child") {
      totalToDisplay = totalToDisplay + packageData.price / 2;
    } else {
      totalToDisplay = totalToDisplay + packageData.price;
    }
  }

  return (
    <div className="container mt-5">
      <div className="d-flex align-items-center mb-3">
        <button
          className="btn btn-outline-secondary me-3"
          onClick={() => navigate("/")}
        >
          &larr; Back
        </button>
        <h2 className="mb-0">Book: {packageData.package_name}</h2>
      </div>
      <p>
        Price: ₹{packageData.price} per Adult | ₹{packageData.price / 2} per
        Child (50% Off)
      </p>

      <div className="card p-4 shadow-sm mt-3">
        <form onSubmit={handleSubmit}>
          {/* Loop through the list to show the boxes */}
          {passengers.map((person, index) => (
            <div key={index} className="border p-3 mb-3 bg-light rounded">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5>Passenger {index + 1}</h5>
                {passengers.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => {
                      const updated = [...passengers];
                      updated.splice(index, 1);
                      setPassengers(updated);
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="row">
                <div className="col-md-6 mb-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Full Name"
                    value={person.name}
                    onChange={(e) =>
                      handlePassengerChange(index, "name", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="col-md-6 mb-2">
                  <select
                    className="form-select"
                    value={person.type}
                    onChange={(e) =>
                      handlePassengerChange(index, "type", e.target.value)
                    }
                  >
                    <option value="Adult">Adult (Full Price)</option>
                    <option value="Child">Child (50% Off)</option>
                  </select>
                </div>
              </div>

              <div className="row mt-2">
                <div className="col-md-6 mb-2">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Age"
                    value={person.age}
                    onChange={(e) =>
                      handlePassengerChange(index, "age", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="col-md-6 mb-2">
                  <select
                    className="form-select"
                    value={person.gender}
                    onChange={(e) =>
                      handlePassengerChange(index, "gender", e.target.value)
                    }
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
            </div>
          ))}

          {/* THE NEW EASY BUTTON */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={addPassenger}
            >
              + Add Another Person
            </button>
            <h4 className="text-success mb-0">Total: ₹{totalToDisplay}</h4>
          </div>

          <button type="submit" className="btn btn-primary w-100 py-3 fs-5">
            Proceed to Payment (₹{totalToDisplay})
          </button>
        </form>
      </div>

      {/* Reviews Section */}
      <ReviewsDisplay packageId={id} type="package" />
    </div>
  );
};

export default BookPackage;
