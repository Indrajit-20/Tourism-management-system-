// Frontend Component for Admin to View & Approve Bookings
import React, { useState, useEffect } from "react";
import axios from "axios";

const ManageBusBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All"); // <-- NEW

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:4000/api/bus-bookings/all",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setBookings(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatus = async (id, newStatus) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `http://localhost:4000/api/bus-bookings/status/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Booking ${newStatus}!`);
      fetchBookings(); // Refresh list
    } catch (err) {
      console.error(err);
      alert("Error: " + (err.response?.data?.message || "Action Failed"));
    }
  };

  if (loading) return <div>Loading bookings...</div>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Bus Booking Requests</h2>
        <select
          className="form-select w-auto"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="All">All Bookings</option>
          <option value="Pending">Pending Only</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>
      <table className="table table-hover">
        <thead className="table-dark">
          <tr>
            <th>User</th>
            <th>Route</th>
            <th>Date</th>
            <th>Seats</th>
            <th>Total</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {bookings
            .filter(
              (b) => filterStatus === "All" || b.booking_status === filterStatus
            )
            .map((b) => (
              <tr key={b._id}>
                <td>
                  {b.customer_id?.first_name} {b.customer_id?.last_name}
                </td>
                <td>
                  {b.trip_id?.schedule_id?.route_id?.boarding_from} &rarr;{" "}
                  {b.trip_id?.schedule_id?.route_id?.destination}
                </td>
                <td>{new Date(b.travel_date).toLocaleDateString()}</td>
                <td>
                  <span className="badge bg-info">
                    {b.seat_numbers?.join(", ") || b.travellers}
                  </span>
                </td>
                <td>₹{b.total_amount}</td>
                <td>
                  <span
                    className={`badge ${
                      b.booking_status === "Confirmed"
                        ? "bg-success"
                        : b.booking_status === "Approved"
                        ? "bg-info"
                        : b.booking_status === "Pending"
                        ? "bg-warning"
                        : "bg-danger"
                    }`}
                  >
                    {b.booking_status}
                  </span>
                </td>
                <td>
                  {b.booking_status === "Pending" && (
                    <>
                      <button
                        className="btn btn-sm btn-success me-2"
                        onClick={() => handleStatus(b._id, "Approved")}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleStatus(b._id, "Rejected")}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageBusBookings;
