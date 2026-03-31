const fs = require("fs/promises");
const path = require("path");
const mongoose = require("mongoose");

require("../models/City");
require("../models/State");
const Staff = require("../models/Staff");
const Hotel = require("../models/Hotel");
const Package = require("../models/Package");

const MONGO_URI = "mongodb://localhost:27017/tms2";
const uploadsDir = path.join(__dirname, "..", "uploads", "packages");

const packagePlans = [
  {
    package_name: "Kashmir Valley Signature Escape",
    package_type: "Premium Nature",
    source_city: "Ahmedabad",
    destination: "Srinagar - Gulmarg - Pahalgam",
    duration: "6 Days / 5 Nights",
    description:
      "A premium Kashmir holiday with shikara views, meadow day tours, and curated evening experiences.",
    sightseeing: [
      "Dal Lake",
      "Nishat Bagh",
      "Gulmarg Gondola",
      "Betaab Valley",
      "Aru Valley",
    ],
    itinerary:
      "Day 1 Srinagar check-in and houseboat sunset. Day 2 Mughal gardens and old city walk. Day 3 Gulmarg excursion with gondola. Day 4 Pahalgam valley exploration. Day 5 shopping and cultural evening. Day 6 departure.",
    inclusive:
      "3-star/4-star stays, breakfast and dinner, airport transfers, local sightseeing, tour guide support",
    exclusive:
      "Airfare, lunch, personal shopping, pony rides, optional adventure activities",
    hotelKeywords: ["Srinagar", "Jammu", "Kashmir"],
    boardingPoint: "Iskcon Cross Road, SG Highway, Ahmedabad",
    imageFile: "packages/kashmir-valley-signature.svg",
    imageTitle: "Kashmir Valley",
    imageSubTitle: "Premium Nature Escape",
  },
  {
    package_name: "Goa Coastal Leisure Break",
    package_type: "Beach Leisure",
    source_city: "Ahmedabad",
    destination: "North Goa - South Goa",
    duration: "5 Days / 4 Nights",
    description:
      "A beach-focused Goa break with sunset cruises, local cafes, and relaxed coastal exploration.",
    sightseeing: [
      "Miramar Beach",
      "Baga Beach",
      "Fort Aguada",
      "Dona Paula",
      "Colva Beach",
    ],
    itinerary:
      "Day 1 arrival and beachside check-in. Day 2 North Goa beaches and fort circuit. Day 3 old churches and local market trail. Day 4 South Goa leisure and sunset cruise. Day 5 departure.",
    inclusive:
      "Hotel stay, breakfast, private transfers, guided city and beach sightseeing",
    exclusive:
      "Airfare, watersports, entry fees for optional shows, personal expenses",
    hotelKeywords: ["Panaji", "Margao", "Goa", "Colva"],
    boardingPoint: "Shivranjani Cross Road, Satellite, Ahmedabad",
    imageFile: "packages/goa-coastal-leisure.svg",
    imageTitle: "Goa Coastal",
    imageSubTitle: "Sunset and Beaches",
  },
  {
    package_name: "Rajasthan Royal Heritage Circuit",
    package_type: "Culture and Heritage",
    source_city: "Ahmedabad",
    destination: "Jaipur - Udaipur",
    duration: "5 Days / 4 Nights",
    description:
      "A royal Rajasthan itinerary featuring palaces, lakes, bazaars, and curated heritage walks.",
    sightseeing: [
      "Amber Fort",
      "City Palace Jaipur",
      "Hawa Mahal",
      "Lake Pichola",
      "City Palace Udaipur",
    ],
    itinerary:
      "Day 1 Jaipur arrival and evening market visit. Day 2 Amber Fort and palace circuit. Day 3 transfer to Udaipur with enroute stops. Day 4 lake city tour and cultural show. Day 5 departure.",
    inclusive:
      "Comfort hotels, breakfast, sightseeing vehicle, local guide support",
    exclusive:
      "Lunch and dinner, monument camera fees, shopping, personal activities",
    hotelKeywords: ["Jaipur", "Udaipur", "Rajasthan"],
    boardingPoint: "Nehrunagar Circle, Ahmedabad",
    imageFile: "packages/rajasthan-royal-heritage.svg",
    imageTitle: "Rajasthan Royal",
    imageSubTitle: "Heritage Circuit",
  },
  {
    package_name: "Himachal Snow and Valley Retreat",
    package_type: "Mountain Retreat",
    source_city: "Ahmedabad",
    destination: "Shimla - Manali",
    duration: "6 Days / 5 Nights",
    description:
      "A scenic mountain retreat covering pine valleys, snow viewpoints, and curated hill-town stays.",
    sightseeing: [
      "Mall Road Shimla",
      "Kufri",
      "Solang Valley",
      "Hadimba Temple",
      "Old Manali",
    ],
    itinerary:
      "Day 1 Shimla arrival and local orientation. Day 2 Kufri and town highlights. Day 3 transfer to Manali. Day 4 Solang Valley and adventure window. Day 5 local heritage spots. Day 6 departure.",
    inclusive:
      "Hotel stay, breakfast and dinner, private transfers, sightseeing assistance",
    exclusive:
      "Airfare, adventure rides, heater charges, personal spends",
    hotelKeywords: ["Shimla", "Manali", "Himachal"],
    boardingPoint: "Paldi Cross Road, Ahmedabad",
    imageFile: "packages/himachal-snow-retreat.svg",
    imageTitle: "Himachal Snow",
    imageSubTitle: "Valley Retreat",
  },
  {
    package_name: "Uttarakhand Spiritual Serenity Tour",
    package_type: "Spiritual and Wellness",
    source_city: "Ahmedabad",
    destination: "Haridwar - Rishikesh",
    duration: "4 Days / 3 Nights",
    description:
      "A spiritual and wellness journey with Ganga aarti, yoga-focused mornings, and sacred town visits.",
    sightseeing: [
      "Har Ki Pauri",
      "Mansa Devi Temple",
      "Laxman Jhula",
      "Ram Jhula",
      "Ganga Aarti Rishikesh",
    ],
    itinerary:
      "Day 1 Haridwar check-in and evening aarti. Day 2 temple circuit and transfer to Rishikesh. Day 3 yoga session and riverfront exploration. Day 4 departure.",
    inclusive:
      "Hotel stay, breakfast, private transfers, guide for temple circuits",
    exclusive:
      "Airfare, ropeway tickets, donations, wellness add-ons",
    hotelKeywords: ["Rishikesh", "Haridwar", "Uttarakhand"],
    boardingPoint: "CTM Expressway Pickup Point, Ahmedabad",
    imageFile: "packages/uttarakhand-spiritual-serenity.svg",
    imageTitle: "Uttarakhand",
    imageSubTitle: "Spiritual Serenity",
  },
  {
    package_name: "South India Heritage and Coastline Trail",
    package_type: "Explorer Special",
    source_city: "Ahmedabad",
    destination: "Bengaluru - Mysuru - Kochi - Chennai",
    duration: "7 Days / 6 Nights",
    description:
      "A multi-city South India trail combining heritage landmarks, waterfront drives, and curated city experiences.",
    sightseeing: [
      "Bangalore Palace",
      "Mysore Palace",
      "Kochi Marine Drive",
      "Fort Kochi",
      "Marina Beach",
    ],
    itinerary:
      "Day 1 Bengaluru arrival and city highlights. Day 2 transfer to Mysuru and palace visit. Day 3 Kochi transfer and waterfront evening. Day 4 Fort Kochi heritage circuit. Day 5 Chennai transfer. Day 6 Marina and cultural zones. Day 7 departure.",
    inclusive:
      "Hotel stays, breakfast, intercity transport, sightseeing support",
    exclusive:
      "Airfare, monument tickets, lunch and dinner, personal activities",
    hotelKeywords: ["Bengaluru", "Mysuru", "Kochi", "Chennai", "South"],
    boardingPoint: "Sabarmati Railway Station Pickup Zone, Ahmedabad",
    imageFile: "packages/south-india-heritage-trail.svg",
    imageTitle: "South India",
    imageSubTitle: "Heritage Trail",
  },
];

