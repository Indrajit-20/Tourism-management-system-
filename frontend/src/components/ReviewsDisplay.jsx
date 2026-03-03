// filepath: frontend/src/components/ReviewsDisplay.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

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

      const res = await axios.get(`http://localhost:4000${endpoint}`);
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

      const res = await axios.get(`http://localhost:4000${endpoint}`);
      setRating(res.data);
    } catch (err) {
      console.error("Error fetching rating", err);
    }
  };

  const renderStars = (stars) => {
    return "⭐".repeat(stars) + "☆".repeat(5 - stars);
  };

  if (loading) return <div className="text-center">Loading reviews...</div>;

  return (
    <div className="mt-5 card p-4">
      <h3>Customer Reviews</h3>

      {/* Rating Summary */}
      <div className="mb-4 p-3 bg-light rounded">
        <h4>
          {renderStars(Math.round(rating.average))} {rating.average}/5
        </h4>
        <p className="text-muted">Based on {rating.total_reviews} reviews</p>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <p className="text-muted">No reviews yet. Be the first to review!</p>
      ) : (
        <div className="reviews-container">
          {reviews.map((review) => (
            <div key={review._id} className="border-bottom pb-3 mb-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="mb-1">
                    {review.custmer_id?.first_name}{" "}
                    {review.custmer_id?.last_name}
                  </h6>
                  <p className="text-warning small mb-1">
                    {renderStars(review.rating)}
                  </p>
                </div>
                <small className="text-muted">
                  {new Date(review.createdAt).toLocaleDateString()}
                </small>
              </div>
              <p className="mb-0">{review.review_text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsDisplay;
