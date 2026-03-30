const mongoose = require("mongoose");
const Custmer = require("../models/Custmer");
const Staff = require("../models/Staff");
const { toDMY } = require("../utils/dobHelper");

const DB_URI = "mongodb://localhost:27017/tms2";

async function migrateCollection(Model, collectionName) {
  const docs = await Model.find({}, "dob").lean();
  let updated = 0;
  let skipped = 0;

  for (const doc of docs) {
    const normalizedDob = toDMY(doc.dob);
    if (!normalizedDob) {
      skipped += 1;
      continue;
    }

    await Model.updateOne({ _id: doc._id }, { $set: { dob: normalizedDob } });
    updated += 1;
  }

  console.log(`${collectionName} migrated`);
  console.log("Updated:", updated);
  console.log("Skipped:", skipped);
}

async function migrateDobFormat() {
  await mongoose.connect(DB_URI);

  await migrateCollection(Custmer, "Custmer");
  await migrateCollection(Staff, "Staff");

  await mongoose.disconnect();
}

migrateDobFormat().catch(async (error) => {
  console.error("DOB migration failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors
  }
  process.exit(1);
});
