const isSleeperBus = (busType) => /sleeper/i.test(String(busType || ""));
const isDoubleDeckerBus = (busType) =>
  /double\s*-?\s*decker/i.test(String(busType || ""));

const resolveLayoutType = ({ layoutType, busType }) => {
  const normalized = String(layoutType || "")
    .trim()
    .toLowerCase();
  if (
    ["seater", "seater_2x2", "sleeper", "double_decker"].includes(normalized)
  ) {
    return normalized;
  }

  if (isSleeperBus(busType)) return "sleeper";
  if (isDoubleDeckerBus(busType)) return "double_decker";
  return "seater";
};

const buildSeatLayout = ({
  totalSeats,
  layoutType,
  busType,
  basePrice = 0,
  includeAvailability = false,
  includeBookingFields = false,
}) => {
  const seats = [];
  const count = Number(totalSeats) || 0;
  const price = Number(basePrice) || 0;
  const resolvedLayoutType = resolveLayoutType({ layoutType, busType });

  if (count <= 0) return seats;

  if (resolvedLayoutType === "sleeper") {
    const upperCount = Math.ceil(count / 2);
    const lowerCount = count - upperCount;

    for (let i = 1; i <= upperCount; i += 1) {
      const seat = {
        seat_number: `U${i}`,
        row: Math.ceil(i / 2),
        column: i % 2 === 0 ? 2 : 1,
        type: "sleeper",
        price,
      };
      if (includeAvailability) seat.is_available = true;
      if (includeBookingFields) {
        seat.is_booked = false;
        seat.booked_by = null;
      }
      seats.push(seat);
    }

    for (let i = 1; i <= lowerCount; i += 1) {
      const seat = {
        seat_number: `L${i}`,
        row: Math.ceil(i / 2),
        column: i % 2 === 0 ? 2 : 1,
        type: "sleeper",
        price,
      };
      if (includeAvailability) seat.is_available = true;
      if (includeBookingFields) {
        seat.is_booked = false;
        seat.booked_by = null;
      }
      seats.push(seat);
    }

    return seats;
  }

  if (resolvedLayoutType === "double_decker") {
    const upperCount = Math.ceil(count / 2);
    const lowerCount = count - upperCount;

    const pushDeckSeats = (prefix, deckCount) => {
      for (let i = 1; i <= deckCount; i += 1) {
        const col = ((i - 1) % 4) + 1;
        const seat = {
          seat_number: `${prefix}${i}`,
          row: Math.ceil(i / 4),
          column: col,
          type: col === 1 || col === 4 ? "window" : "aisle",
          price,
        };
        if (includeAvailability) seat.is_available = true;
        if (includeBookingFields) {
          seat.is_booked = false;
          seat.booked_by = null;
        }
        seats.push(seat);
      }
    };

    pushDeckSeats("U", upperCount);
    pushDeckSeats("L", lowerCount);
    return seats;
  }

  // Choose 5 seats per row (2x3) normally, but 4 seats per row for 2x2.
  const seatsPerRow = resolvedLayoutType === "seater_2x2" ? 4 : 5;

  for (let i = 1; i <= count; i += 1) {
    const col = ((i - 1) % seatsPerRow) + 1;
    const seat = {
      seat_number: `S${i}`,
      row: Math.ceil(i / seatsPerRow),
      column: col,
      type: col === 1 || col === seatsPerRow ? "window" : "aisle",
      price,
    };
    if (includeAvailability) seat.is_available = true;
    if (includeBookingFields) {
      seat.is_booked = false;
      seat.booked_by = null;
    }
    seats.push(seat);
  }

  return seats;
};

const buildSeatNumbers = (totalSeats, layoutType, busType) =>
  buildSeatLayout({ totalSeats, layoutType, busType }).map(
    (seat) => seat.seat_number
  );

module.exports = {
  isSleeperBus,
  isDoubleDeckerBus,
  resolveLayoutType,
  buildSeatLayout,
  buildSeatNumbers,
};
