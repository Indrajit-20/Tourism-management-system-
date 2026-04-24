import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { to12HourDisplay, toMinutes } from "../utils/timeFormat";
import Storage from "../utils/storage";
import SearchFilterContainer from "../components/SearchFilterContainer";
import { LoadingSkeleton } from "../components/LoadingComponents";

const BookBus = () => {
  const [routes, setRoutes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [tripInfo, setTripInfo] = useState({}); // ✅ seat info per schedule
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({
    date: new Date().toISOString().split("T")[0],
    seats: 1,
  });
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const todayIso = new Date().toISOString().split("T")[0];
  const [minDate] = useState(todayIso);
  const navigate = useNavigate();

  // Load routes and schedules when page opens
  useEffect(() => {
    fetchRoutes();
    fetchSchedules();
  }, [bookingDetails.date]); // ✅ Refetch when date changes

  const fetchRoutes = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/bus-routes/`
      );
      setRoutes(res.data);
    } catch (err) {
      console.error("Error fetching routes", err);
    }
  };

  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/bus-schedules`
      );
      setSchedules(res.data);
      // Fetch seat availability for the currently selected date
      await fetchSeatAvailability(res.data, bookingDetails.date);
    } catch (err) {
      console.error("Error fetching schedules", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Fetch seat availability for each schedule
  const fetchSeatAvailability = async (schedulesList, selectedDate) => {
    const info = {};
    const now = new Date();
    const isToday = selectedDate === now.toISOString().split("T")[0];

    await Promise.all(
      schedulesList.map(async (schedule) => {
        try {
          const depMinutes = toMinutes(schedule.departure_time);
          const nowMinutes = now.getHours() * 60 + now.getMinutes();
          const hasDeparted =
            isToday && depMinutes !== null && nowMinutes >= depMinutes;

          // If departed, skip fetching and mark as hidden (we'll filter them out)
          if (hasDeparted) {
            info[schedule._id] = { departed: true };
            return;
          }

          // Get trip for this schedule on the selected date
          const res = await axios.get(
            `${import.meta.env.VITE_API_URL}/bus-trips?schedule_id=${
              schedule._id
            }&date=${selectedDate}`
          );
          const trip = (res.data || [])[0];
          if (trip) {
            const total = trip.seats?.length || 0;
            const booked =
              trip.seats?.filter((s) => !s.is_available).length || 0;
            info[schedule._id] = {
              total,
              booked,
              available: total - booked,
            };
          } else {
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

  // ✅ Filter schedules based on route search and departure time
  const filteredSchedules = schedules.filter((schedule) => {
    const info = tripInfo[schedule._id];
    // Hide buses that have already departed for the selected date
    if (info?.departed) return false;

    const route = schedule.route_id || {};
    const from = String(route.boarding_from || "").toLowerCase();
    const to = String(route.destination || "").toLowerCase();
    const matchFrom = from.includes(searchFrom.toLowerCase());
    const matchTo = to.includes(searchTo.toLowerCase());
    return matchFrom && matchTo;
  });

  // ✅ Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingDetails((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Updated: Direct booking with selected date
  const handleBook = async (schedule) => {
    const token = Storage.getToken();
    if (!token) {
      alert("Please login to book a ticket");
      navigate("/login");
      return;
    }

    const selectedDate = bookingDetails.date;
    if (!selectedDate) {
      alert("Please select a travel date first.");
      return;
    }

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/bus-trips?schedule_id=${
          schedule._id
        }&date=${selectedDate}`
      );
      const trips = res.data || [];
      const trip = trips[0];

      if (!trip) {
        alert(
          "No trip is available for this schedule on the selected date. " +
            "Please try another date."
        );
        return;
      }

      navigate("/book-seats", {
        state: {
          route: schedule.route_id,
          trip,
          schedule: schedule,
          date: selectedDate,
        },
      });
    } catch (err) {
      console.error("Error finding trip", err);
      alert("Unable to find trip. Please try again later.");
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Search & Book Bus</h2>

      {/* ── STEP 1: DATE & ROUTE SELECTION ── */}
      <div className="card shadow-sm border mb-4" style={{ borderRadius: 12 }}>
        <div className="card-body p-4">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label fw-bold">From</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ahmedabad"
                value={searchFrom}
                onChange={(e) => setSearchFrom(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-bold">To</label>
              <input
                type="text"
                className="form-control"
                placeholder="Rajkot"
                value={searchTo}
                onChange={(e) => setSearchTo(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-bold">Travel Date</label>
              <input
                type="date"
                name="date"
                className="form-control"
                min={minDate}
                value={bookingDetails.date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-3">
              <button
                className="btn btn-primary w-100 fw-bold"
                onClick={() => fetchSchedules()}
              >
                Search Buses
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-3 text-muted">
        Showing {filteredSchedules.length} buses for{" "}
        {new Date(bookingDetails.date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </div>

      {/* ✅ Loading Skeleton */}
      {isLoading && <LoadingSkeleton count={3} height="150px" />}

      {/* ✅ Schedule cards */}
      {!isLoading && (
        <div className="d-flex flex-column gap-3">
          {filteredSchedules.map((schedule) => {
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
            const isSoldOut = info.available === 0;

            return (
              <div
                key={schedule._id}
                className="card shadow-sm border"
                style={{ borderRadius: 12 }}
              >
                <div className="card-body p-3">
                  <div className="row align-items-center">
                    <div className="col-md-3">
                      <h6 className="fw-bold mb-0 text-primary">
                        {bus?.bus_name || schedule.title}
                      </h6>
                      <small className="text-muted">
                        {bus?.bus_type} · {bus?.bus_number}
                      </small>
                      <div className="mt-1">
                        <span
                          className="badge bg-light text-dark border"
                          style={{ fontSize: "0.7rem" }}
                        >
                          🔄 {schedule.frequency}
                        </span>
                      </div>
                    </div>

                    <div className="col-md-5">
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        <div className="text-center">
                          <div
                            className="fw-bold"
                            style={{ fontSize: "1.2rem" }}
                          >
                            {to12HourDisplay(schedule.departure_time)}
                          </div>
                          <small className="text-muted">
                            {route.boarding_from}
                          </small>
                        </div>
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
                        <div className="text-center">
                          <div
                            className="fw-bold"
                            style={{ fontSize: "1.2rem" }}
                          >
                            {to12HourDisplay(schedule.arrival_time)}
                          </div>
                          <small className="text-muted">
                            {route.destination}
                          </small>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-4 text-md-end mt-3 mt-md-0">
                      <div className="mb-2">
                        <small className="text-muted">From </small>
                        <span
                          className="fw-bold text-success"
                          style={{ fontSize: "1.3rem" }}
                        >
                          ₹{schedule.base_price}
                        </span>
                      </div>

                      <button
                        className={`btn w-100 fw-bold mb-2 ${
                          isSoldOut ? "btn-secondary" : "btn-danger"
                        }`}
                        disabled={isSoldOut}
                        onClick={() => handleBook(schedule)}
                      >
                        {isSoldOut ? "Sold Out" : "Select Seats"}
                      </button>

                      <div
                        className={`text-center small fw-bold ${
                          isSoldOut
                            ? "text-danger"
                            : isLow
                            ? "text-warning"
                            : "text-success"
                        }`}
                      >
                        {isSoldOut
                          ? "❌ Fully Booked"
                          : isLow
                          ? `⚠️ Only ${info.available} seats left!`
                          : `✅ ${info.available} Seats Available`}
                      </div>
                    </div>
                  </div>

                  <div className="border-top mt-3 pt-2 d-flex justify-content-between align-items-center">
                    <div className="d-flex gap-3">
                      <small className="text-muted">
                        Total: <strong>{info.total}</strong>
                      </small>
                      <small className="text-muted">
                        Booked:{" "}
                        <strong className="text-danger">{info.booked}</strong>
                      </small>
                      <small className="text-muted">
                        Remaining:{" "}
                        <strong className="text-success">
                          {info.available}
                        </strong>
                      </small>
                    </div>
                    <small className="text-muted italic">
                      {schedule.title}
                    </small>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookBus;
