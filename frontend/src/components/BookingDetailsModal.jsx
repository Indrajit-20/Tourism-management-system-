import React from "react";

const BookingDetailsModal = ({
  selectedBooking,
  onClose,
  onPrint,
  getBusRoute,
  getPackageRoute,
  getBusDepartureTime,
  getBusArrivalTime,
  getBusBoardingPoint,
  getBusDropPoint,
  getPackageSeatsText,
  normalizeStatus,
  formatTime,
  formatCurrency,
}) => {
  if (!selectedBooking) return null;

  const { booking, type } = selectedBooking;
  const isBus = type === "bus";

  return (
    <div className="booking-modal-backdrop" onClick={onClose}>
      <div className="booking-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="booking-modal-header">
          <div>
            <h5 className="mb-1">Booking Details</h5>
            <small>{isBus ? "Bus Ticket" : "Tour Package"}</small>
          </div>
          <button className="btn btn-sm btn-light" onClick={onClose}>
            X
          </button>
        </div>

        <div className="booking-modal-body">
          <div className="booking-modal-section-title">Basic Info</div>
          <div className="booking-modal-row">
            <span>Booking ID</span>
            <strong>{booking?._id || "-"}</strong>
          </div>
          <div className="booking-modal-row">
            <span>Status</span>
            <strong>{booking?.booking_status || "-"}</strong>
          </div>
          <div className="booking-modal-row">
            <span>Payment</span>
            <strong>{booking?.payment_status || "-"}</strong>
          </div>

          {isBus ? (
            <>
              <div className="booking-modal-section-title mt-3">
                Journey Details
              </div>
              <div className="booking-modal-row">
                <span>Route</span>
                <strong>{getBusRoute(booking)}</strong>
              </div>
              <div className="booking-modal-row">
                <span>Departure</span>
                <strong>{formatTime(getBusDepartureTime(booking))}</strong>
              </div>
              <div className="booking-modal-row">
                <span>Arrival</span>
                <strong>{formatTime(getBusArrivalTime(booking))}</strong>
              </div>
              <div className="booking-modal-row">
                <span>Boarding Point</span>
                <strong>{getBusBoardingPoint(booking)}</strong>
              </div>
              <div className="booking-modal-row">
                <span>Drop Point</span>
                <strong>{getBusDropPoint(booking)}</strong>
              </div>
              <div className="booking-modal-row">
                <span>Seats</span>
                <strong>
                  {(booking?.seat_numbers || []).join(", ") || "-"}
                </strong>
              </div>
            </>
          ) : (
            <>
              <div className="booking-modal-section-title mt-3">
                Tour Details
              </div>
              <div className="booking-modal-row">
                <span>Package</span>
                <strong>{booking?.Package_id?.package_name || "-"}</strong>
              </div>
              <div className="booking-modal-row">
                <span>Route</span>
                <strong>{getPackageRoute(booking)}</strong>
              </div>
              <div className="booking-modal-row">
                <span>Boarding Point</span>
                <strong>{booking?.pickup_location || "-"}</strong>
              </div>
              <div className="booking-modal-row">
                <span>Departure</span>
                <strong>
                  {normalizeStatus(booking?.booking_status) === "confirmed"
                    ? formatTime(booking?.tour_schedule_id?.departure_time)
                    : "Will be shown after confirmation"}
                </strong>
              </div>
              <div className="booking-modal-row">
                <span>Seats</span>
                <strong>{getPackageSeatsText(booking)}</strong>
              </div>
            </>
          )}

          <div className="booking-modal-section-title mt-3">Price</div>
          <div className="booking-modal-row">
            <span>Per Person</span>
            <strong>
              {isBus
                ? formatCurrency(booking?.price_per_seat)
                : formatCurrency(booking?.price_per_person)}
            </strong>
          </div>
          <div className="booking-modal-row">
            <span>Total Paid</span>
            <strong>{formatCurrency(booking?.total_amount)}</strong>
          </div>

          <div className="booking-modal-actions">
            <button
              className="btn btn-primary booking-action-btn"
              onClick={onPrint}
            >
              Print / Download
            </button>
            <button
              className="btn btn-outline-secondary booking-action-btn"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsModal;
