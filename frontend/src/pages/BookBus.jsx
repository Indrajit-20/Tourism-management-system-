import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BookBus = () => {
  const [routes, setRoutes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [tripInfo, setTripInfo] = useState({}); // ✅ NEW: seat info per route
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [bookingDetails, setBookingDetails] = useState({ date: "", seats: 1 });
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const todayIso = new Date().toISOString().split("T")[0];
  const [minDate] = useState(todayIso);
  const navigate = useNavigate();

  // Load routes and schedules when page opens
  useEffect(() => {
    fetchRoutes();
    fetchSchedules();
  }, []);

  // ✅ NEW: When date changes — reload seat availability
  useEffect(() => {
    if (routes.length > 0 && bookingDetails.date) {
      fetchSeatAvailability(routes, bookingDetails.date);
    }
  }, [bookingDetails.date]);

  const fetchRoutes = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/bus-routes/");
      setRoutes(res.data);
      // Fetch seat availability for today by default
      fetchSeatAvailability(res.data, todayIso);
    } catch (err) {
      console.error("Error fetching routes", err);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/bus-schedules");
      setSchedules(res.data);
    } catch (err) {
      console.error("Error fetching schedules", err);
    }
  };

  // ✅ NEW: Fetch seat availability for each route
  const fetchSeatAvailability = async (routesList, selectedDate) => {
    const info = {};
    await Promise.all(
      routesList.map(async (route) => {
        try {
          const res = await axios.get(
            `http://localhost:4000/api/bus-trips?route_id=${route._id}&date=${selectedDate}`,
          );
          const trip = (res.data || [])[0];
          if (trip) {
            const total = trip.seats?.length || 0;
            const booked =
              trip.seats?.filter((s) => !s.is_available).length || 0;
            info[route._id] = { total, booked, available: total - booked };
          } else {
            // No trip yet — show bus total seats as available
            info[route._id] = {
              total: route.bus_id?.total_seats || 0,
              booked: 0,
              available: route.bus_id?.total_seats || 0,
            };
          }
        } catch (err) {
          info[route._id] = { total: 0, booked: 0, available: 0 };
        }
      }),
    );
    setTripInfo(info);
  };

  // ✅ NEW: Calculate duration between departure and arrival
  const getDuration = (departure, arrival) => {
    if (!departure || !arrival) return "";
    const [dh, dm] = departure.split(":").map(Number);
    const [ah, am] = arrival.split(":").map(Number);
    let mins = ah * 60 + am - (dh * 60 + dm);
    if (mins < 0) mins += 24 * 60;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m > 0 ? m + "m" : ""}`;
  };

  // ✅ KEPT: Filter routes based on search
  const filteredRoutes = routes.filter((route) => {
    const from = route.boarding_from.toLowerCase();
    const to = route.destination.toLowerCase();
    const matchFrom = from.includes(searchFrom.toLowerCase());
    const matchTo = to.includes(searchTo.toLowerCase());
    return matchFrom && matchTo;
  });

  // ✅ KEPT: Handle input changes
  const handleChange = (e) => {
    setBookingDetails({ ...bookingDetails, [e.target.name]: e.target.value });
  };

  // ✅ KEPT: Submit booking
  const handleBook = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to book a ticket");
      navigate("/login");
      return;
    }

    const selectedDate = bookingDetails.date;
    if (selectedDate < minDate) {
      alert("Please select today or a future date.");
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:4000/api/bus-trips?route_id=${selectedRoute._id}&date=${selectedDate}`,
      );
      const trips = res.data || [];
      const trip = trips[0];

      if (!trip) {
        alert(
          "No trip is available for this route on the selected date. " +
            "This is usually because the schedule does not run that day. Please try another date.",
        );
        return;
      }

      navigate("/book-seats", {
        state: { trip, route: selectedRoute, date: bookingDetails.date },
      });
    } catch (err) {
      console.error("Error finding trip", err);
      alert("Unable to find trip. Please try again later.");
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Available Bus Routes</h2>

      {/* ✅ KEPT: Search filter */}
      <div className="card p-3 mb-4 shadow-sm">
        <div className="row g-2 align-items-end">
          <div className="col-md-4">
            <label className="form-label fw-bold mb-1">From</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Ahmedabad"
              value={searchFrom}
              onChange={(e) => setSearchFrom(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-bold mb-1">To</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Rajkot"
              value={searchTo}
              onChange={(e) => setSearchTo(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <button
              className="btn btn-outline-secondary w-100"
              onClick={() => {
                setSearchFrom("");
                setSearchTo("");
              }}
            >
              ✕ Clear
            </button>
          </div>
        </div>
        {(searchFrom || searchTo) && (
          <p className="text-muted mt-2 mb-0 small">
            Showing <strong>{filteredRoutes.length}</strong> of{" "}
            <strong>{routes.length}</strong> routes
          </p>
        )}
      </div>

      {/* ✅ KEPT: Schedule note when route selected */}
      {selectedRoute && (
        <div className="alert alert-info">
          <strong>Schedule note:</strong> This route is configured to run on:
          <ul className="mb-0">
            {(() => {
              const matched = schedules.filter((s) => {
                const routeId = s.route_id?._id || s.route_id;
                return routeId === selectedRoute._id;
              });
              if (!matched.length)
                return <li>No schedule found (admin needs to add one).</li>;
              return matched.map((s) => (
                <li key={s._id}>
                  <strong>{s.title}</strong>: {s.frequency}
                  {s.frequency === "Custom" && s.days_of_week?.length
                    ? ` (days: ${s.days_of_week.join(", ")})`
                    : ""}
                </li>
              ));
            })()}
          </ul>
          <small>
            If you choose a date not covered by the schedule, booking will not
            be possible.
          </small>
        </div>
      )}

      {/* ✅ UPDATED: Route Cards — now with seat info and duration */}
      <div className="d-flex flex-column gap-3">
        {filteredRoutes.map((route) => {
          // Get seat info for this route
          const info = tripInfo[route._id] || {
            total: 0,
            booked: 0,
            available: 0,
          };
          const duration = getDuration(
            route.departure_time,
            route.arrival_time,
          );
          const isLow = info.available > 0 && info.available <= 5;

          return (
            <div
              key={route._id}
              className="card shadow-sm border"
              style={{ borderRadius: 12 }}
            >
              <div className="card-body p-3">
                {/* ── Main row ── */}
                <div className="row align-items-center">
                  {/* Left — Bus info */}
                  <div className="col-md-3">
                    <h6 className="fw-bold mb-0 text-primary">
                      {route.bus_id?.bus_name || route.route_name}
                    </h6>
                    <small className="text-muted">
                      {route.bus_id?.bus_type || "Standard"} ·{" "}
                      {route.bus_id?.bus_number}
                    </small>
                    {/* ✅ NEW: Schedule frequency badge */}
                    {(() => {
                      const matched = schedules.filter(
                        (s) => (s.route_id?._id || s.route_id) === route._id,
                      );
                      return matched.length > 0 ? (
                        <div className="mt-1">
                          <span
                            className="badge bg-light text-dark border"
                            style={{ fontSize: "0.7rem" }}
                          >
                            🔄 {matched[0].frequency}
                          </span>
                        </div>
                      ) : null;
                    })()}
                  </div>

                  {/* Middle — Time + Duration */}
                  <div className="col-md-5">
                    <div className="d-flex align-items-center justify-content-center gap-2">
                      {/* Departure */}
                      <div className="text-center">
                        <div className="fw-bold" style={{ fontSize: "1.2rem" }}>
                          {route.departure_time}
                        </div>
                        <small className="text-muted">
                          {route.boarding_from}
                        </small>
                      </div>

                      {/* Duration line */}
                      <div className="flex-grow-1 text-center px-1">
                        <div style={{ fontSize: "0.7rem", color: "#888" }}>
                          {duration}
                        </div>
                        <div
                          style={{
                            borderTop: "1px solid #ccc",
                            margin: "4px 0",
                          }}
                        />
                        <div style={{ fontSize: "0.65rem", color: "#aaa" }}>
                          {route.bus_id?.bus_type}
                        </div>
                      </div>

                      {/* Arrival */}
                      <div className="text-center">
                        <div className="fw-bold" style={{ fontSize: "1.2rem" }}>
                          {route.arrival_time}
                        </div>
                        <small className="text-muted">
                          {route.destination}
                        </small>
                      </div>
                    </div>
                  </div>

                  {/* Right — Price + Button + Seats left */}
                  <div className="col-md-4 text-md-end mt-3 mt-md-0">
                    <div className="mb-1">
                      <small className="text-muted">From </small>
                      <span
                        className="fw-bold text-success"
                        style={{ fontSize: "1.3rem" }}
                      >
                        ₹{route.price_per_seat}
                      </span>
                    </div>

                    {/* ✅ KEPT: Book Ticket button or booking form */}
                    {selectedRoute?._id !== route._id && (
                      <button
                        className="btn btn-danger fw-bold w-100 mb-1"
                        style={{ borderRadius: 8 }}
                        onClick={() => setSelectedRoute(route)}
                        disabled={info.available === 0}
                      >
                        {info.available === 0 ? "Sold Out" : "Select Seats"}
                      </button>
                    )}

                    {/* ✅ NEW: Seats left badge */}
                    <div
                      className={`text-center small fw-bold ${
                        info.available === 0
                          ? "text-danger"
                          : isLow
                            ? "text-warning"
                            : "text-success"
                      }`}
                    >
                      {info.available === 0
                        ? "❌ Sold Out"
                        : isLow
                          ? `⚠️ Only ${info.available} seats left!`
                          : `✅ ${info.available} Seats Left`}
                    </div>
                  </div>
                </div>

                {/* ✅ KEPT: Booking form when route selected */}
                {selectedRoute?._id === route._id && (
                  <form
                    onSubmit={handleBook}
                    className="mt-3 p-3 bg-light rounded"
                  >
                    <div className="mb-2">
                      <label className="small fw-bold">Travel Date</label>
                      <input
                        type="date"
                        name="date"
                        className="form-control form-control-sm"
                        required
                        min={minDate}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        Select date → choose seats on next page
                      </small>
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
                          Find Seats →
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* ✅ NEW: Bottom stats row */}
                <div className="border-top mt-3 pt-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div className="d-flex gap-2 flex-wrap">
                    <span
                      className="badge bg-light text-dark border"
                      style={{ fontSize: "0.7rem" }}
                    >
                      💺 {info.total} Total
                    </span>
                    <span
                      className="badge bg-light text-dark border"
                      style={{ fontSize: "0.7rem" }}
                    >
                      🔴 {info.booked} Booked
                    </span>
                    <span
                      className="badge bg-light text-dark border"
                      style={{ fontSize: "0.7rem" }}
                    >
                      🟢 {info.available} Available
                    </span>
                  </div>
                  <small className="text-muted">{route.route_name}</small>
                </div>
              </div>
            </div>
          );
        })}

        {/* ✅ KEPT: Empty state */}
        {filteredRoutes.length === 0 && (
          <div className="text-center text-muted py-5">
            {routes.length === 0 ? (
              <p>No bus routes available at the moment.</p>
            ) : (
              <p>No routes found for your search. Try different city names.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookBus;
