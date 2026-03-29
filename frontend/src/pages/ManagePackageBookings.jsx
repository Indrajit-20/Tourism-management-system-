import React, { useState, useEffect } from "react";
import axios from "axios";

const ManagePackageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  const normalizeStatus = (status) => String(status || "").toLowerCase();
  const toLabel = (status) => {
    const normalized = normalizeStatus(status);
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:4000/api/bookings/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
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
        `http://localhost:4000/api/bookings/update-status/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert(`Booking ${newStatus}!`);
      fetchBookings(); // Refresh list
    } catch (err) {
      console.error(err);
      alert("Action Failed");
    }
  };

  if (loading) return <div>Loading bookings...</div>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Package Booking Requests</h2>
        <select
          className="form-select w-auto"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Bookings</option>
          <option value="pending">Pending Only</option>
          <option value="approved">Approved</option>
          <option value="confirmed">Confirmed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <table className="table table-hover">
        <thead className="table-dark">
          <tr>
            <th>User</th>
            <th>Package</th>
            <th>Travellers</th>
            <th>Total Amount</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {bookings
            .filter(
              (b) =>
                filterStatus === "all" ||
                normalizeStatus(b.booking_status) === filterStatus,
            )
            .map((b) => (
              <tr key={b._id}>
                <td>{b.Custmer_id?.first_name || "Unknown"}</td>
                <td>{b.Package_id?.package_name || "Unknown Package"}</td>
                <td>{b.travellers}</td>
                <td>₹{b.total_amount}</td>
                <td>
                  <span
                    className={`badge ${
                      normalizeStatus(b.booking_status) === "confirmed"
                        ? "bg-success"
                        : normalizeStatus(b.booking_status) === "approved"
                          ? "bg-info text-dark"
                          : normalizeStatus(b.booking_status) === "pending"
                            ? "bg-warning"
                            : "bg-danger"
                    }`}
                  >
                    {toLabel(b.booking_status)}
                  </span>
                </td>
                <td>
                  {normalizeStatus(b.booking_status) === "pending" && (
                    <>
                      <button
                        className="btn btn-sm btn-success me-2"
                        onClick={() => handleStatus(b._id, "approved")}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleStatus(b._id, "rejected")}
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

export default ManagePackageBookings;
