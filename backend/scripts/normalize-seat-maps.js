const mongoose = require("mongoose");
require("../models/Bus");
require("../models/BusSchedule");
require("../models/BusRoute");
const BusTrip = require("../models/BusTrip");
const TourSchedule = require("../models/TourSchedule");
const { buildSeatLayout } = require("../utils/seatLayoutHelper");

const DB_URI = "mongodb://localhost:27017/tms2";

async function normalizeBusTrips() {
  const trips = await BusTrip.find({})
    .populate("bus_id", "bus_type layout_type total_seats")
    .populate({ path: "schedule_id", populate: { path: "route_id", select: "price_per_seat" } });

  let updated = 0;

  for (const trip of trips) {
    if (!trip.bus_id || !trip.bus_id.total_seats) continue;

    const basePrice =
      Number(trip.schedule_id?.base_price) ||
      Number(trip.schedule_id?.route_id?.price_per_seat) ||
      Number(trip.seats?.[0]?.price) ||
      0;

    const freshLayout = buildSeatLayout({
      totalSeats: Number(trip.bus_id.total_seats),
      layoutType: trip.bus_id.layout_type,
      busType: trip.bus_id.bus_type,
      basePrice,
      includeAvailability: true,
    });

    const availabilityMap = new Map(
      (trip.seats || []).map((seat) => [String(seat.seat_number).toUpperCase(), Boolean(seat.is_available)]),
    );

    const mergedSeats = freshLayout.map((seat) => {
      const key = String(seat.seat_number).toUpperCase();
      if (availabilityMap.has(key)) {
        return { ...seat, is_available: availabilityMap.get(key) };
      }
      return seat;
    });

    trip.seats = mergedSeats;
    await trip.save();
    updated += 1;
  }

  return updated;
}

async function normalizeTourSchedules() {
  const schedules = await TourSchedule.find({}).populate("bus_id", "bus_type layout_type total_seats");
  let updated = 0;

  for (const schedule of schedules) {
    const totalSeats = Number(schedule.total_seats || schedule.bus_id?.total_seats || 0);
    if (!totalSeats) continue;

    const basePrice = Number(schedule.price ?? schedule.price_per_person ?? 0);

    const freshLayout = buildSeatLayout({
      totalSeats,
      layoutType: schedule.bus_id?.layout_type,
      busType: schedule.bus_id?.bus_type,
      basePrice,
      includeBookingFields: true,
    });

    const bookingMap = new Map(
      (schedule.seats || []).map((seat) => [
        String(seat.seat_number).toUpperCase(),
        {
          is_booked: Boolean(seat.is_booked),
          booked_by: seat.booked_by || null,
        },
      ]),
    );

    const mergedSeats = freshLayout.map((seat) => {
      const key = String(seat.seat_number).toUpperCase();
      const bookedData = bookingMap.get(key);
      if (bookedData) {
        return {
          ...seat,
          is_booked: bookedData.is_booked,
          booked_by: bookedData.booked_by,
        };
      }
      return seat;
    });

    schedule.seats = mergedSeats;
    schedule.total_seats = totalSeats;
    schedule.available_seats = mergedSeats.filter((seat) => !seat.is_booked).length;
    await schedule.save();
    updated += 1;
  }

  return updated;
}

async function main() {
  await mongoose.connect(DB_URI);

  const [tripUpdated, scheduleUpdated] = await Promise.all([
    normalizeBusTrips(),
    normalizeTourSchedules(),
  ]);

  console.log("Seat map normalization complete");
  console.log("Bus trips updated:", tripUpdated);
  console.log("Tour schedules updated:", scheduleUpdated);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("Normalization failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
