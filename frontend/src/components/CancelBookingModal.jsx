import React, { useState } from "react";
import axios from "axios";

const CancelBookingModal = ({
  show,
  bookingId,
  bookingType,
  amount,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCancel = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please provide a cancellation reason");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/cancellation/cancel",
        {
          booking_id: bookingId,
          booking_type: bookingType,
          refund_amount: amount,
          reason: reason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setReason("");
      onSuccess(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel booking");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div
      className="modal d-block"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-danger text-white">
            <h5 className="modal-title">Cancel Booking</h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          <div className="modal-body">
            <div className="alert alert-success mb-3">
              <h6 className="mb-2">
                <strong>Refund Amount: ₹{amount?.toFixed(2)}</strong>
              </h6>
              <p className="mb-0">✓ You'll receive 100% refund</p>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleCancel}>
              <div className="mb-3">
                <label htmlFor="reason" className="form-label">
                  Cancellation Reason <span className="text-danger">*</span>
                </label>
                <textarea
                  id="reason"
                  className="form-control"
                  rows="4"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please tell us why you're cancelling this booking"
                  disabled={loading}
                ></textarea>
              </div>

              <div className="d-flex gap-2 justify-content-end">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Keep Booking
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Confirm Cancellation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelBookingModal;
