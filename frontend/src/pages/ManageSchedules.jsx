import React, { useEffect, useState } from "react";
import axios from "axios";
import { to12HourDisplay } from "../utils/timeFormat";
import "../css/manageSchedules.css";

const findCityKey = (value) => {
  const text = String(value || "")
    .trim()
    .toLowerCase();
  if (text.includes("ahmedabad")) return "ahmedabad";
  if (text.includes("surat")) return "surat";
  if (text.includes("rajkot")) return "rajkot";
  if (text.includes("vadodara") || text.includes("vado")) return "vadodara";
  if (text.includes("bhavnagar") || text.includes("bav")) return "bhavnagar";
  return "";
};

const boardingPointByCity = {
  ahmedabad: "Maninagar",
  surat: "Udhna Darwaja",
  rajkot: "Madhapar Chowk",
  vadodara: "Central Bus Station",
  bhavnagar: "Nilambaug Circle",
};

const dropPointByCity = {
  ahmedabad: "Geeta Mandir Bus Stand",
  surat: "Surat Central Bus Stand",
  rajkot: "Raiya Circle",
  vadodara: "Vadodara Central Bus Stand",
  bhavnagar: "Bhavnagar Bus Depot",
};

const suggestBoardingPoint = (city) => {
  const key = findCityKey(city);
  return boardingPointByCity[key] || String(city || "").trim();
};

const suggestDropPoint = (city) => {
  const key = findCityKey(city);
  return dropPointByCity[key] || String(city || "").trim();
};

