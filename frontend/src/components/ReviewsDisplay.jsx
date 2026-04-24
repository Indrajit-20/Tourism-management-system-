// filepath: frontend/src/components/ReviewsDisplay.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL.replace("/api", "");

const ReviewsDisplay = ({ packageId, routeId, type = "package" }) => {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState({ average: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
    fetchRating();
  }, [packageId, routeId, type]);

  const fetchReviews = async () => {
    try {
      const endpoint =
        type === "package"
          ? `/api/feedback/package/${packageId}`
          : `/api/feedback/route/${routeId}`;

      const res = await axios.get(`${API_BASE_URL}${endpoint}`);
      setReviews(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching reviews", err);
      setLoading(false);
    }
  };

  const fetchRating = async () => {
    try {
      const endpoint =
        type === "package"
          ? `/api/feedback/rating/package/${packageId}`
          : `/api/feedback/rating/route/${routeId}`;

      const res = await axios.get(`${API_BASE_URL}${endpoint}`);
      setRating(res.data);
    } catch (err) {
      console.error("Error fetching rating", err);
    }
  };

  const renderStars = (stars) => {
    return (
      <div className="text-warning small d-inline-block">
        {[...Array(5)].map((_, i) => (
          <i
            key={i}
            className={`bi bi-star${i < stars ? "-fill" : ""} me-1 small`}
          ></i>
        ))}
        <span className="ms-1 text-dark fw-bold small">{stars || 0}/5</span>
      </div>
    );
  };

  if (loading) return <div className="text-center">Loading reviews...</div>;

  return (
    <div className="mt-4">
      {/* Simple Header with Total */}
      <div className="d-flex align-items-center mb-4">
        <h5 className="fw-bold mb-0 me-3">Reviews</h5>
        {rating.total_reviews > 0 && (
          <span className="badge bg-light text-dark border fw-normal p-2">
            ⭐ {rating.average} ({rating.total_reviews} reviews)
          </span>
        )}
      </div>

      {/* Simplified Reviews List */}
      <div className="list-group list-group-flush border-top">
        {reviews.length === 0 ? (
          <div className="py-4 text-muted small fst-italic">
            No reviews yet for this package.
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review._id}
              className="list-group-item px-0 py-4 border-bottom shadow-none"
            >
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <span className="fw-bold small text-dark me-2">
                    {review.custmer_id?.first_name}{" "}
                    {review.custmer_id?.last_name || ""}
                  </span>
                  {renderStars(review.rating)}
                </div>
                <small className="text-muted" style={{ fontSize: "0.7rem" }}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </small>
              </div>
              <p className="mb-0 text-secondary small lh-base">
                {review.review_text}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewsDisplay;
