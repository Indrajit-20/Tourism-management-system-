const mongoose = require("mongoose");
const BusRoute = require("../models/BusRoute");

const DB_URI = "mongodb://localhost:27017/tms2";

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

async function normalizeRouteStopPoints() {
  await mongoose.connect(DB_URI);

  const routes = await BusRoute.find();
  let updated = 0;

  for (const route of routes) {
    const boardPoint = suggestBoardingPoint(route.boarding_from, route.board_point);
    const dropPoint = suggestDropPoint(route.destination, route.drop_point);

    await BusRoute.updateOne(
      { _id: route._id },
      {
        $set: {
          board_point: boardPoint,
          drop_point: dropPoint,
        },
      }
    );

    updated += 1;
  }

  const sample = await BusRoute.find()
    .sort({ route_name: 1, boarding_from: 1 })
    .limit(20)
    .select("route_name boarding_from board_point destination drop_point");

  console.log("Route stop points normalized");
  console.log("Updated routes:", updated);
  console.table(
    sample.map((r) => ({
      route_name: r.route_name,
      from_city: r.boarding_from,
      boarding_point: r.board_point,
      to_city: r.destination,
      drop_point: r.drop_point,
    }))
  );

  await mongoose.disconnect();
}

normalizeRouteStopPoints().catch(async (error) => {
  console.error("Normalize route stop points failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
