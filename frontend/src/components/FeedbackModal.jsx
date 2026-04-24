import React, { useState } from "react";
import axios from "axios";

const FeedbackModal = ({ booking, onClose, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const API = import.meta.env.VITE_API_URL.replace("/api", "");
  const isTour = booking?.type?.toLowerCase() === "tour";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        setError("Please log in to submit feedback");
        setSubmitting(false);
        return;
      }

      const payload = {
        rating: Number(rating),
        review_text: reviewText.trim(),
      };

      if (isTour) {
        payload.package_booking_id = booking._id;
      } else {
        payload.bus_booking_id = booking._id;
      }

      const res = await axios.post(`${API}/api/feedback/submit`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Thank you! Your feedback has been submitted.");
      setReviewText("");
      setRating(5);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to submit feedback";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal fade"
      id="feedbackModal"
      tabIndex="-1"
      aria-labelledby="feedbackModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="feedbackModalLabel">
              ⭐ Leave Feedback
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger alert-dismissible fade show">
                  {error}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setError("")}
                  />
                </div>
              )}

              <div className="mb-3">
                <label className="form-label fw-bold">
                  {isTour ? "📦 Tour" : "🚌 Bus"} Booking:{" "}
                  <span className="text-primary">{booking.name}</span>
                </label>
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold">
                  Your Rating <span className="text-danger">*</span>
                </label>
                <div className="d-flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="btn btn-lg"
                      style={{
                        fontSize: "2rem",
                        padding: "0.5rem",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                      }}
                      onClick={() => setRating(star)}
                    >
                      <span style={{ opacity: star <= rating ? 1 : 0.3 }}>
                        ⭐
                      </span>
                    </button>
                  ))}
                </div>
                <small className="text-muted d-block mt-2">
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </small>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">
                  Your Review <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Share your experience..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  required
                  minLength="10"
                  maxLength="500"
                />
                <small className="text-muted d-block mt-1">
                  {reviewText.length}/500 characters
                </small>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-light"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || reviewText.trim().length < 10}
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