const pickHotels = (allHotels, keywords, fallbackStart = 0) => {
  const list = allHotels.filter((hotel) => {
    const text = `${hotel.name || ""} ${hotel.location || ""} ${hotel.city || ""}`.toLowerCase();
    return keywords.some((k) => text.includes(String(k).toLowerCase()));
  });

  if (list.length >= 2) return list.slice(0, 3);

  const fallback = allHotels.slice(fallbackStart, fallbackStart + 3);
  return fallback.length ? fallback : allHotels.slice(0, 3);
};

const makeSvg = (title, subtitle) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b3d91"/>
      <stop offset="55%" stop-color="#0f766e"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <circle cx="1040" cy="160" r="120" fill="#ffffff" fill-opacity="0.12"/>
  <circle cx="220" cy="620" r="170" fill="#ffffff" fill-opacity="0.08"/>
  <rect x="90" y="440" width="1100" height="180" rx="18" fill="#000000" fill-opacity="0.28"/>
  <text x="130" y="520" font-size="64" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-weight="700">${title}</text>
  <text x="132" y="570" font-size="30" fill="#e5f2ff" font-family="Segoe UI, Arial, sans-serif">${subtitle}</text>
  <text x="132" y="612" font-size="24" fill="#d8e8ff" font-family="Segoe UI, Arial, sans-serif">Curated by Tourism Management System</text>
