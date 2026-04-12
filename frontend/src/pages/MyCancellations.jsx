import React, { useEffect, useState } from "react";
import axios from "axios";

const MyCancellations = () => {
  const [cancellations, setCancellations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMyCancellations();
  }, []);

  const fetchMyCancellations = async () => {
    try {
      setLoading(true);
      setError("");
      const token = sessionStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:4000/api/cancellation/my-cancellations",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setCancellations(response.data || []);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Failed to fetch your cancellations"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="container mt-5">
        <h2 className="mb-4">My Cancellations</h2>
        <p className="text-muted mb-4">
          Here are the bookings you have cancelled.
        </p>

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

        {loading ? (
          <div className="text-center p-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading your cancellations...</p>
          </div>
        ) : cancellations.length === 0 ? (
          <div className="alert alert-info text-center">
            <p>You haven't cancelled any bookings yet</p>
          </div>
        ) : (
          <div className="row">
            {cancellations.map((cancellation) => (
              <div key={cancellation._id} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title">
                      <span className="badge bg-info me-2">
                        {cancellation.booking_type}
                      </span>
                    </h5>

                    <div className="mb-3">
                      <p className="text-muted mb-1">
                        <small>Refund Amount</small>
                      </p>
                      <h4 className="mb-0">
                        ₹{cancellation.refund_amount?.toFixed(2)}
                      </h4>
                    </div>

                    <div className="mb-3">
                      <p className="text-muted mb-1">
                        <small>Status</small>
                      </p>
                      <span
                        className={`badge ${
                          cancellation.status === "Cancelled"
                            ? "bg-warning text-dark"
                            : "bg-success"
                        }`}
                      >
                        {cancellation.status === "Cancelled"
                          ? "Pending Refund"
                          : "Refund Completed"}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="text-muted mb-1">
                        <small>Reason</small>
                      </p>
                      <p className="mb-0">
                        <small>{cancellation.cancellation_reason}</small>
                      </p>
                    </div>

                    <div className="border-top pt-3">
                      <p className="text-muted mb-0">
                        <small>
                          Cancelled on:{" "}
                          {new Date(
                            cancellation.createdAt
                          ).toLocaleDateString()}
                        </small>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MyCancellations;
