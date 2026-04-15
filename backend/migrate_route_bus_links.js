const mongoose = require("mongoose");
const BusRoute = require("./models/BusRoute");
const BusSchedule = require("./models/BusSchedule");

const run = async () => {
  await mongoose.connect("mongodb://localhost:27017/tms2");

  const schedules = await BusSchedule.find({}, "route_id bus_id").lean();
  const routeToBus = new Map();

  for (const s of schedules) {
    if (s.route_id && s.bus_id && !routeToBus.has(String(s.route_id))) {
      routeToBus.set(String(s.route_id), s.bus_id);
    }
  }

  let updated = 0;
  for (const [routeId, busId] of routeToBus) {
    const route = await BusRoute.findById(routeId).lean();
    if (route && (!route.bus_id || String(route.bus_id) !== String(busId))) {
      await BusRoute.findByIdAndUpdate(routeId, { bus_id: busId });
      updated += 1;
    }
  }

  const totalRoutes = await BusRoute.countDocuments();
  const assignedRoutes = await BusRoute.countDocuments({
    bus_id: { $ne: null },
  });

  console.log(
    JSON.stringify(
      {
        updated,
        totalRoutes,
        assignedRoutes,
        unassignedRoutes: totalRoutes - assignedRoutes,
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