const ManageSchedules = () => {
  // ── All data lists ──
  const [schedules, setSchedules] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);

  // ── Form fields ──
  const [editingId, setEditingId] = useState(null); // null = adding new, id = editing
  const [title, setTitle] = useState("");
  const [routeId, setRouteId] = useState("");
  const [frequency, setFrequency] = useState("Daily");
  const [daysOfWeek, setDaysOfWeek] = useState([]);
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [boardingPoint, setBoardingPoint] = useState("");
  const [dropPoint, setDropPoint] = useState("");
  const [driverIds, setDriverIds] = useState(["", ""]); // ✅ Array for min 2 drivers
  const [status, setStatus] = useState("Active");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [driverLoadMessage, setDriverLoadMessage] = useState("");

  // ── Load everything when page opens ──
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("token");

      const [schedulesRes, routesRes, busesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/bus-schedules`),
        axios.get(`${import.meta.env.VITE_API_URL}/bus-routes`),
        axios.get(`${import.meta.env.VITE_API_URL}/bus`),
      ]);

      setSchedules(schedulesRes.data || []);
      setRoutes(routesRes.data || []);
      setBuses(busesRes.data || []);
      setDriverLoadMessage("");

      // Keep route/schedule dropdown usable even if staff token is expired.
      if (token) {
        try {
          const staffRes = await axios.get(`${import.meta.env.VITE_API_URL}/staff`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const onlyDrivers = (staffRes.data || []).filter((s) =>
            String(s.designation || "")
              .toLowerCase()
              .includes("driver")
          );
          setDrivers(onlyDrivers);
          if (onlyDrivers.length === 0) {
            setDriverLoadMessage("No drivers found in staff records.");
          }
        } catch (staffErr) {
          console.warn(
            "Unable to load drivers",
            staffErr?.response?.data || staffErr.message
          );
          setDrivers([]);
          if (staffErr?.response?.status === 401) {
            setDriverLoadMessage(
              "Session expired. Please login again to load drivers."
            );
          } else if (staffErr?.response?.status === 403) {
            setDriverLoadMessage("Admin access is required to load drivers.");
          } else {
            setDriverLoadMessage("Unable to load drivers right now.");
          }
        }
      } else {
        setDrivers([]);
        setDriverLoadMessage("Login as admin to load drivers.");
      }
    } catch (err) {
      console.error("Error loading data", err);
      setSchedules([]);
      setRoutes([]);
      setBuses([]);
      setDrivers([]);
      setDriverLoadMessage("Failed to load schedules and routes.");
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
    setDepartureTime("");
    setArrivalTime("");
    setBasePrice("");
    setBoardingPoint("");
    setDropPoint("");
    setDriverIds(["", ""]); // ✅ Reset to min 2 drivers
    setStatus("Active");
  };

  const handleRouteChange = (newRouteId) => {
    setRouteId(newRouteId);
    const selectedRoute = routes.find((r) => r._id === newRouteId);
    if (!selectedRoute) return;

    if (!boardingPoint) {
      const board = suggestBoardingPoint(selectedRoute.boarding_from);
      setBoardingPoint(board);
    }
    if (!dropPoint) {
      const drop = suggestDropPoint(selectedRoute.destination);
      setDropPoint(drop);
    }
    if (!basePrice) {
      setBasePrice(selectedRoute.price_per_seat || "");
    }
  };

  // ── Toggle a day on/off for Custom frequency ──
  const toggleDay = (dayValue) => {
    if (daysOfWeek.includes(dayValue)) {
      // Remove day if already selected
      setDaysOfWeek(daysOfWeek.filter((d) => d !== dayValue));
    } else {
      // Add day if not selected
      setDaysOfWeek([...daysOfWeek, dayValue]);
    }
  };

  // ── Save schedule (create or update) ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem("token");
    if (!token) {
      alert("You must be logged in as admin.");
      return;
    }

    // Validate Driver 1 is selected (mandatory)
    if (!driverIds[0] || !driverIds[0].trim()) {
      alert("Please select at least Driver 1 (mandatory)");
      return;
    }

    setSaving(true);
    try {
      // Build the data to send to backend
      const payload = {
        title: title,
        route_id: routeId,
        departure_time: departureTime,
        arrival_time: arrivalTime,
        base_price: basePrice ? Number(basePrice) : undefined,
        driver_ids: driverIds.filter((id) => id && id.trim()), // ✅ Send only selected drivers
        frequency: frequency,
        // Only send days_of_week if frequency is Custom
        days_of_week: frequency === "Custom" ? daysOfWeek : [],
        // Single point only (business rule)
        boarding_points: boardingPoint ? [boardingPoint.trim()] : [],
        drop_points: dropPoint ? [dropPoint.trim()] : [],
        status: status,
      };

      const headers = { Authorization: `Bearer ${token}` };

      if (editingId) {
        // Update existing schedule
        await axios.put(
          `${import.meta.env.VITE_API_URL}/bus-schedules/${editingId}`,
          payload,
          { headers }
        );
        alert("Schedule updated!");
      } else {
        // Create new schedule
        await axios.post(`${import.meta.env.VITE_API_URL}/bus-schedules`, payload, {
          headers,
        });
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
    setDepartureTime(schedule.departure_time || "");
    setArrivalTime(schedule.arrival_time || "");
    setBasePrice(schedule.base_price || "");
    setFrequency(schedule.frequency || "Daily");
    setDaysOfWeek(schedule.days_of_week || []);
    setBoardingPoint((schedule.boarding_points || [])[0] || "");
    setDropPoint((schedule.drop_points || [])[0] || "");

    // ✅ FIX: Load driver_ids as array
    let driverIds = ["", ""];
    if (schedule.driver_ids && Array.isArray(schedule.driver_ids)) {
      // driver_ids is already an array
      driverIds = schedule.driver_ids.map((d) =>
        typeof d === "object" ? d?._id || "" : d || ""
      );
      // Ensure at least 2 slots
      while (driverIds.length < 2) {
        driverIds.push("");
      }
    } else if (schedule.driver_id) {
      // Old format - single driver_id
      driverIds[0] =
        typeof schedule.driver_id === "object"
          ? schedule.driver_id?._id || ""
          : schedule.driver_id || "";
    }
    setDriverIds(driverIds);

    setStatus(schedule.status || "Active");

    // Scroll to top so user can see the form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Delete a schedule ──
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this schedule?"))
      return;
    const token = sessionStorage.getItem("token");
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/bus-schedules/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
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
    // Route label must stay city-level: From city -> To city
    if (routeObj.boarding_from || routeObj.destination) {
      return `${routeObj.boarding_from || "-"} → ${
        routeObj.destination || "-"
      }`;
    }
    // Fallback: find in routes list by id
    const found = routes.find((r) => r._id === routeObj);
    return found
      ? `${found.boarding_from || "-"} → ${found.destination || "-"}`
      : "-";
  };

  const filteredSchedules = schedules.filter((schedule) => {
    const search = searchText.trim().toLowerCase();
    if (!search) return true;

    const titleText = String(schedule.title || "").toLowerCase();
    const frequencyText = String(schedule.frequency || "").toLowerCase();
    const routeText = getRouteLabel(schedule.route_id).toLowerCase();

    return (
      titleText.includes(search) ||
      frequencyText.includes(search) ||
      routeText.includes(search)
    );
  });

  const selectedRoute = routes.find((r) => String(r._id) === String(routeId));
  const selectedBusId = String(
    selectedRoute?.bus_id?._id || selectedRoute?.bus_id || ""
  );

  const assignedDriverIds = new Set(
    buses
      .filter((bus) => String(bus._id) !== selectedBusId)
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

  const availableOverrideDrivers = drivers.filter((driver) => {
    const id = String(driver._id || "");
    if (!id) return false;
    // Show all drivers - no filtering needed for new multi-driver system
    return true;
  });

  const totalSchedules = schedules.length;

  if (loading)
    return <div className="text-center mt-5">Loading schedules...</div>;

  return (
    <div className="container mt-4 manage-schedules-page">
      <h2 className="manage-schedules-title">Manage Schedules</h2>

      {/* ───────────── ADD / EDIT FORM ───────────── */}
      <div className="card p-4 mb-4 shadow-sm manage-schedules-card">
        <h5 className="mb-3">
          {editingId ? "Edit Schedule" : "Create New Schedule"}
        </h5>
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            {/* Route Dropdown */}
            <div className="col-md-6">
              <label className="form-label manage-schedules-label">
                Route *
              </label>
              <select
                className="form-select manage-schedules-input"
                value={routeId}
                onChange={(e) => handleRouteChange(e.target.value)}
                required
              >
                <option value="">Select a route...</option>
                {routes.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.boarding_from} → {r.destination}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="col-md-6">
              <label className="form-label manage-schedules-label">
                Schedule Title *
              </label>
              <input
                type="text"
                className="form-control manage-schedules-input"
                placeholder="e.g. Morning Express"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Frequency */}
            <div className="col-md-3">
              <label className="form-label manage-schedules-label">
                Frequency
              </label>
              <select
                className="form-select manage-schedules-input"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                <option value="Daily">Daily</option>
                <option value="Weekdays">Weekdays (Mon–Fri)</option>
                <option value="Weekends">Weekends (Sat–Sun)</option>
                <option value="Custom">Custom Days</option>
              </select>
            </div>

            {/* Status */}
            <div className="col-md-3">
              <label className="form-label manage-schedules-label">
                Ticket Price (₹) *
              </label>
              <input
                type="number"
                className="form-control manage-schedules-input"
                placeholder="e.g. 500"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                required
              />
            </div>

            <div className="col-md-3">
              <label className="form-label manage-schedules-label">
                Departure Time *
              </label>
              <input
                type="time"
                className="form-control manage-schedules-input"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                required
              />
            </div>

            <div className="col-md-3">
              <label className="form-label manage-schedules-label">
                Arrival Time *
              </label>
              <input
                type="time"
                className="form-control manage-schedules-input"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label manage-schedules-label">
                Status
              </label>
              <select
                className="form-select manage-schedules-input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Custom Days — only show when frequency is Custom */}
            {frequency === "Custom" && (
              <div className="col-12">
                <label className="form-label manage-schedules-label">
                  Select Days
                </label>
                <div className="d-flex flex-wrap gap-2">
                  {[
                    { label: "Sun", value: 0 },
                    { label: "Mon", value: 1 },
                    { label: "Tue", value: 2 },
                    { label: "Wed", value: 3 },
                    { label: "Thu", value: 4 },
                    { label: "Fri", value: 5 },
                    { label: "Sat", value: 6 },
                  ].map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      className={`btn btn-sm ${
                        daysOfWeek.includes(day.value)
                          ? "btn-primary"
                          : "btn-outline-secondary"
                      }`}
                      onClick={() => toggleDay(day.value)}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Boarding Point */}
            <div className="col-12">
              <label className="form-label manage-schedules-label">
                Boarding Point
              </label>
              <input
                type="text"
                className="form-control manage-schedules-input"
                placeholder="e.g. Paldi Cross Road"
                value={boardingPoint}
                onChange={(e) => setBoardingPoint(e.target.value)}
              />
            </div>

            <div className="col-12">
              <label className="form-label manage-schedules-label">
                Drop Point
              </label>
              <input
                type="text"
                className="form-control manage-schedules-input"
                placeholder="e.g. Surat Bus Depot"
                value={dropPoint}
                onChange={(e) => setDropPoint(e.target.value)}
              />
            </div>

            {/* Driver Dropdowns - Driver 1 mandatory, Driver 2 optional */}
            <div className="col-12">
              <label className="form-label manage-schedules-label">
                🚗 Drivers *
              </label>
              <small className="text-muted d-block mb-2">
                Driver 1: Required | Driver 2: Optional (for long bus trips)
              </small>

              {/* Driver 1 - MANDATORY */}
              <select
                className="form-select manage-schedules-input mb-2"
                value={driverIds[0] || ""}
                onChange={(e) => {
                  const newIds = [...driverIds];
                  newIds[0] = e.target.value;
                  setDriverIds(newIds);
                }}
                required
              >
                <option value="">-- Select Driver 1 (Required) --</option>
                {drivers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} - {d.contact_no}
                  </option>
                ))}
              </select>

              {/* Driver 2 - OPTIONAL */}
              <select
                className="form-select manage-schedules-input"
                value={driverIds[1] || ""}
                onChange={(e) => {
                  const newIds = [...driverIds];
                  newIds[1] = e.target.value;
                  setDriverIds(newIds);
                }}
              >
                <option value="">-- Select Driver 2 (Optional) --</option>
                {drivers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} - {d.contact_no}
                  </option>
                ))}
              </select>

              <small className="text-muted d-block mt-1">
                {drivers.length} drivers available
              </small>
              {driverLoadMessage ? (
                <small className="text-muted d-block mt-1">
                  {driverLoadMessage}
                </small>
              ) : null}
            </div>
          </div>
          {/* end row */}

          {/* Buttons */}
          <div className="mt-3 d-flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId
                ? "Update Schedule"
                : "Create Schedule"}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ───────────── SCHEDULES LIST TABLE ───────────── */}
      <div className="card p-3 mb-3 manage-schedules-card">
        <div className="row g-3 align-items-end mb-3">
          <div className="col-md-8">
            <label className="form-label manage-schedules-label">
              Search Schedules
            </label>
            <input
              type="text"
              className="form-control manage-schedules-input"
              placeholder="Search by route, title, or frequency"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <div className="manage-schedules-count-item">
              <span>Total Schedules</span>
              <strong>{totalSchedules}</strong>
            </div>
          </div>
        </div>
      </div>

      {filteredSchedules.length === 0 ? (
        <div className="manage-schedules-table-wrap p-3">
          <p className="text-muted mb-0">No schedules created yet.</p>
        </div>
      ) : (
        <div className="table-responsive manage-schedules-table-wrap">
          <table className="table table-bordered table-striped table-sm align-middle manage-schedules-table">
            <thead className="table-dark">
              <tr>
                <th>SNo</th>
                <th>Route</th>
                <th>Title</th>
                <th>Frequency</th>
                <th>Drivers</th>
                <th>Time</th>
                <th>Price</th>
                <th>Boarding Point</th>
                <th>Drop Point</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.map((schedule, index) => (
                <tr key={schedule._id}>
                  <td>{index + 1}</td>

                  {/* ✅ FIX: pass full route_id object to getRouteLabel */}
                  <td>{getRouteLabel(schedule.route_id)}</td>

                  <td>{schedule.title}</td>

                  <td>
                    {schedule.frequency}
                    {/* Show selected days if Custom */}
                    {schedule.frequency === "Custom" &&
                      schedule.days_of_week?.length > 0 && (
                        <div className="small text-muted">
                          Days: {schedule.days_of_week.join(", ")}
                        </div>
                      )}
                  </td>

                  <td>
                    {Array.isArray(schedule.driver_ids) &&
                    schedule.driver_ids.length > 0 ? (
                      <div className="small">
                        {schedule.driver_ids
                          .map((d) => d?.name || "Driver")
                          .join(", ")}
                      </div>
                    ) : (
                      <span className="text-muted small">Not set</span>
                    )}
                  </td>

                  <td>
                    {to12HourDisplay(schedule.departure_time)} →{" "}
                    {to12HourDisplay(schedule.arrival_time)}
                  </td>

                  <td>₹{schedule.base_price || 0}</td>

                  <td>{schedule.boarding_points?.[0] || "-"}</td>

                  <td>{schedule.drop_points?.[0] || "-"}</td>

                  <td>
                    <span
                      className={`badge ${
                        schedule.status === "Active"
                          ? "bg-success"
                          : "bg-danger"
                      }`}
                    >
                      {schedule.status}
                    </span>
                  </td>

                  <td>
                    <div className="d-flex justify-content-center gap-2">
                      <button
                        className="btn btn-primary btn-sm"
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageSchedules;
