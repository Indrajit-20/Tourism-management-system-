const mongoose = require("mongoose");
const State = require("../models/State");
const City = require("../models/City");

const DB_URI = "mongodb://localhost:27017/tms2";

const stateCityMap = [
  {
    state_name: "Gujarat",
    cities: [
      "Ahmedabad",
      "Surat",
      "Vadodara",
      "Rajkot",
      "Bhavnagar",
      "Jamnagar",
      "Junagadh",
      "Gandhinagar",
      "Anand",
      "Mehsana",
    ],
  },
  {
    state_name: "Rajasthan",
    cities: ["Jaipur", "Udaipur", "Jodhpur", "Kota", "Ajmer", "Bikaner"],
  },
  {
    state_name: "Maharashtra",
    cities: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Kolhapur"],
  },
  {
    state_name: "Madhya Pradesh",
    cities: ["Indore", "Bhopal", "Gwalior", "Jabalpur", "Ujjain"],
  },
  {
    state_name: "Delhi",
    cities: ["New Delhi"],
  },
  {
    state_name: "Goa",
    cities: ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"],
  },
  {
    state_name: "Jammu and Kashmir",
    cities: ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Kupwara"],
  },
  {
    state_name: "Himachal Pradesh",
    cities: ["Shimla", "Manali", "Dharamshala", "Kullu", "Solan"],
  },
  {
    state_name: "Uttarakhand",
    cities: ["Dehradun", "Haridwar", "Rishikesh", "Nainital", "Mussoorie"],
  },
  {
    state_name: "Uttar Pradesh",
    cities: ["Lucknow", "Varanasi", "Agra", "Prayagraj", "Kanpur"],
  },
  {
    state_name: "Karnataka",
    cities: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi"],
  },
  {
    state_name: "Kerala",
    cities: ["Kochi", "Thiruvananthapuram", "Kozhikode", "Alappuzha", "Thrissur"],
  },
  {
    state_name: "Tamil Nadu",
    cities: ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli"],
  },
  {
    state_name: "Punjab",
    cities: ["Amritsar", "Ludhiana", "Jalandhar", "Patiala", "Bathinda"],
  },
  {
    state_name: "Haryana",
    cities: ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal"],
  },
  {
    state_name: "West Bengal",
    cities: ["Kolkata", "Siliguri", "Durgapur", "Howrah", "Darjeeling"],
  },
  {
    state_name: "Bihar",
    cities: ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga"],
  },
  {
    state_name: "Odisha",
    cities: ["Bhubaneswar", "Cuttack", "Puri", "Rourkela", "Sambalpur"],
  },
  {
    state_name: "Andhra Pradesh",
    cities: ["Visakhapatnam", "Vijayawada", "Tirupati", "Kurnool", "Nellore"],
  },
  {
    state_name: "Telangana",
    cities: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
  },
];

async function seed() {
  await mongoose.connect(DB_URI);

  let stateCount = 0;
  let cityCount = 0;

  for (const entry of stateCityMap) {
    const stateDoc = await State.findOneAndUpdate(
      { state_name: entry.state_name },
      { $set: { status: "Active" } },
      { new: true, upsert: true },
    );

    stateCount += 1;

    for (const cityName of entry.cities) {
      await City.findOneAndUpdate(
        { city_name: cityName, state_id: stateDoc._id },
        {
          $set: {
            state_id: stateDoc._id,
            state: stateDoc.state_name,
            description: `${cityName}, ${stateDoc.state_name}`,
          },
        },
        { upsert: true },
      );
      cityCount += 1;
    }
  }

  const totalStates = await State.countDocuments();
  const totalCities = await City.countDocuments();

  console.log("State/City seed complete");
  console.log("Processed states:", stateCount);
  console.log("Processed cities:", cityCount);
  console.log("Total states in DB:", totalStates);
  console.log("Total cities in DB:", totalCities);

  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error("Seed failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
