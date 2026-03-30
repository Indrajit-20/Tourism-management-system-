const mongoose = require("mongoose");
const Staff = require("../models/Staff");
const Bus = require("../models/Bus");

const DB_URI = "mongodb://localhost:27017/tms2";

const busPlan = [
  // 6 Route buses: exactly 1 driver each, mix of AC / Non-AC / Sleeper
  {
    bus_category: "route",
    bus_number: "GJ-01-ZX-1101",
    bus_name: "Sabarmati CityLine",
    bus_type: "AC",
    layout_type: "seater",
    total_seats: 40,
    driver_count: 1,
  },
  {
    bus_category: "route",
    bus_number: "GJ-01-ZX-1102",
    bus_name: "Narmada Janpath",
    bus_type: "Non-AC",
    layout_type: "seater",
    total_seats: 52,
    driver_count: 1,
  },
  {
    bus_category: "route",
    bus_number: "GJ-01-ZX-1103",
    bus_name: "Giriraj SleeperLink",
    bus_type: "Sleeper",
    layout_type: "sleeper",
    total_seats: 30,
    driver_count: 1,
  },
  {
    bus_category: "route",
    bus_number: "GJ-05-ZX-1104",
    bus_name: "Akshardham Roadways",
    bus_type: "AC",
    layout_type: "seater",
    total_seats: 40,
    driver_count: 1,
  },
  {
    bus_category: "route",
    bus_number: "GJ-05-ZX-1105",
    bus_name: "Gujarat Lokseva",
    bus_type: "Non-AC",
    layout_type: "seater",
    total_seats: 52,
    driver_count: 1,
  },
  {
    bus_category: "route",
    bus_number: "GJ-05-ZX-1106",
    bus_name: "Shreenath Sleeper",
    bus_type: "Sleeper",
    layout_type: "sleeper",
    total_seats: 30,
    driver_count: 1,
  },

  // 6 Tour buses: exactly 2 drivers each, mix of AC / Non-AC
  {
    bus_category: "tour",
    bus_number: "GJ-18-TY-2101",
    bus_name: "Dwarka Darshan",
    bus_type: "AC",
    layout_type: "seater",
    total_seats: 36,
    driver_count: 2,
  },
  {
    bus_category: "tour",
    bus_number: "GJ-18-TY-2102",
    bus_name: "Somnath Shakti",
    bus_type: "Non-AC",
    layout_type: "seater",
    total_seats: 40,
    driver_count: 2,
  },
  {
    bus_category: "tour",
    bus_number: "GJ-27-TY-2103",
    bus_name: "Ambaji Yatra",
    bus_type: "AC",
    layout_type: "seater",
    total_seats: 36,
    driver_count: 2,
  },
  {
    bus_category: "tour",
    bus_number: "GJ-27-TY-2104",
    bus_name: "Girnar Parikrama",
    bus_type: "Non-AC",
    layout_type: "seater",
    total_seats: 40,
    driver_count: 2,
  },
  {
    bus_category: "tour",
    bus_number: "GJ-06-TY-2105",
    bus_name: "Vaishno Shraddha",
    bus_type: "AC",
    layout_type: "seater",
    total_seats: 36,
    driver_count: 2,
  },
  {
    bus_category: "tour",
    bus_number: "GJ-06-TY-2106",
    bus_name: "Sardar Safar",
    bus_type: "Non-AC",
    layout_type: "seater",
    total_seats: 40,
    driver_count: 2,
  },
];

const pickDrivers = (driverIds, cursor, count) => {
  const selected = [];
  for (let i = 0; i < count; i += 1) {
    selected.push(driverIds[(cursor + i) % driverIds.length]);
  }
  return selected;
};

async function seedBuses() {
  await mongoose.connect(DB_URI);

  const drivers = await Staff.find({ designation: "driver" })
    .sort({ name: 1 })
    .select("_id name email_id");

  if (drivers.length < 12) {
    throw new Error(`At least 12 drivers are required, found ${drivers.length}`);
  }

  const driverIds = drivers.map((driver) => driver._id);
  let driverCursor = 0;

  const ops = busPlan.map((bus) => {
    const assignedDrivers = pickDrivers(driverIds, driverCursor, bus.driver_count);
    driverCursor += bus.driver_count;

    return {
      updateOne: {
        filter: { bus_number: bus.bus_number },
        update: {
          $set: {
            bus_category: bus.bus_category,
            bus_name: bus.bus_name,
            bus_type: bus.bus_type,
            layout_type: bus.layout_type,
            total_seats: bus.total_seats,
            driver_ids: assignedDrivers,
            driver_id: assignedDrivers[0],
            status: "Active",
          },
          $setOnInsert: {
            bus_number: bus.bus_number,
          },
        },
        upsert: true,
      },
    };
  });

  const result = await Bus.bulkWrite(ops, { ordered: true });

  const insertedBuses = await Bus.find({
    bus_number: { $in: busPlan.map((item) => item.bus_number) },
  })
    .populate("driver_ids", "name designation")
    .sort({ bus_number: 1 });

  console.log("Bus seed complete");
  console.log("Inserted:", result.upsertedCount || 0);
  console.log("Modified:", result.modifiedCount || 0);
  console.log("Matched:", result.matchedCount || 0);
  console.log("Total targeted buses:", insertedBuses.length);

  console.table(
    insertedBuses.map((bus) => ({
      bus_number: bus.bus_number,
      bus_name: bus.bus_name,
      bus_type: bus.bus_type,
      total_seats: bus.total_seats,
      driver_count: bus.driver_ids?.length || 0,
      drivers: (bus.driver_ids || []).map((d) => d.name).join(", "),
    }))
  );

  await mongoose.disconnect();
}

seedBuses().catch(async (error) => {
  console.error("Bus seed failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors
  }
  process.exit(1);
});
