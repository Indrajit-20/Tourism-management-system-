import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { to12HourDisplay, toMinutes } from "../utils/timeFormat";
import Storage from "../utils/storage";
import SearchFilterContainer from "../components/SearchFilterContainer";

const BookBus = () => {
  const [routes, setRoutes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [tripInfo, setTripInfo] = useState({}); // ✅ seat info per schedule
  const [selectedSchedule, setSelectedSchedule] = useState(null);
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

  // ✅ When date changes — reload seat availability for all schedules
  useEffect(() => {
    if (schedules.length > 0 && bookingDetails.date) {
      fetchSeatAvailability(schedules, bookingDetails.date);
    }
  }, [bookingDetails.date]);

  const fetchRoutes = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/bus-routes/");
      setRoutes(res.data);
    } catch (err) {
      console.error("Error fetching routes", err);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/bus-schedules");
      setSchedules(res.data);
      // Fetch seat availability for today by default
      fetchSeatAvailability(res.data, todayIso);
    } catch (err) {
      console.error("Error fetching schedules", err);
    }
  };

  // ✅ Fetch seat availability for each schedule
  const fetchSeatAvailability = async (schedulesList, selectedDate) => {
    const info = {};
    await Promise.all(
      schedulesList.map(async (schedule) => {
        try {
          // Get trip for this schedule on the selected date
          const res = await axios.get(
            `http://localhost:4000/api/bus-trips?schedule_id=${schedule._id}&date=${selectedDate}`
          );
          const trip = (res.data || [])[0];
          if (trip) {
            const total = trip.seats?.length || 0;
            const booked =
              trip.seats?.filter((s) => !s.is_available).length || 0;
            info[schedule._id] = { total, booked, available: total - booked };
          } else {
            // No trip yet — show total seats as available
            const bus = schedule.bus_id || {};
            info[schedule._id] = {
              total: bus.total_seats || 0,
              booked: 0,
              available: bus.total_seats || 0,
            };
          }
        } catch (err) {
          info[schedule._id] = { total: 0, booked: 0, available: 0 };
        }
      })
    );
    setTripInfo(info);
  };

  // ✅ Calculate duration between departure and arrival
  const getDuration = (departure, arrival) => {
    if (!departure || !arrival) return "";
    const departureMinutes = toMinutes(departure);
    const arrivalMinutes = toMinutes(arrival);
    if (departureMinutes === null || arrivalMinutes === null) return "";

    let mins = arrivalMinutes - departureMinutes;
    if (mins < 0) mins += 24 * 60;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m > 0 ? m + "m" : ""}`;
  };

  const isSameDate = (dateA, dateB) =>
    new Date(dateA).toDateString() === new Date(dateB).toDateString();

  const isDeparturePassedToday = (departureTime, selectedDate) => {
    if (!selectedDate) return false;
    const now = new Date();
    const chosen = new Date(selectedDate);
    if (!isSameDate(now, chosen)) return false;

    const depMinutes = toMinutes(departureTime);
    if (depMinutes === null) return false;

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return nowMinutes >= depMinutes;
  };

  // ✅ Filter schedules based on route search (match route's boarding_from & destination)
  const filteredSchedules = schedules.filter((schedule) => {
    const route = schedule.route_id || {};
    const from = String(route.boarding_from || "").toLowerCase();
    const to = String(route.destination || "").toLowerCase();
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
    const token = Storage.getToken();
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

    if (isDeparturePassedToday(selectedSchedule.departure_time, selectedDate)) {
      alert(
        "This schedule departure time has already passed for today. Please choose another date."
      );
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:4000/api/bus-trips?schedule_id=${selectedSchedule._id}&date=${selectedDate}`
      );
      const trips = res.data || [];
      const trip = trips[0];

      if (!trip) {
        alert(
          "No trip is available for this schedule on the selected date. " +
            "This is usually because the schedule does not run that day. Please try another date."
        );
        return;
      }

      navigate("/book-seats", {
        state: {
          route: selectedSchedule.route_id,
          trip,
          schedule: selectedSchedule,
          date: bookingDetails.date,
        },
      });
    } catch (err) {
      console.error("Error finding trip", err);
      alert("Unable to find trip. Please try again later.");
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Available Bus Routes</h2>

      <SearchFilterContainer
        title="Search Bus Tickets"
        subtitle="Filter routes by boarding and destination"
        resultText={`Showing ${filteredSchedules.length} of ${schedules.length} schedules`}
        onClear={() => {
          setSearchFrom("");
          setSearchTo("");
        }}
        clearDisabled={!searchFrom && !searchTo}
      >
        <div className="row g-2 align-items-end">
          <div className="col-md-6">
            <label className="form-label fw-bold mb-1">From</label>
            <input
              type="text"
              className="form-control sfc-input"
              placeholder="e.g. Ahmedabad"
              value={searchFrom}
              onChange={(e) => setSearchFrom(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold mb-1">To</label>
            <input
              type="text"
              className="form-control sfc-input"
              placeholder="e.g. Rajkot"
              value={searchTo}
              onChange={(e) => setSearchTo(e.target.value)}
            />
          </div>
        </div>
      </SearchFilterContainer>

      {/* ✅ Schedule note when schedule selected */}
      {selectedSchedule && (
        <div className="alert alert-info">
          <strong>Schedule:</strong> {selectedSchedule.title} (
          {selectedSchedule.frequency})
        </div>
      )}

      {/* ✅ Schedule cards — now with seat info and duration */}
      <div className="d-flex flex-column gap-3">
        {filteredSchedules.map((schedule) => {
          // Get seat info for this schedule
          const info = tripInfo[schedule._id] || {
            total: 0,
            booked: 0,
            available: 0,
          };
          const route = schedule.route_id || {};
          const bus = schedule.bus_id || {};
          const duration = getDuration(
            schedule.departure_time,
            schedule.arrival_time
          );
          const isLow = info.available > 0 && info.available <= 5;

          return (
            <div
              key={schedule._id}
              className="card shadow-sm border"
              style={{ borderRadius: 12 }}
            >
              <div className="card-body p-3">
                {/* ── Main row ── */}
                <div className="row align-items-center">
                  {/* Left — Bus info */}
                  <div className="col-md-3">
                    <h6 className="fw-bold mb-0 text-primary">
                      {bus?.bus_name || schedule.title}
                    </h6>
                    <small className="text-muted">
                      {bus?.bus_type || "Standard"} · {bus?.bus_number}
                    </small>
                    {/* Schedule frequency badge */}
                    <div className="mt-1">
                      <span
                        className="badge bg-light text-dark border"
                        style={{ fontSize: "0.7rem" }}
                      >
                        🔄 {schedule.frequency}
                      </span>
                    </div>
                  </div>

                  {/* Middle — Time + Duration */}
                  <div className="col-md-5">
                    <div className="d-flex align-items-center justify-content-center gap-2">
                      {/* Departure */}
                      <div className="text-center">
                        <div className="fw-bold" style={{ fontSize: "1.2rem" }}>
                          {to12HourDisplay(schedule.departure_time)}
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
                          {bus?.bus_type}
                        </div>
                      </div>

                      {/* Arrival */}
                      <div className="text-center">
                        <div className="fw-bold" style={{ fontSize: "1.2rem" }}>
                          {to12HourDisplay(schedule.arrival_time)}
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
                        ₹{schedule.base_price}
                      </span>
                    </div>

                    {/* Book Ticket button or booking form */}
                    {selectedSchedule?._id !== schedule._id && (
                      <button
                        className="btn btn-danger fw-bold w-100 mb-1"
                        style={{ borderRadius: 8 }}
                        onClick={() => setSelectedSchedule(schedule)}
                        disabled={info.available === 0}
                      >
                        {info.available === 0 ? "Sold Out" : "Select Seats"}
                      </button>
                    )}

                    {/* Seats left badge */}
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
                    <small className="text-muted d-block mt-2 text-center">
                      Boarding: {route.boarding_from} | Drop:{" "}
                      {route.destination}
                    </small>
                  </div>
                </div>

                {/* Booking form when schedule selected */}
                {selectedSchedule?._id === schedule._id && (
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
                          onClick={() => setSelectedSchedule(null)}
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

                {/* Bottom stats row */}
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
                  <small className="text-muted">{schedule.title}</small>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {filteredSchedules.length === 0 && (
          <div className="text-center text-muted py-5">
            {schedules.length === 0 ? (
              <p>No bus schedules available at the moment.</p>
            ) : (
              <p>
                No schedules found for your search. Try different city names.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookBus;
