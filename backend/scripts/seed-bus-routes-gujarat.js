const mongoose = require("mongoose");
const Bus = require("../models/Bus");
const BusRoute = require("../models/BusRoute");

const DB_URI = "mongodb://localhost:27017/tms2";

const gujaratRoutePlan = [
  {
    bus_number: "GJ-01-RB-1211",
    route_name: "Ahmedabad Rajkot Morning",
    boarding_from: "Ahmedabad",
    destination: "Rajkot",
    departure_time: "06:30 AM",
    arrival_time: "11:00 AM",
    price_per_seat: 450,
  },
  {
    bus_number: "GJ-01-RB-1212",
    route_name: "Rajkot Ahmedabad Evening",
    boarding_from: "Rajkot",
    destination: "Ahmedabad",
    departure_time: "04:00 PM",
    arrival_time: "08:30 PM",
    price_per_seat: 450,
  },
  {
    bus_number: "GJ-01-ZX-1103",
    route_name: "Ahmedabad Surat Express",
    boarding_from: "Ahmedabad",
    destination: "Surat",
    departure_time: "07:15 AM",
    arrival_time: "12:30 PM",
    price_per_seat: 420,
  },
  {
    bus_number: "GJ-05-ZX-1104",
    route_name: "Surat Ahmedabad Night",
    boarding_from: "Surat",
    destination: "Ahmedabad",
    departure_time: "06:30 PM",
    arrival_time: "11:45 PM",
    price_per_seat: 420,
  },
  {
    bus_number: "GJ-05-ZX-1105",
    route_name: "Vadodara Bhavnagar Route",
    boarding_from: "Vadodara",
    destination: "Bhavnagar",
    departure_time: "08:00 AM",
    arrival_time: "01:15 PM",
    price_per_seat: 390,
  },
  {
    bus_number: "GJ-05-ZX-1106",
    route_name: "Bhavnagar Vadodara Return",
    boarding_from: "Bhavnagar",
    destination: "Vadodara",
    departure_time: "03:45 PM",
    arrival_time: "09:00 PM",
    price_per_seat: 390,
  },
];

const oldRouteNamesToRemove = [
  "Ahmedabad Dwarka Darshan",
  "Dwarka Ahmedabad Return",
  "Somnath Junagadh Link",
  "Junagadh Somnath Link",
  "Ahmedabad Bhuj Route",
  "Bhuj Ahmedabad Route",
];

async function seedGujaratBusRoutes() {
  await mongoose.connect(DB_URI);

  const routeBuses = await Bus.find({ bus_category: "route", status: "Active" })
    .sort({ bus_number: 1 })
    .select("_id bus_number bus_name");

  if (!routeBuses.length) {
    throw new Error("No active route buses found. Please seed route buses first.");
  }

  const busMap = new Map(routeBuses.map((bus) => [bus.bus_number, bus]));

  if (oldRouteNamesToRemove.length) {
    await BusRoute.deleteMany({ route_name: { $in: oldRouteNamesToRemove } });
  }

  let processed = 0;

  for (let i = 0; i < gujaratRoutePlan.length; i += 1) {
    const routeData = gujaratRoutePlan[i];
    const selectedBus = busMap.get(routeData.bus_number) || routeBuses[i % routeBuses.length];

    await BusRoute.findOneAndUpdate(
      {
        route_name: routeData.route_name,
        boarding_from: routeData.boarding_from,
        destination: routeData.destination,
      },
      {
        $set: {
          bus_id: selectedBus._id,
          departure_time: routeData.departure_time,
          arrival_time: routeData.arrival_time,
          price_per_seat: routeData.price_per_seat,
          status: "Active",
        },
      },
      { upsert: true, new: true },
    );

    processed += 1;
  }

  const totalRoutes = await BusRoute.countDocuments();
  const sample = await BusRoute.find({
    route_name: { $in: gujaratRoutePlan.map((item) => item.route_name) },
  })
    .populate("bus_id", "bus_number bus_name bus_category")
    .sort({ route_name: 1 });

  console.log("Gujarat bus routes seed complete");
  console.log("Processed (inserted/updated):", processed);
  console.log("Total routes in DB:", totalRoutes);
  console.table(
    sample.map((row) => ({
      route_name: row.route_name,
      from: row.boarding_from,
      to: row.destination,
      bus_number: row.bus_id?.bus_number || "-",
      bus_category: row.bus_id?.bus_category || "-",
      departure_time: row.departure_time,
      arrival_time: row.arrival_time,
      price_per_seat: row.price_per_seat,
    })),
  );

  await mongoose.disconnect();
}

seedGujaratBusRoutes().catch(async (error) => {
  console.error("Gujarat routes seed failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors
  }
  process.exit(1);
});
