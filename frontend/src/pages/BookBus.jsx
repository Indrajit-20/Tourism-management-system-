import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BookBus = () => {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [bookingDetails, setBookingDetails] = useState({
    date: "",
    seats: 1,
  });
  const navigate = useNavigate();

  // 1. Fetch Available Routes
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/bus-routes/");
        setRoutes(res.data);
      } catch (err) {
        console.error("Error fetching routes", err);
      }
    };
    fetchRoutes();
  }, []);

  // 2. Handle Input Changes
  const handleChange = (e) => {
    setBookingDetails({ ...bookingDetails, [e.target.name]: e.target.value });
  };

  // 3. Submit Booking
  const handleBook = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to book a ticket");
      navigate("/login");
      return;
    }

    // Navigate to Seat Selection Page
    navigate("/book-seats", {
      state: {
        route: selectedRoute,
        date: bookingDetails.date,
      },
    });
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Available Bus Routes</h2>

      <div className="row">
        {routes.map((route) => (
          <div key={route._id} className="col-md-6 mb-4">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <h5 className="card-title text-primary fw-bold">
                  {route.boarding_from} <i className="bi bi-arrow-right"></i>{" "}
                  {route.destination}
                </h5>
                <p className="text-muted small mb-2">
                  Bus Type: {route.bus_id?.bus_type || "Standard"} | Bus No:{" "}
                  {route.bus_id?.bus_number}
                </p>

                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    <div className="fw-bold">
                      Departure: {route.departure_time}
                    </div>
                    <div className="text-muted small">
                      Arrival: {route.arrival_time}
                    </div>
                  </div>
                  <h4 className="text-success fw-bold">
                    ₹{route.price_per_seat}
                  </h4>
                </div>

                {/* If this route is selected, show booking form */}
                {selectedRoute?._id === route._id ? (
                  <form
                    onSubmit={handleBook}
                    className="mt-3 p-3 bg-light rounded"
                  >
                    <div className="mb-2">
                      <label className="small">Travel Date</label>
                      <input
                        type="date"
                        name="date"
                        className="form-control form-control-sm"
                        required
                        onChange={handleChange}
                      />
                    </div>

                    <div className="mb-2">
                      <label className="small">Seats</label>
                      <input
                        type="number"
                        name="seats"
                        min="1"
                        max="10"
                        className="form-control form-control-sm"
                        value={bookingDetails.seats}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold">
                        Total: ₹{bookingDetails.seats * route.price_per_seat}
                      </span>
                      <div>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary me-2"
                          onClick={() => setSelectedRoute(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-sm btn-success"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <button
                    className="btn btn-primary w-100 mt-3"
                    onClick={() => setSelectedRoute(route)}
                  >
                    Book Ticket
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {routes.length === 0 && (
          <div className="col-12 text-center text-muted">
            <p>No bus routes available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookBus;
