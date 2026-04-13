// filepath: frontend/src/pages/ManageFeedback.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const ManageFeedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("All");

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:4000/api/feedback/admin/all",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setFeedback(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching feedback", err);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    // Delete is disabled in UI by requirement.
    return;
  };

  const renderStars = (stars) => {
    return "⭐".repeat(stars) + "☆".repeat(5 - stars);
  };

  if (loading) return <div className="text-center">Loading feedback...</div>;

  const filteredFeedback = feedback.filter((fb) => {
    if (filterType === "Package") {
      return fb.package_id !== null && fb.package_id !== undefined;
    } else if (filterType === "Bus") {
      return fb.route_id !== null && fb.route_id !== undefined;
    }
    return true;
  });

  return (
    <div className="container mt-4">
      <h2>Manage Customer Feedback</h2>

      <div className="mb-3">
        <select
          className="form-select w-auto"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="All">All Feedback</option>
          <option value="Package">Package Reviews</option>
          <option value="Bus">Bus Reviews</option>
        </select>
      </div>

      {filteredFeedback.length === 0 ? (
        <div className="alert alert-info">No feedback found</div>
      ) : (
        <div className="row">
          {filteredFeedback.map((fb) => (
            <div className="col-md-6 mb-4" key={fb._id}>
              <div className="card h-100">
                <div className="card-body">
                  {/* Header */}
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h6 className="card-title mb-1">
                        {fb.custmer_id?.first_name} {fb.custmer_id?.last_name}
                      </h6>
                      <small className="text-muted">
                        {fb.custmer_id?.email}
                      </small>
                    </div>
                    <div className="text-end">
                      <div className="text-warning">
                        {renderStars(fb.rating)}
                      </div>
                      <small className="text-muted">{fb.rating}/5</small>
                    </div>
                  </div>

                  {/* What they reviewed */}
                  <p className="small text-muted mb-2">
                    {fb.package_id ? (
                      <>
                        📦 Package:{" "}
                        <strong>{fb.package_id.package_name}</strong>
                      </>
                    ) : (
                      <>
                        🚌 Route:{" "}
                        <strong>
                          {fb.route_id?.boarding_from} →{" "}
                          {fb.route_id?.destination}
                        </strong>
                      </>
                    )}
                  </p>

                  {/* Review Text */}
                  <p className="card-text">{fb.review_text}</p>

                  {/* Footer */}
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageFeedback;
