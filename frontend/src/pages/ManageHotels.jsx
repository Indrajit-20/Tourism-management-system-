import React, { useEffect, useState } from "react";
import axios from "axios";

const apiBase = "http://localhost:4000";

const initialHotelForm = {
  name: "",
  state_id: "",
  city_id: "",
  location: "",
  hotel_type: "",
  description: "",
  status: "Active",
};

const ManageHotels = () => {
  const [hotelForm, setHotelForm] = useState(initialHotelForm);
  const [hotels, setHotels] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const token = localStorage.getItem("token");

  const fetchData = async () => {
    try {
      const [hotelRes, stateRes, cityRes] = await Promise.all([
        axios.get(`${apiBase}/api/hotels`),
        axios.get(`${apiBase}/api/states`),
        axios.get(`${apiBase}/api/cities`),
      ]);

      setHotels(hotelRes.data || []);
      setStates(stateRes.data || []);
      setCities(cityRes.data || []);
    } catch (error) {
      console.error("Error loading hotels data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleHotelFormChange = (e) => {
    const { name, value } = e.target;
    setHotelForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddHotel = async (e) => {
    e.preventDefault();

    try {
      if (!token) {
        alert("Admin token missing. Login again.");
        return;
      }

      await axios.post(`${apiBase}/api/hotels`, hotelForm, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setHotelForm(initialHotelForm);
      fetchData();
      alert("Hotel added successfully");
    } catch (error) {
      console.error("Add hotel failed", error);
      alert(error?.response?.data?.message || "Failed to add hotel");
    }
  };

  const handleDeleteHotel = async (hotelId) => {
    if (!window.confirm("Delete this hotel?")) return;

    try {
      if (!token) {
        alert("Admin token missing. Login again.");
        return;
      }

      await axios.delete(`${apiBase}/api/hotels/${hotelId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchData();
    } catch (error) {
      console.error("Delete hotel failed", error);
      alert(error?.response?.data?.message || "Failed to delete hotel");
    }
  };

  return (
    <div className="container-fluid p-0">
      <div className="card shadow-sm p-4 mb-4">
        <h4 className="mb-3">Add Hotel</h4>

        <form onSubmit={handleAddHotel}>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Hotel Name</label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={hotelForm.name}
                onChange={handleHotelFormChange}
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Hotel Type</label>
              <input
                type="text"
                name="hotel_type"
                className="form-control"
                value={hotelForm.hotel_type}
                onChange={handleHotelFormChange}
                placeholder="3-Star / Resort / Luxury"
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Status</label>
              <select
                name="status"
                className="form-select"
                value={hotelForm.status}
                onChange={handleHotelFormChange}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">State</label>
              <select
                name="state_id"
                className="form-select"
                value={hotelForm.state_id}
                onChange={handleHotelFormChange}
                required
              >
                <option value="">Select State</option>
                {states.map((state) => (
                  <option key={state._id} value={state._id}>
                    {state.state_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">City</label>
              <select
                name="city_id"
                className="form-select"
                value={hotelForm.city_id}
                onChange={handleHotelFormChange}
                required
              >
                <option value="">Select City</option>
                {cities.map((city) => (
                  <option key={city._id} value={city._id}>
                    {city.city_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">Location</label>
              <input
                type="text"
                name="location"
                className="form-control"
                value={hotelForm.location}
                onChange={handleHotelFormChange}
                required
              />
            </div>

            <div className="col-md-12">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                className="form-control"
                value={hotelForm.description}
                onChange={handleHotelFormChange}
                rows={3}
              />
            </div>

            <div className="col-12">
              <button type="submit" className="btn btn-success">
                Save Hotel
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="card shadow-sm p-4">
        <h4 className="mb-3">All Hotels</h4>

        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>State</th>
                <th>City</th>
                <th>Location</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {hotels.map((hotel) => (
                <tr key={hotel._id}>
                  <td>{hotel.name}</td>
                  <td>{hotel.hotel_type || "-"}</td>
                  <td>{hotel.state_id?.state_name || "-"}</td>
                  <td>{hotel.city_id?.city_name || "-"}</td>
                  <td>{hotel.location}</td>
                  <td>{hotel.status || "Active"}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteHotel(hotel._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {!hotels.length && (
                <tr>
                  <td colSpan="7" className="text-center text-muted">
                    No hotels found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageHotels;
