import React from "react";
import NormalSeat from "./NormalSeat";
import SleeperSeat from "./SleeperSeat";

// BusLayout.jsx
// AC / Non-AC = 4 seats per row (2 + aisle + 2)
// Sleeper     = Upper deck + Lower deck (like redBus)

const BusLayout = ({
  seatLayout,
  bookedSeats,
  selectedSeats,
  onSeatClick,
  busType,
  layoutType,
}) => {
  const normalizedLayoutType = String(layoutType || "").toLowerCase();
  const isSleeper =
    normalizedLayoutType === "sleeper" ||
    /sleeper/i.test(String(busType || ""));
  const isDoubleDecker =
    normalizedLayoutType === "double_decker" ||
    /double\s*-?\s*decker/i.test(String(busType || ""));
  const hasDeckPrefix = seatLayout.some((seat) => {
    const number = String(seat?.seat_number || "").toUpperCase();
    return number.startsWith("U") || number.startsWith("L");
  });

  // ─────────────────────────────────────────────
  // NORMAL BUS LAYOUT (AC / Non-AC)
  // Same as your original — no changes
  // ─────────────────────────────────────────────
  const rows = [...new Set(seatLayout.map((s) => s.row))].sort((a, b) => a - b);
  const cols = [...new Set(seatLayout.map((s) => s.column))].sort(
    (a, b) => a - b
  );
  const seatMap = new Map(seatLayout.map((s) => [`${s.row}-${s.column}`, s]));

  // Splitting bus layout into 2 on left, rest (e.g. 3) on right
  const is3x2Layout = cols.length > 4;
  const splitIndex = is3x2Layout ? 2 : Math.ceil(cols.length / 2);
  const leftCols = cols.slice(0, splitIndex);
  const rightCols = cols.slice(splitIndex);

  // Render one normal seat
  const renderNormalSeat = (row, col) => {
    const seat = seatMap.get(`${row}-${col}`);
    if (!seat)
      return (
        <div
          key={`empty-${row}-${col}`}
          style={{ width: 50, height: 50, margin: 4, display: "inline-block" }}
        />
      );
    const isBooked = bookedSeats.includes(seat.seat_number);
    const isSelected = selectedSeats.includes(seat.seat_number);
    return (
      <NormalSeat
        key={seat.seat_number}
        seat={seat}
        isBooked={isBooked}
        isSelected={isSelected}
        onSeatClick={onSeatClick}
      />
    );
  };

  const renderNormalSeatFromMap = (row, col, map, keyPrefix = "") => {
    const seat = map.get(`${row}-${col}`);
    if (!seat) {
      return (
        <div
          key={`${keyPrefix}empty-${row}-${col}`}
          style={{ width: 50, height: 50, margin: 4, display: "inline-block" }}
        />
      );
    }
    const isBooked = bookedSeats.includes(seat.seat_number);
    const isSelected = selectedSeats.includes(seat.seat_number);
    return (
      <NormalSeat
        key={`${keyPrefix}${seat.seat_number}`}
        seat={seat}
        isBooked={isBooked}
        isSelected={isSelected}
        onSeatClick={onSeatClick}
      />
    );
  };

  // ─────────────────────────────────────────────
  // SLEEPER BUS LAYOUT
  // Split seats into Upper deck and Lower deck
  // Upper deck = odd rows (1, 3, 5...)
  // Lower deck = even rows (2, 4, 6...)
  // ─────────────────────────────────────────────

  // Split all sleeper seats into upper and lower deck
  // Upper deck seats have seat numbers starting with "U" — e.g. U1, U2
  // Lower deck seats have seat numbers starting with "L" — e.g. L1, L2
  // If no U/L prefix — split by row (first half = upper, second half = lower)
  const upperSeats = seatLayout.filter(
    (s) => s.seat_number?.startsWith("U") || s.type === "upper"
  );
  const lowerSeats = seatLayout.filter(
    (s) => s.seat_number?.startsWith("L") || s.type === "lower"
  );

  // If no U/L prefix — split rows in half
  const halfRows = Math.ceil(rows.length / 2);
  const upperRows = rows.slice(0, halfRows);
  const lowerRows = rows.slice(halfRows);

  // Use U/L split if available, otherwise use row split
  const hasULPrefix = upperSeats.length > 0 || lowerSeats.length > 0;

  // Get rows for a specific deck
  const getDeckRows = (deckSeats) => {
    return [...new Set(deckSeats.map((s) => s.row))].sort((a, b) => a - b);
  };

  // Get cols for a specific deck
  const getDeckCols = (deckSeats) => {
    return [...new Set(deckSeats.map((s) => s.column))].sort((a, b) => a - b);
  };

  // Render one sleeper berth
  const renderSleeperSeat = (row, col, deckSeatMap) => {
    const seat = deckSeatMap.get(`${row}-${col}`);
    if (!seat)
      return (
        <div
          key={`empty-${row}-${col}`}
          style={{
            width: 120,
            height: 42,
            margin: "3px 4px",
            display: "inline-block",
          }}
        />
      );
    const isBooked = bookedSeats.includes(seat.seat_number);
    const isSelected = selectedSeats.includes(seat.seat_number);
    return (
      <SleeperSeat
        key={seat.seat_number}
        seat={seat}
        isBooked={isBooked}
        isSelected={isSelected}
        onSeatClick={onSeatClick}
      />
    );
  };

  // Render a full deck section (Upper or Lower)
  const renderDeck = (deckLabel, deckRows, deckSeatMap, deckCols) => {
    const deckHalf = Math.ceil(deckCols.length / 2);
    const deckLeftCols = deckCols.slice(0, deckHalf);
    const deckRightCols = deckCols.slice(deckHalf);

    return (
      <div className="mb-3">
        {/* Deck label — like redBus "Upper" / "Lower" on left side */}
        <div className="d-flex align-items-stretch">
          {/* Deck label vertical text */}
          <div
            className="d-flex align-items-center justify-content-center text-muted me-2"
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "1px",
              minWidth: 20,
              color: "#888",
            }}
          >
            {deckLabel}
          </div>

          {/* Deck seat grid */}
          <div
            className="flex-grow-1 p-3 rounded"
            style={{ background: "#f0f2f5" }}
          >
            <div className="d-flex justify-content-center align-items-start">
              {/* Left side berths */}
              <div className="me-2">
                {deckRows.map((row) => (
                  <div key={`${deckLabel}-left-${row}`} className="d-flex">
                    {deckLeftCols.map((col) =>
                      renderSleeperSeat(row, col, deckSeatMap)
                    )}
                  </div>
                ))}
              </div>

              {/* Aisle */}
              <div
                style={{
                  width: 2,
                  alignSelf: "stretch",
                  borderLeft: "2px dashed #ccc",
                  minHeight: 40,
                  marginTop: 4,
                }}
              />

              {/* Right side berths */}
              <div className="ms-2">
                {deckRows.map((row) => (
                  <div key={`${deckLabel}-right-${row}`} className="d-flex">
                    {deckRightCols.map((col) =>
                      renderSleeperSeat(row, col, deckSeatMap)
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSeaterDeck = (deckLabel, deckRows, deckSeatMap, deckCols) => {
    // Similarly update splitting for multiple decks, using 2 seats on the left side.
    const is3x2LayoutDeck = deckCols.length > 4;
    const splitIndex = is3x2LayoutDeck ? 2 : Math.ceil(deckCols.length / 2);
    const deckLeftCols = deckCols.slice(0, splitIndex);
    const deckRightCols = deckCols.slice(splitIndex);

    return (
      <div className="mb-3">
        <div className="d-flex align-items-stretch">
          <div
            className="d-flex align-items-center justify-content-center text-muted me-2"
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "1px",
              minWidth: 20,
              color: "#888",
            }}
          >
            {deckLabel}
          </div>

          <div
            className="flex-grow-1 p-3 rounded"
            style={{ background: "#f0f2f5" }}
          >
            <div className="d-flex justify-content-center align-items-start">
              <div className="me-3">
                {deckRows.map((row) => (
                  <div key={`${deckLabel}-left-${row}`} className="d-flex">
                    {deckLeftCols.map((col) =>
                      renderNormalSeatFromMap(
                        row,
                        col,
                        deckSeatMap,
                        `${deckLabel}-left-`
                      )
                    )}
                  </div>
                ))}
              </div>

              <div
                style={{
                  width: 2,
                  alignSelf: "stretch",
                  borderLeft: "2px dashed #ccc",
                  minHeight: 40,
                  marginTop: 4,
                }}
              />

              <div className="ms-3">
                {deckRows.map((row) => (
                  <div key={`${deckLabel}-right-${row}`} className="d-flex">
                    {deckRightCols.map((col) =>
                      renderNormalSeatFromMap(
                        row,
                        col,
                        deckSeatMap,
                        `${deckLabel}-right-`
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="bg-light p-4 rounded shadow-sm border">
      {/* Driver section */}
      <div className="text-center mb-3 pb-2 border-bottom">
        <span className="badge bg-dark px-3 py-2 me-2">🚗 Driver</span>
        <span
          className={`badge ${
            isSleeper
              ? "bg-primary"
              : isDoubleDecker
              ? "bg-warning text-dark"
              : "bg-secondary"
          }`}
        >
          {isSleeper
            ? "🛏 Sleeper Bus"
            : isDoubleDecker
            ? "🚌 Double Decker"
            : "🪑 Seater Bus"}
        </span>
      </div>

      {/* ── SLEEPER BUS — Upper + Lower deck ── */}
      {isSleeper ? (
        <div>
          {hasULPrefix ? (
            // If seats have U/L prefix
            <>
              {upperSeats.length > 0 &&
                renderDeck(
                  "Upper",
                  getDeckRows(upperSeats),
                  new Map(upperSeats.map((s) => [`${s.row}-${s.column}`, s])),
                  getDeckCols(upperSeats)
                )}
              <div className="border-top my-3" />
              {lowerSeats.length > 0 &&
                renderDeck(
                  "Lower",
                  getDeckRows(lowerSeats),
                  new Map(lowerSeats.map((s) => [`${s.row}-${s.column}`, s])),
                  getDeckCols(lowerSeats)
                )}
            </>
          ) : (
            // Split rows in half — upper = first half, lower = second half
            <>
              {renderDeck("Upper", upperRows, seatMap, cols)}
              <div className="border-top my-3" />
              {renderDeck("Lower", lowerRows, seatMap, cols)}
            </>
          )}
        </div>
      ) : isDoubleDecker || hasDeckPrefix ? (
        <div>
          {hasULPrefix ? (
            <>
              {upperSeats.length > 0 &&
                renderSeaterDeck(
                  "Upper",
                  getDeckRows(upperSeats),
                  new Map(upperSeats.map((s) => [`${s.row}-${s.column}`, s])),
                  getDeckCols(upperSeats)
                )}
              <div className="border-top my-3" />
              {lowerSeats.length > 0 &&
                renderSeaterDeck(
                  "Lower",
                  getDeckRows(lowerSeats),
                  new Map(lowerSeats.map((s) => [`${s.row}-${s.column}`, s])),
                  getDeckCols(lowerSeats)
                )}
            </>
          ) : (
            <>
              {renderSeaterDeck("Upper", upperRows, seatMap, cols)}
              <div className="border-top my-3" />
              {renderSeaterDeck("Lower", lowerRows, seatMap, cols)}
            </>
          )}
        </div>
      ) : (
        // ── NORMAL BUS — same as original ──
        <div className="d-flex justify-content-center align-items-start">
          <div className="me-3">
            {rows.map((row) => (
              <div key={`left-${row}`} className="d-flex">
                {leftCols.map((col) => renderNormalSeat(row, col))}
              </div>
            ))}
          </div>
          <div
            style={{
              width: 2,
              alignSelf: "stretch",
              borderLeft: "2px dashed #ccc",
              minHeight: 40,
              marginTop: 4,
            }}
          />
          <div className="ms-3">
            {rows.map((row) => (
              <div key={`right-${row}`} className="d-flex">
                {rightCols.map((col) => renderNormalSeat(row, col))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Color Legend — same as original */}
      <div className="d-flex justify-content-center gap-3 mt-3 pt-3 border-top flex-wrap">
        <div className="d-flex align-items-center gap-1">
          <div
            style={{
              width: 28,
              height: 20,
              background: "#fff",
              border: "1px solid #dee2e6",
              borderLeft: "4px solid #dee2e6",
              borderRadius: 4,
            }}
          />
          <small className="text-muted">Available</small>
        </div>
        <div className="d-flex align-items-center gap-1">
          <div
            style={{
              width: 28,
              height: 20,
              background: "#e8f5e9",
              border: "1px solid #198754",
              borderLeft: "4px solid #198754",
              borderRadius: 4,
            }}
          />
          <small className="text-muted">Selected</small>
        </div>
        <div className="d-flex align-items-center gap-1">
          <div
            style={{
              width: 28,
              height: 20,
              background: "#f0f0f0",
              border: "1px solid #dee2e6",
              borderLeft: "4px solid #e91e8c",
              borderRadius: 4,
            }}
          />
          <small className="text-muted">Booked</small>
        </div>
      </div>

      {/* Pricing hint */}
      <div className="text-center mt-2">
        <small className="text-muted">
          💡 Front rows = higher price &nbsp;·&nbsp; Middle rows = normal
          &nbsp;·&nbsp; Back rows = lower price
          {isSleeper && " · Sleeper +30% premium"}
        </small>
      </div>

      {/* Seat count — same as original */}
      <div className="text-center mt-2 pt-2 border-top">
        <small>
          Total: <strong>{seatLayout.length}</strong>
          &nbsp;|&nbsp; Booked:{" "}
          <strong className="text-danger">{bookedSeats.length}</strong>
          &nbsp;|&nbsp; Available:{" "}
          <strong className="text-success">
            {seatLayout.length - bookedSeats.length}
          </strong>
        </small>
      </div>
    </div>
  );
};

export default BusLayout;
