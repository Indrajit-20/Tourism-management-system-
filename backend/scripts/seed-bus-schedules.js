const mongoose = require("mongoose");
require("../models/Bus");
const BusRoute = require("../models/BusRoute");
const BusSchedule = require("../models/BusSchedule");

const DB_URI = "mongodb://localhost:27017/tms2";

const isVadodaraBhavnagarPair = (from, to) => {
  const a = String(from || "").trim().toLowerCase();
  const b = String(to || "").trim().toLowerCase();

  const isVado = (text) => text.includes("vadodara") || text.includes("vado");
  const isBhav = (text) => text.includes("bhavnagar") || text.includes("bav");

  return (isVado(a) && isBhav(b)) || (isBhav(a) && isVado(b));
};

const buildTitle = (route) => {
  if (route.route_name) return route.route_name;
  return `${route.boarding_from} to ${route.destination}`;
};

const findCityKey = (value) => {
  const text = String(value || "").trim().toLowerCase();
  if (text.includes("ahmedabad")) return "ahmedabad";
  if (text.includes("surat")) return "surat";
  if (text.includes("rajkot")) return "rajkot";
  if (text.includes("vadodara") || text.includes("vado")) return "vadodara";
  if (text.includes("bhavnagar") || text.includes("bav")) return "bhavnagar";
  return "";
};

const boardingPointByCity = {
  ahmedabad: "Maninagar",
  surat: "Udhna Darwaja",
  rajkot: "Madhapar Chowk",
  vadodara: "Central Bus Station",
  bhavnagar: "Nilambaug Circle",
};

const dropPointByCity = {
  ahmedabad: "Geeta Mandir Bus Stand",
  surat: "Surat Central Bus Stand",
  rajkot: "Raiya Circle",
  vadodara: "Vadodara Central Bus Stand",
  bhavnagar: "Bhavnagar Bus Depot",
};

const suggestBoardingPoint = (city, fallback) => {
  const key = findCityKey(city);
  return boardingPointByCity[key] || String(fallback || city || "").trim();
};

const suggestDropPoint = (city, fallback) => {
  const key = findCityKey(city);
  return dropPointByCity[key] || String(fallback || city || "").trim();
};

async function seedBusSchedules() {
  await mongoose.connect(DB_URI);

  const routes = await BusRoute.find({ status: "Active" })
    .populate("bus_id", "_id")
    .sort({ route_name: 1, boarding_from: 1, destination: 1 });

  if (!routes.length) {
    throw new Error("No active bus routes found. Seed routes first.");
  }

  let created = 0;
  let updated = 0;
  let removedDuplicates = 0;

  for (const route of routes) {
    const frequency = isVadodaraBhavnagarPair(route.boarding_from, route.destination)
      ? "Weekends"
      : "Daily";

    const payload = {
      title: buildTitle(route),
      route_id: route._id,
      bus_id: route.bus_id?._id || route.bus_id,
      departure_time: route.departure_time,
      arrival_time: route.arrival_time,
      frequency,
      days_of_week: [],
      boarding_points: [
        suggestBoardingPoint(route.boarding_from, route.board_point),
      ].filter(Boolean),
      drop_points: [
        suggestDropPoint(route.destination, route.drop_point),
      ].filter(Boolean),
      base_price: Number(route.price_per_seat || 0),
      status: "Active",
      driver_id: undefined,
    };

    const existingForRoute = await BusSchedule.find({ route_id: route._id }).sort({ createdAt: 1 });

    if (!existingForRoute.length) {
      await BusSchedule.create(payload);
      created += 1;
      continue;
    }

    const primary = existingForRoute[0];
    await BusSchedule.findByIdAndUpdate(primary._id, payload, { new: true });
    updated += 1;

    if (existingForRoute.length > 1) {
      const extraIds = existingForRoute.slice(1).map((s) => s._id);
      const deleteResult = await BusSchedule.deleteMany({ _id: { $in: extraIds } });
      removedDuplicates += deleteResult.deletedCount || 0;
    }
  }

  const totalSchedules = await BusSchedule.countDocuments();
  const weekendsCount = await BusSchedule.countDocuments({ frequency: "Weekends" });
  const dailyCount = await BusSchedule.countDocuments({ frequency: "Daily" });

  const sample = await BusSchedule.find()
    .populate("route_id", "boarding_from destination route_name")
    .sort({ title: 1 })
    .limit(20);

  console.log("Bus schedules seed complete");
  console.log("Created:", created);
  console.log("Updated:", updated);
  console.log("Removed duplicate schedules:", removedDuplicates);
  console.log("Total schedules:", totalSchedules);
  console.log("Daily:", dailyCount, "Weekends:", weekendsCount);
  console.table(
    sample.map((s) => ({
      title: s.title,
      from: s.route_id?.boarding_from || "-",
      to: s.route_id?.destination || "-",
      frequency: s.frequency,
      boarding_point: s.boarding_points?.[0] || "-",
      drop_point: s.drop_points?.[0] || "-",
      base_price: s.base_price,
    }))
  );

  await mongoose.disconnect();
}

seedBusSchedules().catch(async (error) => {
  console.error("Bus schedules seed failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
