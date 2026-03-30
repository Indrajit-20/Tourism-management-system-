const mongoose = require("mongoose");
const Bus = require("../models/Bus");
const Staff = require("../models/Staff");

const DB_URI = "mongodb://localhost:27017/tms2";

const renamedBusNames = [
  "Shiv Shakti Travels",
  "Radhe Krishna Express",
  "Maa Ambe Roadlines",
  "Gujarat Veer Yatra",
  "Somnath Seva Coach",
  "Dwarkadhish Safar",
  "Sardar Patel Connect",
  "Girnar Divine Tours",
  "Akhand Bharat Ride",
  "Kutch Kesari Lines",
  "Shreenath Premium Bus",
  "Adhyatmik Journey",
  "Bhakti Path Transport",
  "Rajdhani Gujarat Cruise",
  "Navkar Darshan Coach",
  "Jay Mataji Route",
  "Sahyog City Rider",
  "Rann Utsav Traveller",
  "Shree Ganesh Highway",
  "Ahmedabad Heritage Bus",
];

const newRouteBusTemplates = [
  {
    bus_number: "GJ-01-RB-1211",
    bus_name: "Trishul City Connect",
    bus_category: "route",
    bus_type: "AC",
    total_seats: 44,
    status: "Active",
  },
  {
    bus_number: "GJ-01-RB-1212",
    bus_name: "Narayan Route Express",
    bus_category: "route",
    bus_type: "Non-AC",
    total_seats: 50,
    status: "Active",
  },
];

async function main() {
  await mongoose.connect(DB_URI);

  const existingBuses = await Bus.find().sort({ bus_number: 1 });

  if (!existingBuses.length) {
    throw new Error("No buses found to rename");
  }

  const renameOps = existingBuses.map((bus, index) => ({
    updateOne: {
      filter: { _id: bus._id },
      update: {
        $set: {
          bus_name: renamedBusNames[index] || `Gujarat Bus ${index + 1}`,
        },
      },
    },
  }));

  await Bus.bulkWrite(renameOps, { ordered: true });

  const allBusesAfterRename = await Bus.find().select("driver_ids driver_id bus_number");
  const usedDriverIds = new Set();

  allBusesAfterRename.forEach((bus) => {
    (bus.driver_ids || []).forEach((id) => usedDriverIds.add(String(id)));
    if (bus.driver_id) {
      usedDriverIds.add(String(bus.driver_id));
    }
  });

  const freeDrivers = await Staff.find({ designation: "driver" })
    .sort({ name: 1 })
    .select("_id name")
    .lean();

  const unassignedDrivers = freeDrivers.filter(
    (driver) => !usedDriverIds.has(String(driver._id)),
  );

  if (unassignedDrivers.length < 2) {
    throw new Error(
      `Need 2 unassigned drivers, but found ${unassignedDrivers.length}`,
    );
  }

  const addOps = newRouteBusTemplates.map((bus, index) => {
    const driverId = unassignedDrivers[index]._id;
    return {
      updateOne: {
        filter: { bus_number: bus.bus_number },
        update: {
          $set: {
            bus_name: bus.bus_name,
            bus_category: bus.bus_category,
            bus_type: bus.bus_type,
            total_seats: bus.total_seats,
            status: bus.status,
            driver_ids: [driverId],
            driver_id: driverId,
          },
        },
        upsert: true,
      },
    };
  });

  const addResult = await Bus.bulkWrite(addOps, { ordered: true });

  const finalBuses = await Bus.find()
    .populate("driver_ids", "name")
    .sort({ bus_number: 1 });

  console.log("Renamed buses:", existingBuses.length);
  console.log("Added route buses:", addResult.upsertedCount || 0);
  console.log("Total buses now:", finalBuses.length);
  console.table(
    finalBuses.map((bus) => ({
      bus_number: bus.bus_number,
      bus_name: bus.bus_name,
      category: bus.bus_category,
      type: bus.bus_type,
      seats: bus.total_seats,
      drivers: (bus.driver_ids || []).map((d) => d.name).join(", "),
    })),
  );

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("Bus refresh failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
