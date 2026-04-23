import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/manageRoutes.css";

const ManageRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [formData, setFormData] = useState({
    route_name: "",
    bus_id: "",
    boarding_from: "",
    destination: "",
  });

  useEffect(() => {
    fetchRoutes();
    fetchBuses();
  }, []);

  const fetchRoutes = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/bus-routes/`);
      setRoutes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBuses = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/bus?category=route`,
      );
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
    const token = sessionStorage.getItem("token");
    try {
      if (editingId) {
        // Update
        await axios.put(
          `${import.meta.env.VITE_API_URL}/bus-routes/${editingId}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        alert("Route Updated!");
        setEditingId(null);
      } else {
        // Create
        await axios.post(`${import.meta.env.VITE_API_URL}/bus-routes/add`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Route Added!");
      }
      fetchRoutes();
      // Reset form
      setFormData({
        route_name: "",
        bus_id: "",
        boarding_from: "",
        destination: "",
      });
    } catch (err) {
      alert("Failed to save route");
    }
  };

  const handleEdit = (route) => {
    setEditingId(route._id);
    setFormData({
      route_name: route.route_name,
      bus_id: route.bus_id?._id || "",
      boarding_from: route.boarding_from || "",
      destination: route.destination || "",
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this route?")) {
      const token = sessionStorage.getItem("token");
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/bus-routes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Route Deleted!");
        fetchRoutes();
      } catch (err) {
        alert("Failed to delete route");
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      route_name: "",
      bus_id: "",
      boarding_from: "",
      destination: "",
    });
  };

  const filteredRoutes = routes.filter((route) => {
    const search = searchText.trim().toLowerCase();
    if (!search) return true;

    const routeName = String(route.route_name || "").toLowerCase();
    const busNumber = String(route.bus_id?.bus_number || "").toLowerCase();
    const busType = String(route.bus_id?.bus_type || "").toLowerCase();
    const from = String(route.boarding_from || "").toLowerCase();
    const to = String(route.destination || "").toLowerCase();

    return (
      routeName.includes(search) ||
      busNumber.includes(search) ||
      busType.includes(search) ||
      from.includes(search) ||
      to.includes(search)
    );
  });

  return (
    <div className="container mt-4 manage-routes-page">
      <h2 className="manage-routes-title">
        {editingId ? "Edit Route" : "Manage Routes"}
      </h2>

      {/* Add/Edit Route Form */}
      <div className="card p-3 mb-4 shadow-sm manage-routes-card">
        <h4 className="mb-3">{editingId ? "Edit Route" : "Add New Route"}</h4>
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="manage-routes-label">
                Route Name (e.g. Morning Express)
              </label>
              <input
                type="text"
                name="route_name"
                className="form-control manage-routes-input"
                value={formData.route_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="manage-routes-label">Select Bus</label>
              <select
                name="bus_id"
                className="form-select manage-routes-input"
                value={formData.bus_id}
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
              <label className="manage-routes-label">From (City)</label>
              <input
                type="text"
                name="boarding_from"
                className="form-control manage-routes-input"
                value={formData.boarding_from}
                onChange={handleChange}
                placeholder="e.g. Ahmedabad"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="manage-routes-label">To (City)</label>
              <input
                type="text"
                name="destination"
                className="form-control manage-routes-input"
                value={formData.destination}
                onChange={handleChange}
                placeholder="e.g. Surat"
                required
              />
            </div>
          </div>
          <div className="mt-3">
            <button
              type="submit"
              className="btn btn-primary manage-routes-submit-btn"
            >
              {editingId ? "Update Route" : "Add Route"}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn btn-secondary ms-2 manage-routes-cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List Routes */}
      <div className="card p-3 mb-3 shadow-sm manage-routes-card">
        <div className="row g-3 align-items-end">
          <div className="col-md-8">
            <label className="form-label manage-routes-label">Search</label>
            <input
              type="text"
              className="form-control manage-routes-input"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by route, bus number, bus type, from, or to"
            />
          </div>
          <div className="col-md-4">
            <div className="manage-routes-total-card">
              <span>Total Bus Routes</span>
              <strong>{routes.length}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="table-responsive manage-routes-table-wrap">
        <table className="table table-bordered table-striped table-sm align-middle manage-routes-table">
          <thead className="table-dark manage-routes-table-head">
            <tr>
              <th>Sr No</th>
              <th>Route</th>
              <th>Bus Number</th>
              <th>Bus Type</th>
              <th>Bus Name</th>
              <th>From - To (City)</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoutes.map((r, index) => (
              <tr key={r._id}>
                <td>{index + 1}</td>
                <td>{r.route_name}</td>
                <td>{r.bus_id?.bus_number || "-"}</td>
                <td>{r.bus_id?.bus_type || "-"}</td>
                <td>{r.bus_id?.bus_name || "-"}</td>
                <td>
                  {r.boarding_from} → {r.destination}
                </td>
                <td className="text-center">
                  <div className="d-flex justify-content-center gap-2">
                    <button
                      className="btn btn-primary btn-sm manage-routes-edit-btn"
                      onClick={() => handleEdit(r)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm manage-routes-delete-btn"
                      onClick={() => handleDelete(r._id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageRoutes;
