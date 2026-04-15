import { normalize, toTitle } from "./bookingConfig";

const firstNonEmpty = (...values) => {
  for (const value of values) {
    if (value) return value;
  }
  return "";
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const firstArray = (...values) => {
  for (const value of values) {
    if (Array.isArray(value) && value.length > 0) return value;
  }
  return [];
};

const detectAcFromText = (value) => {
  const text = String(value || "")
    .toLowerCase()
    .trim();
  if (!text) return false;

  if (/non\s*-?\s*ac|without\s*ac/.test(text)) return false;
  if (/\bac\b|air\s*conditioned/.test(text)) return true;

  return false;
};

const detectLayoutFromText = (value) => {
  const text = String(value || "")
    .toLowerCase()
    .trim();
  if (!text) return "";
  if (text.includes("double") || text.includes("decker"))
    return "double_decker";
  if (text.includes("sleeper")) return "sleeper";
  if (text.includes("seater")) return "seater";
  return "";
};

const toBusTypeLabel = (value, acFlag) => {
  const text = String(value || "").trim();
  if (/non\s*-?\s*ac|without\s*ac/i.test(text)) return "Non-AC";
  if (/\bac\b|air\s*conditioned/i.test(text)) return "AC";
  if (typeof acFlag === "boolean") return acFlag ? "AC" : "Non-AC";
  return text || "-";
};

const toLayoutLabel = (value) => {
  const key = String(value || "")
    .trim()
    .toLowerCase();
  if (!key) return "-";
  if (key === "double_decker") return "Double Decker";
  if (key === "seater") return "Seater";
  if (key === "sleeper") return "Sleeper";
  return key
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const toMinutes = (value) => {
  const text = String(value || "")
    .trim()
    .toUpperCase();
  if (!text) return null;

  const hhmm = text.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmm) {
    const hour = Number(hhmm[1]);
    const minute = Number(hhmm[2]);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return hour * 60 + minute;
    }
    return null;
  }

  const ampm = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!ampm) return null;

  let hour = Number(ampm[1]);
  const minute = Number(ampm[2]);
  const marker = ampm[3];

  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
  hour = hour % 12;
  if (marker === "PM") hour += 12;
  return hour * 60 + minute;
};

const deriveDuration = (rawDuration, departure, arrival) => {
  if (rawDuration && String(rawDuration).trim()) return rawDuration;

  const dep = toMinutes(departure);
  const arr = toMinutes(arrival);
  if (dep === null || arr === null) return "-";

  const totalMinutes = arr >= dep ? arr - dep : 24 * 60 - dep + arr;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
};

const mapPassengers = (raw) => {
  let passengers = firstArray(
    raw.passengers,
    raw.passenger_details,
    raw.passengerDetails
  );

  passengers = passengers.map((item, index) => ({
    name:
      item?.name ||
      item?.passenger_name ||
      item?.full_name ||
      `Passenger ${index + 1}`,
    age: item?.age ?? "-",
    gender: item?.gender || "-",
    seat:
      item?.seat ||
      item?.seat_number ||
      (Array.isArray(raw.seat_numbers) ? raw.seat_numbers[index] : undefined),
  }));

  if (
    passengers.length === 0 &&
    Array.isArray(raw.other_travelers) &&
    raw.other_travelers.length > 0
  ) {
    passengers = raw.other_travelers.map((name, index) => ({
      name: name || `Passenger ${index + 1}`,
      age: "-",
      gender: "-",
      seat: Array.isArray(raw.seat_numbers)
        ? raw.seat_numbers[index]
        : undefined,
    }));
  }

  return passengers;
};

const mapBusInfo = (raw) => {
  const scheduleBus = raw.tour_schedule_id?.bus_id || {};

  const busTypeRaw = firstNonEmpty(
    raw.busType,
    scheduleBus.bus_type,
    raw.trip_id?.bus_id?.bus_type,
    raw.package_id?.transport,
    raw.Package_id?.transport
  );

  const layoutRaw = firstNonEmpty(
    raw.layoutType,
    raw.layout_type,
    scheduleBus.layout_type,
    raw.trip_id?.bus_id?.layout_type,
    detectLayoutFromText(raw.transport),
    detectLayoutFromText(raw.package_id?.transport),
    detectLayoutFromText(raw.Package_id?.transport),
    detectLayoutFromText(busTypeRaw)
  );

  const busName = firstNonEmpty(
    raw.busName,
    scheduleBus.bus_name,
    raw.trip_id?.bus_id?.bus_name,
    "-"
  );

  const busNo = firstNonEmpty(
    raw.busNo,
    scheduleBus.bus_number,
    raw.trip_id?.bus_id?.bus_number,
    "-"
  );

  const transport = toLayoutLabel(
    layoutRaw ||
      raw.transport ||
      raw.package_id?.transport ||
      raw.Package_id?.transport
  );
  const busAC =
    typeof raw.busAC === "boolean"
      ? raw.busAC
      : detectAcFromText(
          busTypeRaw ||
            raw.transport ||
            raw.package_id?.transport ||
            raw.Package_id?.transport
        );
  const busType = toBusTypeLabel(busTypeRaw, busAC);

  return { transport, busType, busName, busNo, busAC };
};

