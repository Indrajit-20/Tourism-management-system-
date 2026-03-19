import React from "react";

// ─────────────────────────────────────────────
// NormalSeat.jsx
// One seat button for AC / Non-AC bus
//
// Colors:
//   Green outline = Available (can book)
//   Green filled  = Selected (user picked this)
//   Red filled    = Booked (someone else booked)
// ─────────────────────────────────────────────

const NormalSeat = ({ seat, isBooked, isSelected, onSeatClick }) => {

  // Pick Bootstrap class based on seat status
  let btnClass = "btn btn-outline-success"; // available
  if (isBooked)   btnClass = "btn btn-danger";  // booked
  if (isSelected) btnClass = "btn btn-success"; // selected

  return (
    <button
      className={`${btnClass} m-1`}
      onClick={() => !isBooked && onSeatClick(seat.seat_number)}
      disabled={isBooked}
      title={isBooked ? "Already Booked" : `Seat ${seat.seat_number} — ₹${seat.price || 0}`}
      style={{
        width:         50,
        height:        50,
        padding:       0,
        fontSize:      "0.68rem",
        fontWeight:    700,
        lineHeight:    1.3,
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
        justifyContent:"center",
        cursor:        isBooked ? "not-allowed" : "pointer",
      }}
    >
      {/* Seat number like 1A, 2B */}
      <span>{seat.seat_number}</span>

      {/* Price shown below seat number — only if available */}
      {!isBooked && (
        <span style={{ fontSize: "0.55rem", opacity: 0.85 }}>
          ₹{seat.price || 0}
        </span>
      )}

      {/* X mark if seat is booked */}
      {isBooked && (
        <span style={{ fontSize: "0.65rem" }}>✕</span>
      )}
    </button>
  );
};

export default NormalSeat;
