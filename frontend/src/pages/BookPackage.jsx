import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const BookPackage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [packageData, setPackageData] = useState(null);

  // Start with 1 person
  const [passengers, setPassengers] = useState([
    { name: "", age: "", gender: "Male" },
  ]);

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

      // --- BASIC RAZORPAY INTEGRATION ---
      const totalAmountToPay = packageData.price * passengers.length;
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
          navigate("/");
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      // ------------------------------------
    } catch (err) {
      alert("Booking Failed.");
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
        </form>
      </div>
    </div>
  );
};

export default BookPackage;
