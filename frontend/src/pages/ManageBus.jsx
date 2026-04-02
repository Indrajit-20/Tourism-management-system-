import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/manageBus.css";

const ManageBus = () => {
  const [buses, setBuses] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [editingBusId, setEditingBusId] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterLayoutType, setFilterLayoutType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchText, setSearchText] = useState("");

  const [form, setForm] = useState({
    bus_number: "",
    bus_name: "",
    bus_category: "route",
    bus_type: "AC",
    layout_type: "seater",
    total_seats: 40,
    driver_ids: [""],
    status: "Active",
  });

  useEffect(() => {
    fetchBuses();
    fetchStaff();
  }, []);

  const fetchBuses = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/bus");
      const sorted = [...res.data].sort((a, b) =>
        String(a.bus_number || "").localeCompare(String(b.bus_number || ""))
      );
      setBuses(sorted);
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

  const resetForm = () => {
    setForm({
      bus_number: "",
      bus_name: "",
      bus_category: "route",
      bus_type: "AC",
      layout_type: "seater",
      total_seats: 40,
      driver_ids: [""],
      status: "Active",
    });
    setEditingBusId(null);
  };

  const assignedDriverIds = new Set(
    buses
      .filter((bus) => String(bus._id) !== String(editingBusId || ""))
      .flatMap((bus) => {
        if (Array.isArray(bus.driver_ids) && bus.driver_ids.length) {
          return bus.driver_ids.map((driver) =>
            typeof driver === "object" ? String(driver._id) : String(driver)
          );
        }
        return bus.driver_id
          ? [String(bus.driver_id._id || bus.driver_id)]
          : [];
      })
  );

  const isDriverUnavailable = (driverId) => {
    const normalized = String(driverId || "");
    if (!normalized) return false;
    if (form.driver_ids.includes(normalized)) return false;
    return assignedDriverIds.has(normalized);
  };

  const filteredBuses = buses.filter((bus) => {
    const categoryMatch =
      filterCategory === "all" ||
      String(bus.bus_category || "route") === filterCategory;
    const typeMatch =
      filterType === "all" || String(bus.bus_type || "") === filterType;
    const layoutTypeMatch =
      filterLayoutType === "all" ||
      String(bus.layout_type || "seater") === filterLayoutType;
    const statusMatch =
      filterStatus === "all" || String(bus.status || "") === filterStatus;
    const searchMatch =
      !searchText.trim() ||
      String(bus.bus_name || "")
        .toLowerCase()
        .includes(searchText.toLowerCase()) ||
      String(bus.bus_number || "")
        .toLowerCase()
        .includes(searchText.toLowerCase());
    return (
      categoryMatch &&
      typeMatch &&
      layoutTypeMatch &&
      statusMatch &&
      searchMatch
    );
  });

  const uniqueBusTypes = Array.from(
    new Set([
      "AC",
      "Non-AC",
      "Sleeper",
      "Double Decker",
      ...buses.map((bus) => bus.bus_type).filter(Boolean),
    ])
  );

  const totalBuses = buses.length;
  const totalRouteBuses = buses.filter(
    (bus) => String(bus.bus_category || "route") === "route"
  ).length;
  const totalTourBuses = buses.filter(
    (bus) => String(bus.bus_category || "route") === "tour"
  ).length;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));
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
        i === index ? value : driverId
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const cleanDriverIds = form.driver_ids
        .map((driverId) => driverId.trim())
        .filter(Boolean);

      if (cleanDriverIds.length < 1 || cleanDriverIds.length > 2) {
        alert("Please select at least 1 and at most 2 drivers.");
        return;
      }
      if (new Set(cleanDriverIds).size !== cleanDriverIds.length) {
        alert("Please select different drivers.");
        return;
      }

      const seats = Number(form.total_seats);
      if (!Number.isInteger(seats) || seats < 1 || seats > 150) {
        alert("Total seats must be between 1 and 150.");
        return;
      }

      const busType = String(form.bus_type || "").trim();
      if (!busType) {
        alert("Bus type is required.");
        return;
      }

      if (
        !["seater", "seater_2x2", "sleeper", "double_decker"].includes(
          form.layout_type
        )
      ) {
        alert("Please select valid layout type.");
        return;
      }

      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const payload = {
        ...form,
        bus_type: busType,
        total_seats: seats,
        driver_ids: cleanDriverIds,
      };

      if (editingBusId) {
        await axios.put(
          `http://localhost:4000/api/bus/update/${editingBusId}`,
          payload,
          {
            headers,
          }
        );
        alert("Bus updated successfully!");
      } else {
        await axios.post("http://localhost:4000/api/bus/add", payload, {
          headers,
        });
        alert("Bus added successfully!");
      }

      resetForm();
      fetchBuses();
    } catch (error) {
      console.error("Error saving bus", error);
      alert(error?.response?.data?.message || "Failed to save bus");
    }
  };

  const handleEdit = (bus) => {
    const driverIds =
      Array.isArray(bus.driver_ids) && bus.driver_ids.length
        ? bus.driver_ids.map((driver) =>
            String(typeof driver === "object" ? driver._id : driver)
          )
        : bus.driver_id
        ? [
            String(
              typeof bus.driver_id === "object"
                ? bus.driver_id._id
                : bus.driver_id
            ),
          ]
        : [""];

    setForm({
      bus_number: bus.bus_number || "",
      bus_name: bus.bus_name || "",
      bus_category: bus.bus_category || "route",
      bus_type: bus.bus_type || "AC",
      layout_type: bus.layout_type || "seater",
      total_seats: Number(bus.total_seats || 40),
      driver_ids: driverIds.length ? driverIds : [""],
      status: bus.status || "Active",
    });
    setEditingBusId(bus._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
    <div className="container mt-4 manage-bus-page">
      <h2 className="manage-bus-title">Manage Buses</h2>

      <div className="card p-3 mb-4 shadow-sm manage-bus-card">
        <h4>{editingBusId ? "Edit Bus" : "Add New Bus"}</h4>
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-3 mb-2">
              <label className="form-label manage-bus-label">Bus Number</label>
              <input
                type="text"
                name="bus_number"
                className="form-control manage-bus-input"
                placeholder="Bus Number"
                value={form.bus_number}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label manage-bus-label">Bus Name</label>
              <input
                type="text"
                name="bus_name"
                className="form-control manage-bus-input"
                placeholder="Bus Name"
                value={form.bus_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label manage-bus-label">Category</label>
              <select
                name="bus_category"
                className="form-control manage-bus-input"
                value={form.bus_category}
                onChange={handleChange}
              >
                <option value="route">Route</option>
                <option value="tour">Tour</option>
              </select>
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label manage-bus-label">Bus Type</label>
              <input
                list="bus-type-options"
                name="bus_type"
                className="form-control manage-bus-input"
                placeholder="Bus Type (e.g., AC, Sleeper, Double Decker)"
                value={form.bus_type}
                onChange={handleChange}
                required
              />
              <datalist id="bus-type-options">
                {uniqueBusTypes.map((type) => (
                  <option key={type} value={type} />
                ))}
              </datalist>
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label manage-bus-label">Layout Type</label>
              <select
                name="layout_type"
                className="form-control manage-bus-input"
                value={form.layout_type}
                onChange={handleChange}
              >
                <option value="seater">Seater (2x3)</option>
                <option value="seater_2x2">Seater (2x2)</option>
                <option value="sleeper">Sleeper</option>
                <option value="double_decker">Double Decker</option>
              </select>
            </div>
            <div className="col-md-3 mb-2">
              <label className="form-label manage-bus-label">Total Seats</label>
              <input
                type="number"
                name="total_seats"
                className="form-control manage-bus-input"
                placeholder="Seats"
                value={form.total_seats}
                min="1"
                max="150"
                onChange={handleChange}
                required
              />
            </div>
            {/* Staff Dropdowns (Multiple Drivers) */}
            <div className="col-md-6 mb-2">
              <label className="form-label manage-bus-label">
                Drivers (min 1, max 2)
              </label>
              {form.driver_ids.map((driverId, index) => (
                <div className="d-flex gap-2 mb-2" key={`driver-${index}`}>
                  <select
                    className="form-control manage-bus-input"
                    value={driverId}
                    onChange={(e) => updateDriverInput(index, e.target.value)}
                    required
                  >
                    <option value="">Select Driver</option>
                    {staffList
                      .filter((staff) =>
                        (staff.designation || "")
                          .toLowerCase()
                          .includes("driver")
                      )
                      .map((driver) => (
                        <option
                          key={driver._id}
                          value={driver._id}
                          disabled={isDriverUnavailable(driver._id)}
                        >
                          {driver.name} ({driver.designation})
                          {isDriverUnavailable(driver._id)
                            ? " - Already assigned"
                            : ""}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={addDriverInput}
                    disabled={form.driver_ids.length >= 2}
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
              <label className="form-label manage-bus-label">Status</label>
              <select
                name="status"
                className="form-control manage-bus-input"
                value={form.status}
                onChange={handleChange}
              >
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          <div className="d-flex gap-2 mt-2">
            <button className="btn btn-primary" type="submit">
              {editingBusId ? "Update Bus" : "Add Bus"}
            </button>
            {editingBusId ? (
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="card p-3 mb-3 manage-bus-card">
        <div className="manage-bus-counts mb-3">
          <div className="manage-bus-count-item">
            <span>Total Buses</span>
            <strong>{totalBuses}</strong>
          </div>
          <div className="manage-bus-count-item">
            <span>Route Buses</span>
            <strong>{totalRouteBuses}</strong>
          </div>
          <div className="manage-bus-count-item">
            <span>Tour Buses</span>
            <strong>{totalTourBuses}</strong>
          </div>
        </div>

        <div className="row g-3 align-items-end">
          <div className="col-md-4">
            <label className="form-label manage-bus-label">Search</label>
            <input
              className="form-control manage-bus-input"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by bus number or name"
            />
          </div>
          <div className="col-md-3">
            <label className="form-label manage-bus-label">
              Filter Category
            </label>
            <select
              className="form-control manage-bus-input"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All</option>
              <option value="route">Route</option>
              <option value="tour">Tour</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label manage-bus-label">Filter Type</label>
            <select
              className="form-control manage-bus-input"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All</option>
              {uniqueBusTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label manage-bus-label">Filter Layout</label>
            <select
              className="form-control manage-bus-input"
              value={filterLayoutType}
              onChange={(e) => setFilterLayoutType(e.target.value)}
            >
              <option value="all">All</option>
              <option value="seater">seater</option>
              <option value="sleeper">sleeper</option>
              <option value="double_decker">double_decker</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label manage-bus-label">Filter Status</label>
            <select
              className="form-control manage-bus-input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="Active">Active</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      <div className="manage-bus-table-wrap">
        <table className="table table-bordered table-striped manage-bus-table">
          <thead className="table-dark">
            <tr>
              <th>Sr No</th>
              <th>Number</th>
              <th>Name</th>
              <th>Category</th>
              <th>Type</th>
              <th>Layout</th>
              <th>Seats</th>
              <th>Drivers</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredBuses.map((bus, index) => (
              <tr key={bus._id}>
                <td>{index + 1}</td>
                <td>{bus.bus_number}</td>
                <td>{bus.bus_name}</td>
                <td>{bus.bus_category || "route"}</td>
                <td>{bus.bus_type}</td>
                <td>{bus.layout_type || "seater"}</td>
                <td>{bus.total_seats}</td>
                <td>
                  {Array.isArray(bus.driver_ids) && bus.driver_ids.length
                    ? bus.driver_ids
                        .map((driver) =>
                          typeof driver === "object"
                            ? driver.name || "Unknown"
                            : "Assigned"
                        )
                        .join(", ")
                    : bus.driver_id?.name || "-"}
                </td>
                <td>{bus.status}</td>
                <td>
                  <button
                    className="btn btn-warning btn-sm me-2"
                    onClick={() => handleEdit(bus)}
                  >
                    Edit
                  </button>
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
    </div>
  );
};

export default ManageBus;
