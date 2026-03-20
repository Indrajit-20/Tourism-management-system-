import React, { useState, useEffect } from "react";
import axios from "axios";

const ManageBus = () => {
  // 1. State for Bus list and Form
  const [buses, setBuses] = useState([]);
  const [staffList, setStaffList] = useState([]); // List of available drivers

  const [form, setForm] = useState({
    bus_number: "",
    bus_name: "",
    bus_type: "AC",
    total_seats: 30,
    driver_ids: [""],
    status: "Active",
  });

  // 2. Fetch Buses on Load
  useEffect(() => {
    fetchBuses();
    fetchStaff(); // Load staff for dropdown
  }, []);

  const fetchBuses = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/bus");
      setBuses(res.data);
    } catch (error) {
      console.error("Error fetching buses", error);
    }
  };

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get("http://localhost:4000/api/staff", {
        headers,
      });
      setStaffList(res.data);
    } catch (error) {
      console.error("Error fetching staff", error);
    }
  };

  // 3. Handle Form Changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addDriverInput = () => {
    if (form.driver_ids.length >= 2) {
      alert("Maximum 2 drivers allowed.");
      return;
    }
    setForm((prev) => ({ ...prev, driver_ids: [...prev.driver_ids, ""] }));
  };

  const removeDriverInput = (index) => {
    setForm((prev) => {
      if (prev.driver_ids.length === 1) return prev;
      return {
        ...prev,
        driver_ids: prev.driver_ids.filter((_, i) => i !== index),
      };
    });
  };

  const updateDriverInput = (index, value) => {
    setForm((prev) => ({
      ...prev,
      driver_ids: prev.driver_ids.map((driverId, i) =>
        i === index ? value : driverId,
      ),
    }));
  };

  // 4. Submit New Bus
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const cleanDriverIds = form.driver_ids
        .map((driverId) => driverId.trim())
        .filter(Boolean);

      if (!cleanDriverIds.length) {
        alert("Please select at least 1 driver.");
        return;
      }
      if (cleanDriverIds.length > 2) {
        alert("Maximum 2 drivers allowed.");
        return;
      }

      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(
        "http://localhost:4000/api/bus/add",
        {
          ...form,
          driver_ids: cleanDriverIds,
        },
        { headers },
      );
      alert("Bus added successfully!");
      setForm({
        bus_number: "",
        bus_name: "",
        bus_type: "AC",
        total_seats: 30,
        driver_ids: [""],
        status: "Active",
      });
      fetchBuses(); // Refresh list
    } catch (error) {
      console.error("Error adding bus", error);
      alert("Failed to add bus");
    }
  };

  // 5. Delete Bus
  const handleDelete = async (id) => {
    if (window.confirm("Delete this bus?")) {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        await axios.delete(`http://localhost:4000/api/bus/delete/${id}`, {
          headers,
        });
        fetchBuses();
      } catch (error) {
        console.error("Error deleting bus", error);
      }
    }
  };

  return (
    <div className="container mt-4">
      <h2>Manage Buses</h2>

      {/* --- ADD BUS FORM --- */}
      <div className="card p-3 mb-4 shadow-sm">
        <h4>Add New Bus</h4>
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-3 mb-2">
              <input
                type="text"
                name="bus_number"
                className="form-control"
                placeholder="Bus Number"
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-3 mb-2">
              <input
                type="text"
                name="bus_name"
                className="form-control"
                placeholder="Bus Name"
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-3 mb-2">
              <select
                name="bus_type"
                className="form-control"
                onChange={handleChange}
              >
                <option value="AC">AC</option>
                <option value="Non-AC">Non-AC</option>
                <option value="Sleeper">Sleeper</option>
              </select>
            </div>
            <div className="col-md-3 mb-2">
              <input
                type="number"
                name="total_seats"
                className="form-control"
                placeholder="Seats"
                onChange={handleChange}
                required
              />
            </div>
            {/* Staff Dropdowns (Multiple Drivers) */}
            <div className="col-md-6 mb-2">
              <label className="form-label">Drivers (min 1, max 2)</label>
              {form.driver_ids.map((driverId, index) => (
                <div className="d-flex gap-2 mb-2" key={`driver-${index}`}>
                  <select
                    className="form-control"
                    value={driverId}
                    onChange={(e) => updateDriverInput(index, e.target.value)}
                    required
                  >
                    <option value="">Select Driver</option>
                    {staffList
                      .filter((staff) =>
                        (staff.designation || "")
                          .toLowerCase()
                          .includes("driver"),
                      )
                      .map((driver) => (
                        <option key={driver._id} value={driver._id}>
                          {driver.name} ({driver.designation})
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={addDriverInput}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => removeDriverInput(index)}
                  >
                    -
                  </button>
                </div>
              ))}
            </div>
            <div className="col-md-6 mb-2">
              <select
                name="status"
                className="form-control"
                onChange={handleChange}
              >
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary mt-2">Add Bus</button>
        </form>
      </div>

      {/* --- BUS LIST TABLE --- */}
      <table className="table table-bordered table-striped">
        <thead className="table-dark">
          <tr>
            <th>Number</th>
            <th>Name</th>
            <th>Type</th>
            <th>Seats</th>
            <th>Drivers</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {buses.map((bus) => (
            <tr key={bus._id}>
              <td>{bus.bus_number}</td>
              <td>{bus.bus_name}</td>
              <td>{bus.bus_type}</td>
              <td>{bus.total_seats}</td>
              <td>
                {Array.isArray(bus.driver_ids) && bus.driver_ids.length
                  ? bus.driver_ids
                      .map((driver) =>
                        typeof driver === "object"
                          ? driver.name || "Unknown"
                          : "Assigned",
                      )
                      .join(", ")
                  : bus.driver_id?.name || "-"}
              </td>
              <td>{bus.status}</td>
              <td>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(bus._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageBus;
