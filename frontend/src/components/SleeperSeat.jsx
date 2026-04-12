import React from "react";

// SleeperSeat.jsx
// Horizontal berth — wide like a bed
// User can clearly see it is a sleeping berth
// Driver direction shown at top in BusLayout

const SleeperSeat = ({ seat, isBooked, isSelected, onSeatClick }) => {

  let cardClass = "bg-white border";
  let textClass = "text-dark";
  let leftBar   = "#dee2e6";

  if (isBooked) {
    cardClass = "bg-light border";
    textClass = "text-muted";
    leftBar   = "#e91e8c";  // pink like redBus
  }

  if (isSelected) {
    cardClass = "bg-success bg-opacity-10 border border-success";
    textClass = "text-success fw-bold";
    leftBar   = "#198754";
  }

  return (
    <button
      className={`${cardClass} rounded m-1`}
      onClick={() => !isBooked && onSeatClick(seat.seat_number)}
      disabled={isBooked}
      title={isBooked ? "Already Booked" : `Berth ${seat.seat_number} — ₹${seat.price || 0}`}
      style={{
        // ✅ Wide and short — looks like a horizontal bed
        width:      130,
        height:     36,
        padding:    "0 8px",
        borderLeft: `4px solid ${leftBar}`,
        borderRadius: 6,
        cursor:     isBooked ? "not-allowed" : "pointer",
        boxShadow:  "0 1px 3px rgba(0,0,0,0.08)",
        display:    "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Left — seat number */}
      <span className={textClass} style={{ fontSize: "0.7rem", fontWeight: 700 }}>
        {seat.seat_number}
      </span>

      {/* Right — price or booked */}
      {!isBooked ? (
        <span className={textClass} style={{ fontSize: "0.68rem", opacity: 0.85 }}>
          ₹{seat.price || 0}
        </span>
      ) : (
        <span className="text-muted" style={{ fontSize: "0.65rem" }}>Booked</span>
      )}
    </button>
  );
};

export default SleeperSeat;
