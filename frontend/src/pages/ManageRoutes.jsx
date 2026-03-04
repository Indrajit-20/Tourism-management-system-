import React, { useState, useEffect } from "react";
import axios from "axios";

const ManageRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [formData, setFormData] = useState({
    route_name: "",
    bus_id: "",
    boarding_from: "",
    destination: "",
    departure_time: "",
    arrival_time: "",
    price_per_seat: "",
  });

  useEffect(() => {
    fetchRoutes();
    fetchBuses();
  }, []);

  const fetchRoutes = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/bus-routes/");
      setRoutes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBuses = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/bus");
      setBuses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      await axios.post("http://localhost:4000/api/bus-routes/add", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Route Added!");
      fetchRoutes();
      // Reset form
      setFormData({
        route_name: "",
        bus_id: "",
        boarding_from: "",
        destination: "",
        departure_time: "",
        arrival_time: "",
        price_per_seat: "",
      });
    } catch (err) {
      alert("Failed to add route");
    }
  };

  return (
    <div className="container mt-4">
      <h2>Manage Routes</h2>

      {/* Add Route Form */}
      <div className="card p-3 mb-4">
        <h4>Add New Route</h4>
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label>Route Name (e.g. Morning Express)</label>
              <input
                type="text"
                name="route_name"
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label>Select Bus</label>
              <select
                name="bus_id"
                className="form-select"
                onChange={handleChange}
                required
              >
                <option value="">Select a Bus...</option>
                {buses.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.bus_number} - {b.bus_type}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label>From</label>
              <input
                type="text"
                name="boarding_from"
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label>To</label>
              <input
                type="text"
                name="destination"
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-4">
              <label>Departure Time</label>
              <input
                type="time"
                name="departure_time"
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-4">
              <label>Arrival Time</label>
              <input
                type="time"
                name="arrival_time"
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-4">
              <label>Price (₹)</label>
              <input
                type="number"
                name="price_per_seat"
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <button className="btn btn-primary mt-3">Add Route</button>
        </form>
      </div>

      {/* List Routes */}
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Route</th>
            <th>Bus</th>
            <th>From - To</th>
            <th>Time</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {routes.map((r) => (
            <tr key={r._id}>
              <td>{r.route_name}</td>
              <td>{r.bus_id?.bus_number}</td>
              <td>
                {r.boarding_from} → {r.destination}
              </td>
              <td>
                {r.departure_time} - {r.arrival_time}
              </td>
              <td>₹{r.price_per_seat}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageRoutes;
