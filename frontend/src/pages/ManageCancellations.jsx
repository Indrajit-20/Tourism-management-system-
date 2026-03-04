import React, { useState, useEffect } from "react";
import axios from "axios";

const ManageCancellations = () => {
  const [cancellations, setCancellations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchCancellations();
  }, []);

  const fetchCancellations = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:4000/api/cancellation/admin/all",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setCancellations(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch cancellations");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDone = async (cancellationId) => {
    try {
      const token = localStorage.getItem("token");

      // First create refund record
      await axios.post(
        "http://localhost:4000/api/refunds/create",
        {
          cancellation_id: cancellationId,
          refund_mode: "Online",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccessMessage("Refund marked as done");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchCancellations();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    }
  };

  const filteredCancellations = cancellations.filter((cancellation) => {
    if (filterStatus === "All") return true;
    return cancellation.status === filterStatus;
  });

  return (
    <div className="container-fluid p-4">
      <div className="mb-4">
        <h2 className="mb-2">Manage Cancellations</h2>
        <p className="text-muted">
          View and process customer booking cancellations
        </p>
      </div>

      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          ></button>
        </div>
      )}

      {successMessage && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="alert"
        >
          {successMessage}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccessMessage("")}
          ></button>
        </div>
      )}

      <div className="row mb-4">
        <div className="col-md-4">
          <label className="form-label fw-bold">Filter by Status:</label>
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Cancelled">Pending Refund</option>
            <option value="Refund Done">Refund Completed</option>
          </select>
        </div>
        <div className="col-md-8 d-flex align-items-end justify-content-end">
          <button onClick={fetchCancellations} className="btn btn-primary">
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading cancellations...</p>
        </div>
      ) : filteredCancellations.length === 0 ? (
        <div className="alert alert-info text-center">
          <p>No cancellations found</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover table-striped">
            <thead className="table-dark">
              <tr>
                <th>Customer Name</th>
                <th>Booking Type</th>
                <th>Refund Amount</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCancellations.map((cancellation) => (
                <tr key={cancellation._id}>
                  <td>
                    {cancellation.custmer_id?.first_name || "N/A"}{" "}
                    {cancellation.custmer_id?.last_name || ""}
                  </td>
                  <td>
                    <span className="badge bg-info">
                      {cancellation.booking_type}
                    </span>
                  </td>
                  <td>
                    <strong>₹{cancellation.refund_amount?.toFixed(2)}</strong>
                  </td>
                  <td>
                    <small>{cancellation.cancellation_reason}</small>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        cancellation.status === "Cancelled"
                          ? "bg-warning text-dark"
                          : "bg-success"
                      }`}
                    >
                      {cancellation.status === "Cancelled"
                        ? "Pending"
                        : "Completed"}
                    </span>
                  </td>
                  <td>
                    <small>
                      {new Date(cancellation.createdAt).toLocaleDateString()}
                    </small>
                  </td>
                  <td>
                    {cancellation.status === "Cancelled" ? (
                      <button
                        onClick={() => handleMarkDone(cancellation._id)}
                        className="btn btn-sm btn-success"
                      >
                        Mark Done
                      </button>
                    ) : (
                      <span className="text-muted small">✓ Done</span>
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

export default ManageCancellations;
