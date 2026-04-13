import React, { useState, useEffect } from "react";
import axios from "axios";
import Storage from "../utils/storage";
import "../css/manageBusBookings.css";

const ManageBusBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = Storage.getToken();
      const res = await axios.get(
        "http://localhost:4000/api/bus-bookings/all",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminCancel = async (id) => {
    if (!window.confirm("Cancel this booking and release seats?")) return;

    const reason = window.prompt("Please enter cancellation reason:", "");
    if (!reason || !reason.trim()) {
      alert("Cancellation reason is required.");
      return;
    }

    const token = Storage.getToken();
    try {
      await axios.put(
        `http://localhost:4000/api/bus-bookings/status/${id}`,
        { status: "Cancelled", reason: reason.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Booking cancelled successfully.");
      fetchBookings();
    } catch (err) {
      console.error(err);
      alert("Error: " + (err.response?.data?.message || "Action Failed"));
    }
  };

  const bookingStatusClass = (status) => {
    if (status === "Confirmed") return "bg-success";
    if (status === "Cancelled") return "bg-secondary";
    return "bg-dark";
  };

  const paymentStatusClass = (status) => {
    if (status === "Paid") return "bg-success";
    if (status === "Pending") return "bg-warning text-dark";
    if (status === "Refunded") return "bg-info text-dark";
    return "bg-secondary";
  };

  const formatDate = (value) => {
    const dateObj = new Date(value);
    if (Number.isNaN(dateObj.getTime())) return "-";
    return dateObj.toLocaleDateString("en-GB");
  };

  const toDateKey = (value) => {
    const dateObj = new Date(value);
    if (Number.isNaN(dateObj.getTime())) return "";
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const filteredBookings = bookings.filter((b) => {
    const statusMatch =
      filterStatus === "All" || b.booking_status === filterStatus;
    const dateMatch = !filterDate || toDateKey(b.travel_date) === filterDate;

    const route = b.trip_id?.schedule_id?.route_id;
    const routeCity = `${route?.boarding_from || ""} ${
      route?.destination || ""
    }`;
    const user = `${b.customer_id?.first_name || ""} ${
      b.customer_id?.last_name || ""
    }`;
    const busNo = String(b.trip_id?.bus_id?.bus_number || "");
    const busType = String(b.trip_id?.bus_id?.bus_type || "");
    const layoutType = String(b.trip_id?.bus_id?.layout_type || "");
    const search = searchText.trim().toLowerCase();
    const searchMatch =
      !search ||
      user.toLowerCase().includes(search) ||
      routeCity.toLowerCase().includes(search) ||
      busType.toLowerCase().includes(search) ||
      layoutType.toLowerCase().includes(search) ||
      busNo.toLowerCase().includes(search) ||
      String(b._id || "")
        .toLowerCase()
        .includes(search);

    return statusMatch && dateMatch && searchMatch;
  });

  const totalBookings = bookings.length;
  const confirmedCount = bookings.filter(
    (b) => b.booking_status === "Confirmed"
  ).length;
  const cancelledCount = bookings.filter(
    (b) => b.booking_status === "Cancelled"
  ).length;

  if (loading) return <div>Loading bookings...</div>;

  return (
    <div className="container mt-4 manage-bus-bookings-page">
      <h2 className="manage-bus-bookings-title">Bus Booking Requests</h2>

      <div className="card p-3 mb-3 shadow-sm manage-bus-bookings-card">
        <div className="manage-bus-bookings-counts mb-3">
          <div className="manage-bus-bookings-count-item">
            <span>Total</span>
            <strong>{totalBookings}</strong>
          </div>
          <div className="manage-bus-bookings-count-item">
            <span>Confirmed</span>
            <strong>{confirmedCount}</strong>
          </div>
          <div className="manage-bus-bookings-count-item">
            <span>Cancelled</span>
            <strong>{cancelledCount}</strong>
          </div>
        </div>

        <div className="row g-3 align-items-end">
          <div className="col-md-5">
            <label className="form-label manage-bus-bookings-label">
              Search
            </label>
            <input
              className="form-control manage-bus-bookings-input"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by user, route city, bus number, bus type, layout type, or booking ID"
            />
          </div>
          <div className="col-md-3">
            <label className="form-label manage-bus-bookings-label">
              Filter Date
            </label>
            <input
              type="date"
              className="form-control manage-bus-bookings-input"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label manage-bus-bookings-label">
              Filter Status
            </label>
            <select
              className="form-select manage-bus-bookings-input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Bookings</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="alert alert-info">
          No booking requests found for selected filters.
        </div>
      ) : (
        <div className="table-responsive manage-bus-bookings-table-wrap">
          <table className="table table-bordered table-striped table-sm align-middle manage-bus-bookings-table">
            <thead className="table-dark">
              <tr>
                <th>Sr No</th>
                <th>Booking ID</th>
                <th>User</th>
                <th>Route (City)</th>
                <th>Board/Drop Point</th>
                <th>Bus No.</th>
                <th>Bus Type</th>
                <th>Layout Type</th>
                <th>Date</th>
                <th>Departure</th>
                <th>Arrival</th>
                <th>Seats</th>
                <th>Price/Seat</th>
                <th>Total</th>
                <th>Booking</th>
                <th>Payment</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b, index) => {
                const route = b.trip_id?.schedule_id?.route_id;
                const schedule = b.trip_id?.schedule_id;
                const routeCity = `${route?.boarding_from || "-"} → ${
                  route?.destination || "-"
                }`;
                const stops = `${
                  route?.board_point || route?.boarding_from || "-"
                } → ${route?.drop_point || route?.destination || "-"}`;
                const canCancel = !["Cancelled"].includes(
                  String(b.booking_status || "")
                );

                return (
                  <tr key={b._id}>
                    <td>{index + 1}</td>
                    <td>
                      <span
                        className="manage-bus-bookings-id"
                        title={String(b._id || "-")}
                      >
                        {String(b._id || "-")}
                      </span>
                    </td>
                    <td>
                      {b.customer_id?.first_name} {b.customer_id?.last_name}
                    </td>
                    <td>{routeCity}</td>
                    <td>{stops}</td>
                    <td>{b.trip_id?.bus_id?.bus_number || "-"}</td>
                    <td>{b.trip_id?.bus_id?.bus_type || "-"}</td>
                    <td>{b.trip_id?.bus_id?.layout_type || "-"}</td>
                    <td>{formatDate(b.travel_date)}</td>
                    <td>{schedule?.departure_time || "-"}</td>
                    <td>{schedule?.arrival_time || "-"}</td>
                    <td>
                      <span className="badge bg-info text-dark">
                        {b.seat_numbers?.join(", ") || b.travellers}
                      </span>
                    </td>
                    <td>₹{b.price_per_seat ?? route?.price_per_seat ?? 0}</td>
                    <td>₹{b.total_amount}</td>
                    <td>
                      <span
                        className={`badge ${bookingStatusClass(
                          b.booking_status
                        )}`}
                      >
                        {b.booking_status}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${paymentStatusClass(
                          b.payment_status
                        )}`}
                      >
                        {b.payment_status}
                      </span>
                    </td>
                    <td className="text-center">
                      {canCancel ? (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleAdminCancel(b._id)}
                        >
                          Cancel
                        </button>
                      ) : (
                        <span className="text-muted small">No action</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageBusBookings;