</svg>
`;

const run = async () => {
  await mongoose.connect(MONGO_URI);

  const guides = await Staff.find({ designation: /guide/i })
    .sort({ name: 1 })
    .select("_id name designation")
    .lean();

  if (guides.length < 6) {
    throw new Error(`Expected at least 6 guides, found ${guides.length}`);
  }

  const hotelsRaw = await Hotel.find()
    .populate("city_id", "city_name")
    .select("_id name location city_id")
    .lean();

  const hotels = hotelsRaw.map((h) => ({
    _id: h._id,
    name: h.name,
    location: h.location,
    city: h.city_id?.city_name || "",
  }));

  if (!hotels.length) {
    throw new Error("No hotels found. Please seed hotels first.");
  }

  await fs.mkdir(uploadsDir, { recursive: true });

  const summary = [];

  for (let i = 0; i < packagePlans.length; i += 1) {
    const plan = packagePlans[i];
    const guide = guides[i];
    const selectedHotels = pickHotels(hotels, plan.hotelKeywords, i * 2).slice(0, 6);

    const imagePath = path.join(__dirname, "..", "uploads", plan.imageFile);
    await fs.writeFile(imagePath, makeSvg(plan.imageTitle, plan.imageSubTitle), "utf8");

    const payload = {
      package_name: plan.package_name,
      package_type: plan.package_type,
      source_city: plan.source_city,
      destination: plan.destination,
      duration: plan.duration,
      description: plan.description,
      hotels: selectedHotels.map((h) => h._id),
      tour_guide: guide._id,
      boarding_points: [plan.boardingPoint],
      pickup_points: [plan.boardingPoint],
      sightseeing: plan.sightseeing,
      itinerary: plan.itinerary,
      inclusive: plan.inclusive,
      exclusive: plan.exclusive,
      status: "Active",
      image_urls: [plan.imageFile],
    };

    const doc = await Package.findOneAndUpdate(
      { package_name: plan.package_name },
      payload,
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    summary.push({
      package_name: doc.package_name,
      guide: guide.name,
      hotels: selectedHotels.map((h) => h.name),
      boarding_point: plan.boardingPoint,
      image: plan.imageFile,
    });
  }

  console.log("Seeded realistic tour packages successfully.");
  console.log(JSON.stringify(summary, null, 2));
};

run()
  .then(async () => {
    await mongoose.disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    try {
      await mongoose.disconnect();
    } catch (_) {
      // ignore
    }
    process.exit(1);
  });
