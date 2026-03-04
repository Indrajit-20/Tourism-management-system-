// Frontend Component for Bus Seat Selection
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

// Dynamic Bus Seat Layout based on bus type
const BusLayout = ({
  bookedSeats,
  selectedSeats,
  onSeatClick,
  busType,
  totalSeats,
}) => {
  // Fixed seats based on bus type
  const getSeatConfig = () => {
    switch (busType?.toLowerCase()) {
      case "ac":
      case "ac sleeper":
        return { rows: 7, cols: ["A", "B", "C", "D"] }; // 28 seats
      case "non-ac":
      case "ordinary":
        return { rows: 10, cols: ["A", "B", "C", "D"] }; // 40 seats
      case "luxury":
      case "volvo":
        return { rows: 8, cols: ["A", "B", "C", "D"] }; // 32 seats
      case "mini":
        return { rows: 4, cols: ["A", "B", "C", "D"] }; // 16 seats
      default:
        // If total_seats is provided, calculate rows
        if (totalSeats) {
          return {
            rows: Math.ceil(totalSeats / 4),
            cols: ["A", "B", "C", "D"],
          };
        }
        return { rows: 7, cols: ["A", "B", "C", "D"] }; // Default 28 seats
    }
  };

  const { rows, cols } = getSeatConfig();
  const colsLeft = cols.slice(0, 2); // ["A", "B"]
  const colsRight = cols.slice(2, 4); // ["C", "D"]

  const renderSeat = (seatNum) => {
    const isBooked = bookedSeats.includes(seatNum);
    const isSelected = selectedSeats.includes(seatNum);

    let colorClass = "btn-outline-success"; // Available - Green outline
    let title = "Available - Click to select";

    if (isBooked) {
      colorClass = "btn-danger"; // Booked - Red
      title = "Already Booked";
    }
    if (isSelected) {
      colorClass = "btn-success"; // Selected - Green filled
      title = "Your Selection";
    }

    return (
      <button
        key={seatNum}
        className={`btn btn-sm m-1 ${colorClass}`}
        style={{ width: "45px", height: "45px", fontWeight: "bold" }}
        onClick={() => !isBooked && onSeatClick(seatNum)}
        disabled={isBooked}
        title={title}
      >
        {seatNum}
      </button>
    );
  };

  return (
    <div className="bg-light p-4 rounded shadow-sm">
      {/* Driver Section */}
      <div className="text-center mb-3 pb-2 border-bottom">
        <span className="badge bg-dark px-3 py-2">
          <i className="bi bi-person-fill"></i> Driver
        </span>
      </div>

      {/* Seat Grid */}
      <div className="d-flex justify-content-center">
        {/* Left Side */}
        <div className="me-4">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="d-flex">
              {colsLeft.map((c) => renderSeat(`${r + 1}${c}`))}
            </div>
          ))}
        </div>

        {/* Aisle */}
        <div className="d-flex align-items-center">
          <div
            style={{
              width: "30px",
              borderLeft: "2px dashed #ccc",
              height: "100%",
            }}
          ></div>
        </div>

        {/* Right Side */}
        <div className="ms-3">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="d-flex">
              {colsRight.map((c) => renderSeat(`${r + 1}${c}`))}
            </div>
          ))}
        </div>
      </div>

      {/* Total Seats Info */}
      <div className="text-center mt-3 pt-2 border-top">
        <small className="text-muted">
          Total Seats: <strong>{rows * 4}</strong> | Booked:{" "}
          <strong className="text-danger">{bookedSeats.length}</strong> |
          Available:{" "}
          <strong className="text-success">
            {rows * 4 - bookedSeats.length}
          </strong>
        </small>
      </div>
    </div>
  );
};

const SeatSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // We expect Route ID and Travel Date to be passed via state from previous page
  const { route, date } = location.state || {};

  const [bookedSeats, setBookedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);

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

  const handleConfirmBooking = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Login required");
      navigate("/login");
      return;
    }

    try {
      // Re-fetch booked seats to check for race condition
      const checkRes = await axios.get(
        `http://localhost:4000/api/bus-bookings/seats?route_id=${route._id}&travel_date=${date}`
      );
      const latestBookedSeats = checkRes.data;

      // Check if any selected seat was just booked by someone else
      const conflictSeats = selectedSeats.filter((seat) =>
        latestBookedSeats.includes(seat)
      );

      if (conflictSeats.length > 0) {
        alert(
          `Sorry! Seat(s) ${conflictSeats.join(
            ", "
          )} were just booked by another user. Please select different seats.`
        );
        setBookedSeats(latestBookedSeats); // Update UI to show newly booked seats
        setSelectedSeats(
          selectedSeats.filter((s) => !conflictSeats.includes(s))
        ); // Remove conflicting seats from selection
        return;
      }

      const bookRes = await axios.post(
        "http://localhost:4000/api/bus-bookings/book",
        {
          route_id: route._id,
          travel_date: date,
          seat_numbers: selectedSeats,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Save booking ID
      const bookingId = bookRes.data.booking._id;

      const totalAmountToPay = selectedSeats.length * route.price_per_seat;
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
          alert("Payment Successful! Your booking is confirmed.");
          navigate("/");
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      // If backend says seats are already booked, refresh the seat display
      if (err.response?.data?.message?.includes("already booked")) {
        alert(
          "Some seats were already booked by another user. Refreshing seat availability..."
        );
        fetchBookedSeats(); // Refresh booked seats
        setSelectedSeats([]); // Clear selection
      } else {
        alert(err.response?.data?.message || "Booking Failed");
      }
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
      <p className="mb-3">
        <span className="badge bg-info me-2">
          {route.bus_id?.bus_type || "Standard"} Bus
        </span>
        <span className="badge bg-secondary">
          Bus No: {route.bus_id?.bus_number}
        </span>
      </p>

      <div className="row justify-content-center">
        <div className="col-md-6">
          {/* Legend */}
          <div className="mb-3 p-2 bg-white rounded shadow-sm">
            <span className="me-3">
              <button
                className="btn btn-danger btn-sm"
                disabled
                style={{ width: "30px", height: "30px" }}
              ></button>
              <small className="ms-1">Booked</small>
            </span>
            <span className="me-3">
              <button
                className="btn btn-success btn-sm"
                disabled
                style={{ width: "30px", height: "30px" }}
              ></button>
              <small className="ms-1">Your Selection</small>
            </span>
            <span>
              <button
                className="btn btn-outline-success btn-sm"
                disabled
                style={{ width: "30px", height: "30px" }}
              ></button>
              <small className="ms-1">Available</small>
            </span>
          </div>

          <BusLayout
            bookedSeats={bookedSeats}
            selectedSeats={selectedSeats}
            onSeatClick={handleSeatClick}
            busType={route.bus_id?.bus_type}
            totalSeats={route.bus_id?.total_seats}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;
