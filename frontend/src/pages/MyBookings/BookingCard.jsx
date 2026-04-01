import React from "react";
import { STATUS_BADGE, PAY_BADGE, PAY_ICON, normalize } from "./bookingConfig";

const toDateLabel = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const toMoney = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const toDateTimeLabel = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const BookingCard = ({
  booking,
  onView,
  onCancel,
  onPrint,
  onPay,
  onGenerateInvoice,
}) => {
  const isTour = normalize(booking.type) === "tour";
  const travellerCount = Number(
    booking.travellers || booking.passengers?.length || 0,
  );
  const baseFareTotal = Number(booking.pricePerPerson || 0) * travellerCount;
  const totalPaid = Number(booking.totalPaid || 0);
  const childDiscountAmount = Math.max(
    0,
    Math.round(baseFareTotal - totalPaid),
  );
  const showChildDiscount = isTour && childDiscountAmount > 0;
  const isTourPending = isTour && normalize(booking.status) === "pending";
  const isTourApprovedUnpaid =
    isTour &&
    normalize(booking.status) === "approved" &&
    normalize(booking.paymentStatus) !== "paid";
  const deadlineText = toDateTimeLabel(booking.paymentDeadline);
  const normalizedPaymentStatus = normalize(booking.paymentStatus);
  const canPrint = !isTour || normalizedPaymentStatus === "paid";
  const canGenerateInvoice = normalizedPaymentStatus === "paid";
  const canCancel = ["confirmed", "approved", "pending"].includes(
    normalize(booking.status),
  );

  return (
    <div className="card fv-card">
      <div className={isTour ? "fv-stripe-tour" : "fv-stripe-bus"} />

      {/* Header row */}
      <div className="fv-head">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span
            className={`fv-type ${isTour ? "fv-type-tour" : "fv-type-bus"}`}
          >
            {isTour ? "Tour" : "Bus"}
          </span>
          <span className="fw-bold fs-5">{booking.name}</span>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="fv-booking-id">#{booking._id?.slice(-10)}</span>
          <span
            className={STATUS_BADGE[booking.status] || STATUS_BADGE.Pending}
          >
            {booking.status}
          </span>
          <span
            className={PAY_BADGE[booking.paymentStatus] || PAY_BADGE.Pending}
          >
            {PAY_ICON[booking.paymentStatus] || "ℹ️"} {booking.paymentStatus}
          </span>
        </div>
      </div>

      {/* Body content */}
      <div className="fv-body">
        <div className="fv-route">
          <div>
            <div className="fv-city">{booking.from}</div>
            <div className="fv-city-sub">Origin</div>
          </div>

          <div className="fv-route-mid">
            <div className="fv-route-meta">{booking.duration || "-"}</div>
            <div className="fv-route-line" />
            <div className="fv-route-meta">
              {toDateLabel(booking.startDate)}
              {booking.endDate ? ` → ${toDateLabel(booking.endDate)}` : ""}
            </div>
          </div>

          <div className="text-end">
            <div className="fv-city">{booking.to}</div>
            <div className="fv-city-sub">Destination</div>
          </div>
        </div>

        <div className="fv-time">
          <span className="fv-time-departure-label">Departure</span>
          <strong className="fv-time-departure-value">
            {booking.departure || "-"}
          </strong>
          {!isTour && (
            <>
              <span>──▶</span>
              <strong>{booking.arrival || "-"}</strong>
              <span>Arrival</span>
            </>
          )}
        </div>

        <div className="fv-chips">
          <span className="fv-chip">
            🚌 Transport: {booking.transport || "-"}
          </span>
          <span className="fv-chip">❄️ Bus Type: {booking.busType || "-"}</span>
          <span className="fv-chip">
            🚍 Bus: {booking.busName || "-"}
            {booking.busNo && booking.busNo !== "-"
              ? ` (${booking.busNo})`
              : ""}
          </span>
          <span className="fv-chip">Boarding Point: {booking.pickup}</span>
          {!isTour && (
            <span className="fv-chip">Drop Point: {booking.drop || "-"}</span>
          )}
          <span className="fv-chip">
            👥 {booking.travellers || booking.passengers?.length || 0}{" "}
            Passengers
          </span>
          <span className="fv-chip">
            Seats: {booking.seats?.join(", ") || "-"}
          </span>
          {isTour && booking.hotel && (
            <span className="fv-chip">🏨Hotel : {booking.hotel}</span>
          )}
        </div>

        {isTourPending && (
          <div className="fv-note fv-note-info">
            Official update: Your booking is waiting for admin approval. Payment
            will be enabled after approval.
          </div>
        )}

        {isTourApprovedUnpaid && (
          <div className="fv-note fv-note-warn">
            Official update: Your booking is approved. Please complete payment
            within the allowed time limit to confirm your seat.
            {deadlineText ? ` Please pay before ${deadlineText}.` : ""}
          </div>
        )}

        <div className="fv-footer">
          <div className="d-flex align-items-end gap-4">
            <div>
              <div className="fv-price-label">Per Person</div>
              <div className="fv-price-small">
                {toMoney(booking.pricePerPerson)}
              </div>
            </div>
            <div>
              <div className="fv-price-label">Total Paid</div>
              <div className="fv-price-main">{toMoney(booking.totalPaid)}</div>
              {showChildDiscount && (
                <div className="fv-price-note">
                  Includes child discount: {toMoney(childDiscountAmount)}
                </div>
              )}
            </div>
          </div>

          <div className="fv-btns">
            <button
              className="btn btn-light border fv-btn"
              disabled={!canPrint}
              title={
                !canPrint
                  ? "Print/Download is available after payment confirmation."
                  : ""
              }
              onClick={() => onPrint?.(booking)}
            >
              Print
            </button>
            {isTourApprovedUnpaid && (
              <button
                className="btn btn-success fv-btn"
                onClick={() => onPay?.(booking)}
              >
                Pay Now
              </button>
            )}
            {canGenerateInvoice && (
              <button
                className="btn btn-outline-secondary fv-btn"
                onClick={() => onGenerateInvoice?.(booking)}
              >
                Generate Invoice
              </button>
            )}
            {canCancel && (
              <button
                className="btn btn-outline-danger fv-btn"
                onClick={() => onCancel(booking)}
              >
                Cancel
              </button>
            )}
            <button
              className="btn btn-primary fv-btn"
              onClick={() => onView(booking)}
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
