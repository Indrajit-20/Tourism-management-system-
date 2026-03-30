const mongoose = require("mongoose");
const State = require("../models/State");
const City = require("../models/City");
const Hotel = require("../models/Hotel");

const DB_URI = "mongodb://localhost:27017/tms2";

const hotelsSeed = [
  { name: "Sabarmati Residency", state: "Gujarat", city: "Ahmedabad", location: "Ashram Road", hotel_type: "Business", status: "Active" },
  { name: "Surat Grand Stay", state: "Gujarat", city: "Surat", location: "Adajan", hotel_type: "3-Star", status: "Active" },
  { name: "Rajkot Royal Inn", state: "Gujarat", city: "Rajkot", location: "Yagnik Road", hotel_type: "Luxury", status: "Active" },
  { name: "Goa Beach Crown", state: "Goa", city: "Panaji", location: "Miramar", hotel_type: "Resort", status: "Active" },
  { name: "Coastal Breeze Resort", state: "Goa", city: "Margao", location: "Colva Road", hotel_type: "Resort", status: "Active" },
  { name: "Kashmir Valley Retreat", state: "Jammu and Kashmir", city: "Srinagar", location: "Dal Lake Road", hotel_type: "Premium", status: "Active" },
  { name: "Jammu Heritage Hotel", state: "Jammu and Kashmir", city: "Jammu", location: "Residency Road", hotel_type: "4-Star", status: "Active" },
  { name: "Pink City Palace Stay", state: "Rajasthan", city: "Jaipur", location: "MI Road", hotel_type: "Heritage", status: "Active" },
  { name: "Lakeview Udaipur Inn", state: "Rajasthan", city: "Udaipur", location: "Fateh Sagar", hotel_type: "Boutique", status: "Active" },
  { name: "Mumbai Central Suites", state: "Maharashtra", city: "Mumbai", location: "Dadar", hotel_type: "Business", status: "Active" },
  { name: "Pune Elite Residency", state: "Maharashtra", city: "Pune", location: "Shivajinagar", hotel_type: "3-Star", status: "Active" },
  { name: "Shimla Snowline Resort", state: "Himachal Pradesh", city: "Shimla", location: "Mall Road", hotel_type: "Resort", status: "Active" },
  { name: "Manali Mountain Nest", state: "Himachal Pradesh", city: "Manali", location: "Old Manali", hotel_type: "Resort", status: "Active" },
  { name: "Rishikesh River Stay", state: "Uttarakhand", city: "Rishikesh", location: "Tapovan", hotel_type: "Retreat", status: "Active" },
  { name: "Haridwar Divine Lodge", state: "Uttarakhand", city: "Haridwar", location: "Har Ki Pauri", hotel_type: "Budget", status: "Active" },
  { name: "Bengaluru Tech Park Inn", state: "Karnataka", city: "Bengaluru", location: "Whitefield", hotel_type: "Business", status: "Active" },
  { name: "Mysuru Heritage Homes", state: "Karnataka", city: "Mysuru", location: "Sayyaji Rao Road", hotel_type: "Heritage", status: "Active" },
  { name: "Kochi Harbour Residency", state: "Kerala", city: "Kochi", location: "Marine Drive", hotel_type: "4-Star", status: "Active" },
  { name: "Chennai Bay View", state: "Tamil Nadu", city: "Chennai", location: "Marina", hotel_type: "Premium", status: "Active" },
  { name: "Delhi Capital Comfort", state: "Delhi", city: "New Delhi", location: "Connaught Place", hotel_type: "Business", status: "Active" },
];

async function seedHotels() {
  await mongoose.connect(DB_URI);

  let insertedOrUpdated = 0;
  let skipped = 0;

  for (const item of hotelsSeed) {
    const stateDoc = await State.findOne({ state_name: item.state }).lean();
    if (!stateDoc) {
      skipped += 1;
      continue;
    }

    const cityDoc = await City.findOne({ city_name: item.city, state_id: stateDoc._id }).lean();
    if (!cityDoc) {
      skipped += 1;
      continue;
    }

    await Hotel.findOneAndUpdate(
      { name: item.name, city_id: cityDoc._id },
      {
        $set: {
          state_id: stateDoc._id,
          city_id: cityDoc._id,
          location: item.location,
          hotel_type: item.hotel_type,
          description: `${item.hotel_type} hotel in ${item.city}, ${item.state}`,
          status: item.status || "Active",
        },
      },
      { upsert: true, new: true },
    );

    insertedOrUpdated += 1;
  }

  const totalHotels = await Hotel.countDocuments();
  console.log("Hotel seed complete");
  console.log("Inserted/Updated:", insertedOrUpdated);
  console.log("Skipped (missing state/city):", skipped);
  console.log("Total hotels in DB:", totalHotels);

  await mongoose.disconnect();
}

seedHotels().catch(async (error) => {
  console.error("Hotel seed failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
