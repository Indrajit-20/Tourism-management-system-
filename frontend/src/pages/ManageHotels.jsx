import React, { useEffect, useState } from "react";
import axios from "axios";
import "../css/manageHotels.css";

const apiBase = import.meta.env.VITE_API_URL.replace("/api", "");

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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editingHotelId, setEditingHotelId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filterState, setFilterState] = useState("all");
  const [filterCity, setFilterCity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const token = sessionStorage.getItem("token");

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadError("");
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
      setLoadError("Unable to load hotel data. Please refresh once.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setEditingHotelId(null);
    setHotelForm(initialHotelForm);
  };

  const handleHotelFormChange = (e) => {
    const { name, value } = e.target;

    if (name === "state_id") {
      setHotelForm((prev) => ({ ...prev, state_id: value, city_id: "" }));
      return;
    }

    setHotelForm((prev) => ({ ...prev, [name]: value }));
  };

  const filteredCities = cities.filter((city) => {
    if (!hotelForm.state_id) return true;
    return (
      String(city.state_id?._id || city.state_id) === String(hotelForm.state_id)
    );
  });

  const filterCities = cities.filter((city) => {
    if (filterState === "all") return true;
    return String(city.state_id?._id || city.state_id) === String(filterState);
  });

  const filteredHotels = hotels.filter((hotel) => {
    const stateId = String(hotel.state_id?._id || hotel.state_id || "");
    const cityId = String(hotel.city_id?._id || hotel.city_id || "");
    const stateName = String(hotel.state_id?.state_name || "");
    const cityName = String(hotel.city_id?.city_name || "");
    const status = String(hotel.status || "");

    const searchMatch =
      !searchText.trim() ||
      String(hotel.name || "")
        .toLowerCase()
        .includes(searchText.toLowerCase()) ||
      String(hotel.hotel_type || "")
        .toLowerCase()
        .includes(searchText.toLowerCase()) ||
      String(hotel.location || "")
        .toLowerCase()
        .includes(searchText.toLowerCase()) ||
      stateName.toLowerCase().includes(searchText.toLowerCase()) ||
      cityName.toLowerCase().includes(searchText.toLowerCase());

    const stateMatch = filterState === "all" || stateId === String(filterState);
    const cityMatch = filterCity === "all" || cityId === String(filterCity);
    const statusMatch = filterStatus === "all" || status === filterStatus;

    return searchMatch && stateMatch && cityMatch && statusMatch;
  });

  const totalHotels = hotels.length;
  const totalActiveHotels = hotels.filter(
    (hotel) => hotel.status === "Active"
  ).length;
  const totalInactiveHotels = hotels.filter(
    (hotel) => hotel.status === "Inactive"
  ).length;

  const handleAddHotel = async (e) => {
    e.preventDefault();

    try {
      if (!token) {
        alert("Admin token missing. Login again.");
        return;
      }

      if (editingHotelId) {
        await axios.put(`${apiBase}/api/hotels/${editingHotelId}`, hotelForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Hotel updated successfully");
      } else {
        await axios.post(`${apiBase}/api/hotels`, hotelForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Hotel added successfully");
      }

      resetForm();
      fetchData();
    } catch (error) {
      console.error("Add hotel failed", error);
      alert(error?.response?.data?.message || "Failed to save hotel");
    }
  };

  const handleEditHotel = (hotel) => {
    setEditingHotelId(hotel._id);
    setHotelForm({
      name: hotel.name || "",
      state_id: String(hotel.state_id?._id || hotel.state_id || ""),
      city_id: String(hotel.city_id?._id || hotel.city_id || ""),
      location: hotel.location || "",
      hotel_type: hotel.hotel_type || "",
      description: hotel.description || "",
      status: hotel.status || "Active",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    <div className="container mt-4 manage-hotel-page">
      <h2 className="manage-hotel-title">Manage Hotels</h2>
      <div className="manage-hotel-sections">
        <div className="card shadow-sm p-4 manage-hotel-card manage-hotel-form-card">
          <h4 className="mb-3 manage-hotel-section-title">
            {editingHotelId ? "Edit Hotel" : "Add Hotel"}
          </h4>

          <form onSubmit={handleAddHotel}>
            <div className="row g-3">
              <div className="col-md-4 manage-hotel-field">
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

              <div className="col-md-4 manage-hotel-field">
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

              <div className="col-md-4 manage-hotel-field">
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
            </div>

            <div className="row g-3 mt-0 manage-hotel-lower-row">
              <div className="col-md-4 manage-hotel-field">
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

              <div className="col-md-4 manage-hotel-field">
                <label className="form-label">City</label>
                <select
                  name="city_id"
                  className="form-select"
                  value={hotelForm.city_id}
                  onChange={handleHotelFormChange}
                  required
                >
                  <option value="">Select City</option>
                  {filteredCities.map((city) => (
                    <option key={city._id} value={city._id}>
                      {city.city_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4 manage-hotel-field">
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
            </div>

            <div className="row g-3 mt-0">
              <div className="col-md-12 manage-hotel-field">
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
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-success">
                    {editingHotelId ? "Update Hotel" : "Save Hotel"}
                  </button>
                  {editingHotelId ? (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={resetForm}
                    >
                      Cancel Edit
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="card shadow-sm p-4 manage-hotel-card manage-hotel-filter-card">
          <div className="manage-hotel-counts mb-3">
            <div className="manage-hotel-count-item">
              <span>Total Hotels</span>
              <strong>{totalHotels}</strong>
            </div>
            <div className="manage-hotel-count-item">
              <span>Active Hotels</span>
              <strong>{totalActiveHotels}</strong>
            </div>
            <div className="manage-hotel-count-item">
              <span>Inactive Hotels</span>
              <strong>{totalInactiveHotels}</strong>
            </div>
          </div>

          <div className="row g-3 align-items-start">
            <div className="col-md-4 manage-hotel-field">
              <label className="form-label">Search Hotel</label>
              <input
                className="form-control"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search by hotel, type, state, city"
              />
            </div>

            <div className="col-md-3 manage-hotel-field">
              <label className="form-label">Filter State</label>
              <select
                className="form-select"
                value={filterState}
                onChange={(e) => {
                  setFilterState(e.target.value);
                  setFilterCity("all");
                }}
              >
                <option value="all">All</option>
                {states.map((state) => (
                  <option key={state._id} value={state._id}>
                    {state.state_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3 manage-hotel-field">
              <label className="form-label">Filter City</label>
              <select
                className="form-select"
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
              >
                <option value="all">All</option>
                {filterCities.map((city) => (
                  <option key={city._id} value={city._id}>
                    {city.city_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2 manage-hotel-field">
              <label className="form-label">Filter Status</label>
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <small className="text-muted d-block mt-2">
            Showing {filteredHotels.length} of {totalHotels} hotels
          </small>
        </div>

        <div className="card shadow-sm p-4 manage-hotel-card manage-hotel-list-card">
          <h4 className="mb-3 manage-hotel-section-title">All Hotels</h4>

          {loadError ? (
            <div className="alert alert-warning py-2">{loadError}</div>
          ) : null}

          <div className="manage-hotel-table-wrap">
            <table className="table table-bordered table-striped table-sm align-middle manage-hotel-table">
              <thead className="table-dark">
                <tr>
                  <th>Sr No</th>
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
                {filteredHotels.map((hotel, index) => (
                  <tr key={hotel._id}>
                    <td>{index + 1}</td>
                    <td>{hotel.name}</td>
                    <td>{hotel.hotel_type || "-"}</td>
                    <td>{hotel.state_id?.state_name || "-"}</td>
                    <td>{hotel.city_id?.city_name || "-"}</td>
                    <td>{hotel.location}</td>
                    <td>{hotel.status || "Active"}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-warning"
                          onClick={() => handleEditHotel(hotel)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteHotel(hotel._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && !filteredHotels.length && (
                  <tr>
                    <td colSpan="8" className="text-center text-muted">
                      No hotels found
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td colSpan="8" className="text-center text-muted">
                      Loading hotels...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageHotels;
