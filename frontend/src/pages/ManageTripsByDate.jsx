import React, { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:4000";

const ManageTripsByDate = () => {
  // Today's date as default
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Run fetchTrips and drivers every time date changes
  useEffect(() => {
    fetchTrips();
    fetchDrivers();
  }, [date]);

  // ── Fetch drivers for dropdown ──
  const fetchDrivers = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get(`${API}/api/staff`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Filter only drivers
      const onlyDrivers = res.data.filter((s) => s.designation === "driver");
      setDrivers(onlyDrivers);
    } catch (err) {
      console.error("Error fetching drivers", err);
    }
  };

  // ── Fetch all trips for selected date ──
  const fetchTrips = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("token");

      // ✅ FIX: correct endpoint — fetch all then filter by date
      const res = await axios.get(`${API}/api/bus-trips`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Filter trips that match selected date
      const allTrips = res.data || [];
      const filtered = allTrips.filter((trip) => {
        const tripDay = new Date(trip.trip_date).toISOString().split("T")[0];
        return tripDay === date;
      });

      setTrips(filtered);
    } catch (err) {
      console.error("Error fetching trips", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Change driver for a trip ──
  const updateDriver = async (tripId, driverId) => {
    try {
      const token = sessionStorage.getItem("token");

      // ✅ FIX: Send driver_id (MongoDB ObjectId)
      await axios.put(
        `${API}/api/bus-trips/${tripId}`,
        { driver_id: driverId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Driver updated!");
      fetchTrips();
    } catch (err) {
      console.error("Error updating driver", err);
      alert("Failed to update driver.");
    }
  };

  // ── Cancel a trip ──
  const cancelTrip = async (tripId) => {
    if (!window.confirm("Cancel this trip?")) return;
    try {
      const token = sessionStorage.getItem("token");

      // ✅ FIX: actually calls backend to cancel
      await axios.put(
        `${API}/api/bus-trips/${tripId}`,
        { status: "Cancelled" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Trip cancelled!");
      fetchTrips();
    } catch (err) {
      alert("Failed to cancel trip.");
    }
  };

  // ── Helper: get route name from trip ──
  // ✅ FIX: correct nested field path
  const getRoute = (trip) => {
    const route = trip.schedule_id?.route_id;
    if (!route) return "—";
    return `${route.boarding_from} → ${route.destination}`;
  };

  // ── Helper: get bus info ──
  const getBus = (trip) => {
    if (!trip.bus_id) return "—";
    return `${trip.bus_id.bus_number} (${trip.bus_id.bus_type})`;
  };

  // ── Helper: get driver name ──
  const getDriver = (trip) => {
    return trip.driver_id?.name || "Not assigned";
  };

  // ── Helper: get seat counts ──
  // ✅ FIX: count from trip.seats array
  const getSeats = (trip) => {
    const total = trip.seats?.length || 0;
    const booked = trip.seats?.filter((s) => !s.is_available).length || 0;
    return `${booked} / ${total}`;
  };

  // ── Status badge ──
  const statusBadge = (status) => {
    const map = {
      Scheduled: "bg-info text-dark",
      Running: "bg-success",
      Completed: "bg-secondary",
      Cancelled: "bg-danger",
    };
    return (
      <span className={`badge ${map[status] || "bg-secondary"}`}>{status}</span>
    );
  };

  return (
    <div className="container mt-4">
      <h2 className="fw-bold mb-4">Manage Trips</h2>

      {/* Date Picker */}
      <div className="card p-3 mb-4 shadow-sm">
        <div className="d-flex align-items-center gap-3">
          <label className="fw-bold mb-0">Select Date:</label>
          <input
            type="date"
            className="form-control w-auto"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <span className="text-muted">
            {trips.length} trip{trips.length !== 1 ? "s" : ""} found
          </span>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2">Loading trips...</p>
        </div>
      )}

      {/* No trips found */}
      {!loading && trips.length === 0 && (
        <div className="alert alert-info">
          No trips found for <strong>{date}</strong>. Trips are auto created
          when user searches or when schedule is created.
        </div>
      )}

      {/* Trips Table */}
      {!loading && trips.length > 0 && (
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-dark">
              <tr>
                <th>Route</th>
                <th>Bus</th>
                <th>Driver</th>
                <th>Seats (Booked/Total)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={trip._id}>
                  {/* ✅ FIX: correct field path */}
                  <td className="fw-bold text-primary">{getRoute(trip)}</td>

                  {/* ✅ FIX: correct field path */}
                  <td>{getBus(trip)}</td>

                  {/* ✅ FIX: driver dropdown with proper ID handling */}
                  <td>
                    <select
                      className="form-select form-select-sm"
                      defaultValue={trip.driver_id?._id || ""}
                      onChange={(e) => updateDriver(trip._id, e.target.value)}
                      style={{ width: 180 }}
                    >
                      <option value="">Not assigned</option>
                      {drivers.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* ✅ FIX: count from seats array */}
                  <td>{getSeats(trip)}</td>

                  <td>{statusBadge(trip.status)}</td>

                  {/* ✅ FIX: cancel actually works now */}
                  <td>
                    {trip.status !== "Cancelled" &&
                    trip.status !== "Completed" ? (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => cancelTrip(trip._id)}
                      >
                        Cancel Trip
                      </button>
                    ) : (
                      <span className="text-muted small">—</span>
                    )}
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

export default ManageTripsByDate;
