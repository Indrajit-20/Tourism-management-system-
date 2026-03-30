const mongoose = require("mongoose");
const Bus = require("../models/Bus");

const DB_URI = "mongodb://localhost:27017/tms2";

const inferLayoutType = (busType) => {
  const text = String(busType || "").toLowerCase();
  if (/sleeper/.test(text)) return "sleeper";
  if (/double\s*-?\s*decker/.test(text)) return "double_decker";
  return "seater";
};

async function main() {
  await mongoose.connect(DB_URI);

  const rawBuses = await Bus.find({})
    .select("_id bus_type layout_type")
    .lean();

  const operations = rawBuses
    .map((bus) => {
      const inferred = inferLayoutType(bus.bus_type);
      const current = String(bus.layout_type || "").trim().toLowerCase();
      if (current === inferred) return null;

      return {
        updateOne: {
          filter: { _id: bus._id },
          update: { $set: { layout_type: inferred } },
        },
      };
    })
    .filter(Boolean);

  if (operations.length > 0) {
    await Bus.bulkWrite(operations, { ordered: false });
  }

  const updated = operations.length;

  const summary = await Bus.find({})
    .select("bus_number bus_name bus_type layout_type")
    .sort({ bus_number: 1 })
    .lean();

  console.log("Bus layout_type migration complete");
  console.log("Total buses:", summary.length);
  console.log("Updated buses:", updated);
  console.table(
    summary.map((bus) => ({
      bus_number: bus.bus_number,
      bus_name: bus.bus_name,
      bus_type: bus.bus_type,
      layout_type: bus.layout_type,
    })),
  );

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("Migration failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
