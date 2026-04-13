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

const BookingModal = ({ booking, onClose, onPrint }) => {
  if (!booking) return null;

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
  const canPrint = !isTour || normalize(booking.paymentStatus) === "paid";
  const showPayReminder =
    isTour &&
    normalize(booking.status) === "approved" &&
    normalize(booking.paymentStatus) !== "paid";
  const deadlineText = toDateTimeLabel(booking.paymentDeadline);
  const showApprovalReminder =
    isTour && normalize(booking.status) === "pending";
  const displayPassengers =
    Array.isArray(booking.passengers) && booking.passengers.length > 0
      ? booking.passengers
      : (() => {
          const seats = Array.isArray(booking.seats) ? booking.seats : [];
          const fallbackCount = Math.max(
            Number(booking.travellers || 0),
            seats.length,
          );
          return Array.from({ length: fallbackCount }, (_, index) => ({
            name: `Passenger ${index + 1}`,
            age: "-",
            gender: "-",
            seat: seats[index] || "-",
          }));
        })();

  return (
    <div className="fv-modal-backdrop" onClick={onClose}>
      <div className="fv-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`fv-modal-head ${isTour ? "tour" : "bus"}`}>
          <div>
            <div className="text-uppercase fw-bold small opacity-75 mb-1">
              {isTour ? "Tour Package" : "Bus Ticket"}
            </div>
            <h5 className="mb-1">{booking.name}</h5>
            <div className="opacity-75">
              {booking._id} · Booked {toDateLabel(booking.bookedOn)}
            </div>
          </div>
          <button className="fv-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="fv-modal-body">
          <div className="d-flex gap-2 flex-wrap justify-content-center mb-3">
            <span
              className={STATUS_BADGE[booking.status] || STATUS_BADGE.Pending}
            >
              {booking.status}
            </span>
            <span
              className={PAY_BADGE[booking.paymentStatus] || PAY_BADGE.Pending}
            >
              {PAY_ICON[booking.paymentStatus] || "ℹ️"} Payment{" "}
              {booking.paymentStatus}
            </span>
          </div>

          {showApprovalReminder && (
            <div className="fv-note fv-note-info mb-3">
              Official update: Your booking is waiting for admin approval.
              Payment will be enabled after approval.
            </div>
          )}

          {showPayReminder && (
            <div className="fv-note fv-note-warn mb-3">
              Official update: Your booking is approved. Please complete payment
              within the allowed time limit to confirm your seat.
              {deadlineText ? ` Please pay before ${deadlineText}.` : ""}
            </div>
          )}

          <div className="border rounded-4 p-3">
            <div className="fv-section-title">Journey Details</div>

            {[
              { label: "From", value: booking.from },
              { label: "To", value: booking.to },
              {
                label: isTour ? "Start Date" : "Travel Date",
                value: toDateLabel(booking.startDate),
              },
              ...(booking.endDate
                ? [{ label: "End Date", value: toDateLabel(booking.endDate) }]
                : []),
              { label: "Departure", value: booking.departure || "-" },
              ...(!isTour
                ? [{ label: "Arrival", value: booking.arrival || "-" }]
                : []),
              { label: "Duration", value: booking.duration || "-" },
              { label: "Transport", value: booking.transport || "-" },
              { label: "Bus Type", value: booking.busType || "-" },
              { label: "Bus Name", value: booking.busName || "-" },
              { label: "Bus No", value: booking.busNo || "-" },
              ...(isTour
                ? [{ label: "Hotel", value: booking.hotel || "-" }]
                : []),
              { label: "Pickup Point", value: booking.pickup || "-" },
              ...(!isTour
                ? [{ label: "Drop Point", value: booking.drop || "-" }]
                : []),
              { label: "Per Person", value: toMoney(booking.pricePerPerson) },
            ].map((row, index) => (
              <div key={index} className="fv-row">
                <span className="fv-row-label">{row.label}</span>
                <span className="fv-row-value">{row.value}</span>
              </div>
            ))}
          </div>

          {!isTour && booking.seats?.length > 0 && (
            <div className="mt-3">
              <div className="fv-section-title">Seat Numbers</div>
              <div className="d-flex gap-2 flex-wrap">
                {booking.seats.map((seat) => (
                  <span key={seat} className="fv-seat-chip">
                    {seat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {isTour && booking.inclusions?.length > 0 && (
            <div className="mt-3">
              <div className="fv-section-title">Package Includes</div>
              <div className="d-flex gap-2 flex-wrap">
                {booking.inclusions.map((item, index) => (
                  <span key={index} className="fv-inc-chip">
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3">
            <div className="fv-section-title">
              Passengers ({displayPassengers.length || 0})
            </div>
            {displayPassengers.map((passenger, index) => (
              <div key={index} className="fv-pax">
                <div className="fv-pax-left">
                  <div className="fv-avatar">
                    {String(passenger.name || "P").charAt(0)}
                  </div>
                  <div>
                    <div className="fw-bold">
                      {passenger.name || "Passenger"}
                    </div>
                    <small className="text-muted">
                      Age {passenger.age || "-"} · {passenger.gender || "-"}
                    </small>
                  </div>
                </div>
                {!!passenger.seat && (
                  <span className="fv-seat-chip">{passenger.seat}</span>
                )}
              </div>
            ))}
          </div>

          <div className="fv-pricebar">
            <div>
              <div className="text-muted small fw-semibold">Total Paid</div>
              <div className="fv-price-main">{toMoney(booking.totalPaid)}</div>
              {showChildDiscount && (
                <div className="fv-price-note">
                  Includes child discount: {toMoney(childDiscountAmount)}
                </div>
              )}
            </div>
            <div className="text-end">
              <div className="text-muted small fw-semibold">Per Person</div>
              <div className="fv-price-small">
                {toMoney(booking.pricePerPerson)}
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 mt-3">
            <button
              className="btn btn-primary fv-btn flex-grow-1"
              disabled={!canPrint}
              title={
                !canPrint
                  ? "Print/Download is available after payment confirmation."
                  : ""
              }
              onClick={() => onPrint?.(booking)}
            >
              Print / Download Ticket
            </button>
            <button className="btn btn-outline-danger fv-btn" onClick={onClose}>
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