export const toUiBooking = (raw) => {
  // 1) Identify booking type
  const typeText = normalize(raw.type || raw.booking_type || raw.mode);
  const looksLikeTour =
    Boolean(raw.package_id || raw.Package_id || raw.tour_schedule_id) &&
    !Boolean(raw.trip_id);
  const type =
    typeText === "tour" || typeText === "package" || looksLikeTour
      ? "tour"
      : "bus";

  // 2) Base status fields
  const status = raw.booking_status || raw.status || "Pending";
  const paymentStatus = raw.paymentStatus || raw.payment_status || "Pending";

  // 3) Journey fields
  const startDate =
    raw.startDate || raw.tour_schedule_id?.start_date || raw.travel_date;
  const endDate = raw.endDate || raw.tour_schedule_id?.end_date || null;

  const fromCity =
    raw.from ||
    raw.package_id?.source_city ||
    raw.Package_id?.source_city ||
    raw.trip_id?.schedule_id?.route_id?.boarding_from;
  const toCity =
    raw.to ||
    raw.package_id?.destination ||
    raw.Package_id?.destination ||
    raw.trip_id?.schedule_id?.route_id?.destination;

  const departure = firstNonEmpty(
    raw.departure,
    raw.tour_schedule_id?.departure_time,
    raw.trip_id?.schedule_id?.departure_time
  );

  const arrival = firstNonEmpty(
    raw.arrival,
    raw.trip_id?.schedule_id?.arrival_time
  );

  // 4) Bus display fields (transport, AC type, bus name/no)
  const { transport, busType, busName, busNo, busAC } = mapBusInfo(raw);

  // 5) Hotel text for tour bookings
  const hotelNames = Array.isArray(
    raw.package_id?.hotels || raw.Package_id?.hotels
  )
    ? (raw.package_id?.hotels || raw.Package_id?.hotels)
        .map((hotel) => hotel?.name || hotel?.hotel_name)
        .filter(Boolean)
        .join(", ")
    : "";

  // 6) Passenger list + seat/traveller fallbacks
  let passengers = mapPassengers(raw);

  const seatCount = Array.isArray(raw.seat_numbers)
    ? raw.seat_numbers.length
    : Array.isArray(raw.seats)
    ? raw.seats.length
    : 0;

  const travellers = Number(
    raw.travellers ||
      raw.traveler_count ||
      raw.traveller_count ||
      raw.passenger_count ||
      passengers.length ||
      seatCount ||
      0
  );

  if (passengers.length === 0 && (travellers > 0 || seatCount > 0)) {
    const fallbackCount = Math.max(travellers, seatCount);
    passengers = Array.from({ length: fallbackCount }, (_, index) => ({
      name: `Passenger ${index + 1}`,
      age: "-",
      gender: "-",
      seat: Array.isArray(raw.seat_numbers)
        ? raw.seat_numbers[index]
        : undefined,
    }));
  }

  const seats = Array.isArray(raw.seats)
    ? raw.seats
    : Array.isArray(raw.seat_numbers)
    ? raw.seat_numbers
    : [];

  // 7) Duration from raw value, else auto-calculate from times
  const resolvedDuration = deriveDuration(
    raw.duration ||
      raw.package_id?.duration ||
      raw.Package_id?.duration ||
      raw.trip_id?.duration ||
      raw.trip_id?.schedule_id?.duration ||
      raw.trip_id?.schedule_id?.route_id?.duration,
    departure,
    arrival
  );

  return {
    _id: raw._id,
    type,
    status: toTitle(status),
    paymentStatus: toTitle(paymentStatus),
    name:
      raw.name ||
      raw.package_id?.package_name ||
      raw.Package_id?.package_name ||
      `${fromCity || "-"} → ${toCity || "-"}`,
    from: fromCity || "-",
    to: toCity || "-",
    startDate,
    endDate,
    duration: resolvedDuration,
    departure,
    arrival,
    busAC,
    transport,
    busName,
    busType,
    busNo,
    pickup:
      raw.pickup ||
      raw.pickup_location ||
      raw.trip_id?.schedule_id?.route_id?.board_point ||
      "-",
    drop:
      raw.drop ||
      raw.trip_id?.schedule_id?.route_id?.drop_point ||
      toCity ||
      "-",
    bookedOn: raw.bookedOn || raw.createdAt || raw.booking_date,
    paymentDeadline: raw.paymentDeadline || raw.payment_deadline || null,
    pricePerPerson:
      raw.pricePerPerson || raw.price_per_person || raw.price_per_seat || 0,
    totalPaid: raw.totalPaid || raw.total_amount || 0,
    travellers,
    passengers,
    seats,
    inclusions: Array.isArray(raw.inclusions) ? raw.inclusions : [],
    hotel:
      raw.hotel ||
      raw.Package_id?.hotel_name ||
      raw.Package_id?.hotel ||
      hotelNames ||
      "",
  };
};
