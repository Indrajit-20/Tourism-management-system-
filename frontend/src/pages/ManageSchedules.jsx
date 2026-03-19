import React, { useEffect, useState } from "react";
import axios from "axios";

const ManageSchedules = () => {

  // ── All data lists ──
  const [schedules, setSchedules] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);

  // ── Form fields ──
  const [editingId, setEditingId] = useState(null); // null = adding new, id = editing
  const [title, setTitle] = useState("");
  const [routeId, setRouteId] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [frequency, setFrequency] = useState("Daily");
  const [daysOfWeek, setDaysOfWeek] = useState([]);
  const [boardingPoints, setBoardingPoints] = useState("");
  const [driverId, setDriverId] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [status, setStatus] = useState("Active");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── Load everything when page opens ──
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Fetch schedules, routes and staff at same time
      const schedulesRes = await axios.get("http://localhost:4000/api/bus-schedules");
      const routesRes    = await axios.get("http://localhost:4000/api/bus-routes");
      const staffRes     = await axios.get("http://localhost:4000/api/staff", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSchedules(schedulesRes.data || []);
      setRoutes(routesRes.data || []);

      // ✅ FIX: Only show drivers (not guides) in dropdown
      // ✅ FIX: Staff model has 'name' field not 'first_name last_name'
      const onlyDrivers = staffRes.data.filter(s => s.designation === "driver");
      setDrivers(onlyDrivers);

    } catch (err) {
      console.error("Error loading data", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Clear form back to empty ──
  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setRouteId("");
  
    setFrequency("Daily");
    setDaysOfWeek([]);
    setBoardingPoints("");
    setDriverId("");
 
    setStatus("Active");
  };

  // ── Toggle a day on/off for Custom frequency ──
  const toggleDay = (dayValue) => {
    if (daysOfWeek.includes(dayValue)) {
      // Remove day if already selected
      setDaysOfWeek(daysOfWeek.filter(d => d !== dayValue));
    } else {
      // Add day if not selected
      setDaysOfWeek([...daysOfWeek, dayValue]);
    }
  };

  // ── Save schedule (create or update) ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in as admin.");
      return;
    }

    setSaving(true);
    try {
      // Build the data to send to backend
      const payload = {
        title:           title,
        route_id:        routeId,
        driver_id:       driverId || undefined,
        frequency:       frequency,
        // Only send days_of_week if frequency is Custom
        days_of_week:    frequency === "Custom" ? daysOfWeek : [],
        // Convert "Stop A, Stop B" string into ["Stop A", "Stop B"] array
        boarding_points: boardingPoints.split(",").map(s => s.trim()).filter(Boolean),
      
        status:          status,
      };

      const headers = { Authorization: `Bearer ${token}` };

      if (editingId) {
        // Update existing schedule
        await axios.put(`http://localhost:4000/api/bus-schedules/${editingId}`, payload, { headers });
        alert("Schedule updated!");
      } else {
        // Create new schedule
        await axios.post("http://localhost:4000/api/bus-schedules", payload, { headers });
        alert("Schedule created!");
      }

      resetForm();
      fetchAllData(); // Refresh the list

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save schedule.");
    } finally {
      setSaving(false);
    }
  };

  // ── Fill form with existing schedule data for editing ──
  const handleEdit = (schedule) => {
    setEditingId(schedule._id);
    setTitle(schedule.title || "");
    // ✅ FIX: route_id from backend is a populated object, so use ._id
    setRouteId(schedule.route_id?._id || schedule.route_id || "");
   
    setFrequency(schedule.frequency || "Daily");
    setDaysOfWeek(schedule.days_of_week || []);
    // Convert array ["Stop A", "Stop B"] back to string "Stop A, Stop B"
    setBoardingPoints((schedule.boarding_points || []).join(", "));
    // ✅ FIX: driver_id from backend is a populated object, so use ._id
    setDriverId(schedule.driver_id?._id || schedule.driver_id || "");
   
    setStatus(schedule.status || "Active");

    // Scroll to top so user can see the form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Delete a schedule ──
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this schedule?")) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:4000/api/bus-schedules/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Schedule deleted!");
      fetchAllData();
    } catch (err) {
      alert("Failed to delete schedule.");
    }
  };

  // ── Show route name in table ──
  // ✅ FIX: schedule.route_id comes as a full object from backend (populated)
  // So we can directly use .boarding_from and .destination
  const getRouteLabel = (routeObj) => {
    if (!routeObj) return "-";
    // If it's a populated object, use it directly
    if (routeObj.boarding_from) {
      return `${routeObj.boarding_from} → ${routeObj.destination}`;
    }
    // Fallback: find in routes list by id
    const found = routes.find(r => r._id === routeObj);
    return found ? `${found.boarding_from} → ${found.destination}` : "-";
  };

  if (loading) return <div className="text-center mt-5">Loading schedules...</div>;

  return (
    <div className="container mt-4">
      <h2>Manage Schedules</h2>

      {/* ───────────── ADD / EDIT FORM ───────────── */}
      <div className="card p-4 mb-4">
        <h5>{editingId ? "Edit Schedule" : "Create New Schedule"}</h5>
        <form onSubmit={handleSubmit}>
          <div className="row g-3">

            {/* Route Dropdown */}
            <div className="col-md-6">
              <label className="form-label">Route *</label>
              <select className="form-select" value={routeId} onChange={e => setRouteId(e.target.value)} required>
                <option value="">Select a route...</option>
                {routes.map(r => (
                  <option key={r._id} value={r._id}>
                    {r.boarding_from} → {r.destination}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="col-md-6">
              <label className="form-label">Schedule Title *</label>
              <input
                type="text" className="form-control"
                placeholder="e.g. Morning Express"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

          

            {/* Frequency */}
            <div className="col-md-3">
              <label className="form-label">Frequency</label>
              <select className="form-select" value={frequency} onChange={e => setFrequency(e.target.value)}>
                <option value="Daily">Daily</option>
                <option value="Weekdays">Weekdays (Mon–Fri)</option>
                <option value="Weekends">Weekends (Sat–Sun)</option>
                <option value="Custom">Custom Days</option>
              </select>
            </div>

           

            {/* Driver Dropdown */}
            <div className="col-md-6">
              {/*  FIX: uses driver.name from Staff model */}
              <label className="form-label">Driver (optional)</label>
              <select className="form-select" value={driverId} onChange={e => setDriverId(e.target.value)}>
                <option value="">Use bus default driver</option>
                {drivers.map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="col-md-6">
              <label className="form-label">Status</label>
              <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Custom Days — only show when frequency is Custom */}
            {frequency === "Custom" && (
              <div className="col-12">
                <label className="form-label">Select Days</label>
                <div className="d-flex flex-wrap gap-2">
                  {[
                    { label: "Sun", value: 0 }, { label: "Mon", value: 1 },
                    { label: "Tue", value: 2 }, { label: "Wed", value: 3 },
                    { label: "Thu", value: 4 }, { label: "Fri", value: 5 },
                    { label: "Sat", value: 6 },
                  ].map(day => (
                    <button
                      key={day.value}
                      type="button"
                      className={`btn btn-sm ${daysOfWeek.includes(day.value) ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => toggleDay(day.value)}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Boarding Points */}
            <div className="col-12">
              <label className="form-label">Boarding Points (comma separated)</label>
              <input
                type="text" className="form-control"
                placeholder="Stop A, Stop B, Stop C"
                value={boardingPoints}
                onChange={e => setBoardingPoints(e.target.value)}
              />
            </div>

          </div>{/* end row */}

          {/* Buttons */}
          <div className="mt-3 d-flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update Schedule" : "Create Schedule"}
            </button>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>

        </form>
      </div>

      {/* ───────────── SCHEDULES LIST TABLE ───────────── */}
      <div className="card p-3">
        <h5>All Schedules</h5>

        {schedules.length === 0 ? (
          <p className="text-muted">No schedules created yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Route</th>
                  <th>Title</th>
                  <th>Frequency</th>
                  <th>Time</th>
                  <th>Price</th>
                  <th>Driver</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map(schedule => (
                  <tr key={schedule._id}>

                    {/* ✅ FIX: pass full route_id object to getRouteLabel */}
                    <td>{getRouteLabel(schedule.route_id)}</td>

                    <td>{schedule.title}</td>

                    <td>
                      {schedule.frequency}
                      {/* Show selected days if Custom */}
                      {schedule.frequency === "Custom" && schedule.days_of_week?.length > 0 && (
                        <div className="small text-muted">
                          Days: {schedule.days_of_week.join(", ")}
                        </div>
                      )}
                    </td>

                    <td>{schedule.departure_time} → {schedule.arrival_time}</td>

                    <td>₹{schedule.base_price || 0}</td>

                    {/* ✅ FIX: driver uses .name field from Staff model */}
                    <td>{schedule.driver_id?.name || "Bus default"}</td>

                    <td>
                      <span className={`badge ${schedule.status === "Active" ? "bg-success" : "bg-danger"}`}>
                        {schedule.status}
                      </span>
                    </td>

                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => handleEdit(schedule)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(schedule._id)}
                      >
                        Delete
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default ManageSchedules;
