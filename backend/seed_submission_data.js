const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const State = require("./models/State");
const City = require("./models/City");
const Hotel = require("./models/Hotel");
const Staff = require("./models/Staff");
const Custmer = require("./models/Custmer");
const Bus = require("./models/Bus");
const BusRoute = require("./models/BusRoute");
const BusSchedule = require("./models/BusSchedule");
const BusTrip = require("./models/BusTrip");
const Package = require("./models/Package");
const TourSchedule = require("./models/TourSchedule");
const PackageBooking = require("./models/PackageBooking");
const BusTicketBooking = require("./models/BusTicketBooking");
const Passenger = require("./models/Passenger");
const Cancellation = require("./models/Cancellation");
const Refund = require("./models/Refund");
const Feedback = require("./models/Feedback");
const Invoice = require("./models/Invoice");

const DB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/tms2";
const EXPORT_DIR = path.join(__dirname, "data-export");
const LOGIN_PASSWORD = "Pass@123";

const dayMs = 24 * 60 * 60 * 1000;

const dmy = (date) => {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const atHour = (baseDate, hour, minute = 0) => {
  const d = new Date(baseDate);
  d.setHours(hour, minute, 0, 0);
  return d;
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const randomIndianMobile = (usedSet) => {
  const firstDigits = ["6", "7", "8", "9"];

  while (true) {
    const first = pick(firstDigits);
    const rest = String(rand(100000000, 999999999));
    const mobile = `${first}${rest}`;

    if (!usedSet.has(mobile)) {
      usedSet.add(mobile);
      return mobile;
    }
  }
};

const makeTourSeats = (totalSeats) => {
  const seats = [];
  const perRow = 4;
  const rowCount = Math.ceil(totalSeats / perRow);
  let idx = 0;

  for (let row = 1; row <= rowCount; row++) {
    for (let col = 1; col <= perRow; col++) {
      idx += 1;
      if (idx > totalSeats) break;
      seats.push({
        seat_number: `T${String(idx).padStart(2, "0")}`,
        row,
        column: col,
        type: "seat",
        is_booked: false,
        booked_by: null,
        price: 0,
      });
    }
  }

  return seats;
};

const makeBusTripSeats = (totalSeats, basePrice) => {
  const seats = [];
  const perRow = 4;
  const rowCount = Math.ceil(totalSeats / perRow);
  let idx = 0;

  for (let row = 1; row <= rowCount; row++) {
    for (let col = 1; col <= perRow; col++) {
      idx += 1;
      if (idx > totalSeats) break;

      const seatType = col === 1 || col === perRow ? "window" : "aisle";
      const surcharge = seatType === "window" ? 60 : 0;

      seats.push({
        seat_number: `B${String(idx).padStart(2, "0")}`,
        row,
        column: col,
        type: seatType,
        price: basePrice + surcharge,
        is_available: true,
      });
    }
  }

  return seats;
};

const toDateOnly = (d) => {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
};

const main = async () => {
  try {
    await mongoose.connect(DB_URI);
    console.log(`Connected to ${DB_URI}`);

    // Some old databases may still carry a legacy unique index on staffs.email_id.
    // Drop it so current schema (email) can seed cleanly.
    try {
      await Staff.collection.dropIndex("email_id_1");
      console.log("Dropped legacy index: staffs.email_id_1");
    } catch (indexError) {
      if (!String(indexError.message || "").includes("index not found")) {
        throw indexError;
      }
    }

    console.log("Cleaning old operational data...");
    await Promise.all([
      Refund.deleteMany({}),
      Cancellation.deleteMany({}),
      Feedback.deleteMany({}),
      Invoice.deleteMany({}),
      Passenger.deleteMany({}),
      BusTicketBooking.deleteMany({}),
      PackageBooking.deleteMany({}),
      BusTrip.deleteMany({}),
      BusSchedule.deleteMany({}),
      TourSchedule.deleteMany({}),
      BusRoute.deleteMany({}),
      Package.deleteMany({}),
      Hotel.deleteMany({}),
      Bus.deleteMany({}),
      Staff.deleteMany({}),
      Custmer.deleteMany({}),
      City.deleteMany({}),
      State.deleteMany({}),
    ]);

    const hash = await bcrypt.hash(LOGIN_PASSWORD, 10);

    const states = await State.insertMany([
      { state_name: "Gujarat", status: "Active" },
      { state_name: "Rajasthan", status: "Active" },
      { state_name: "Maharashtra", status: "Active" },
      { state_name: "Madhya Pradesh", status: "Active" },
    ]);
    const stateByName = Object.fromEntries(states.map((s) => [s.state_name, s]));

    const citySeed = [
      ["Ahmedabad", "Gujarat"],
      ["Surat", "Gujarat"],
      ["Vadodara", "Gujarat"],
      ["Rajkot", "Gujarat"],
      ["Dwarka", "Gujarat"],
      ["Udaipur", "Rajasthan"],
      ["Jaipur", "Rajasthan"],
      ["Jodhpur", "Rajasthan"],
      ["Mumbai", "Maharashtra"],
      ["Pune", "Maharashtra"],
      ["Nashik", "Maharashtra"],
      ["Indore", "Madhya Pradesh"],
      ["Bhopal", "Madhya Pradesh"],
      ["Omkareshwar", "Madhya Pradesh"],
    ];

    const cities = await City.insertMany(
      citySeed.map(([city_name, stateName]) => ({
        city_name,
        state_id: stateByName[stateName]._id,
        description: `${city_name} city operations hub`,
      }))
    );

    const cityByName = Object.fromEntries(cities.map((c) => [c.city_name, c]));

    const hotels = await Hotel.insertMany([
      {
        name: "Riverfront Residency",
        city_id: cityByName.Ahmedabad._id,
        state_id: stateByName.Gujarat._id,
        location: "Ashram Road",
        hotel_type: "4 Star",
        description: "Business and leisure stay near Sabarmati Riverfront",
      },
      {
        name: "Heritage Courtyard",
        city_id: cityByName.Udaipur._id,
        state_id: stateByName.Rajasthan._id,
        location: "Lake Pichola",
        hotel_type: "3 Star",
        description: "Lake view heritage hotel for group tours",
      },
      {
        name: "Pink City Grand",
        city_id: cityByName.Jaipur._id,
        state_id: stateByName.Rajasthan._id,
        location: "MI Road",
        hotel_type: "4 Star",
        description: "Preferred property for Jaipur departures",
      },
      {
        name: "Arabian Pearl",
        city_id: cityByName.Dwarka._id,
        state_id: stateByName.Gujarat._id,
        location: "Dwarkadhish Temple Road",
        hotel_type: "3 Star",
        description: "Pilgrimage-friendly stay",
      },
      {
        name: "Metro Harbor Stay",
        city_id: cityByName.Mumbai._id,
        state_id: stateByName.Maharashtra._id,
        location: "Andheri East",
        hotel_type: "4 Star",
        description: "Transit hotel for Mumbai connections",
      },
      {
        name: "Sahyadri Retreat",
        city_id: cityByName.Pune._id,
        state_id: stateByName.Maharashtra._id,
        location: "Shivajinagar",
        hotel_type: "3 Star",
        description: "Comfort stay for Pune/Nashik packages",
      },
      {
        name: "Statue Vista",
        city_id: cityByName.Vadodara._id,
        state_id: stateByName.Gujarat._id,
        location: "Alkapuri",
        hotel_type: "3 Star",
        description: "Convenient for Kevadia routes",
      },
      {
        name: "Royal Dunes",
        city_id: cityByName.Jodhpur._id,
        state_id: stateByName.Rajasthan._id,
        location: "Ratanada",
        hotel_type: "4 Star",
        description: "Popular for desert itinerary",
      },
      {
        name: "Malwa Heights",
        city_id: cityByName.Indore._id,
        state_id: stateByName["Madhya Pradesh"]._id,
        location: "Vijay Nagar",
        hotel_type: "3 Star",
        description: "Preferred MP circuit stay",
      },
      {
        name: "Narmada Serenity",
        city_id: cityByName.Omkareshwar._id,
        state_id: stateByName["Madhya Pradesh"]._id,
        location: "Temple Ghat Road",
        hotel_type: "3 Star",
        description: "Spiritual circuit group stay",
      },
    ]);

    const staffNames = [
      ["Rakesh Solanki", "driver"],
      ["Jignesh Parmar", "driver"],
      ["Imran Sheikh", "driver"],
      ["Ketan Patel", "driver"],
      ["Suresh Gohil", "driver"],
      ["Mahesh Chauhan", "driver"],
      ["Bhavesh Rathod", "driver"],
      ["Dilip Yadav", "driver"],
      ["Neha Trivedi", "guide"],
      ["Pooja Sharma", "guide"],
      ["Aarav Mehta", "guide"],
      ["Mansi Joshi", "guide"],
    ];

    const usedMobiles = new Set();
    const staffMobiles = staffNames.map(() => randomIndianMobile(usedMobiles));

    const staffDocs = await Staff.insertMany(
      staffNames.map(([name, designation], i) => ({
        name,
        designation,
        contact_no: staffMobiles[i],
        email: `${name.toLowerCase().replace(/\s+/g, "")}${i + 1}@gmail.com`,
        password: hash,
        dob: dmy(new Date(1982 + (i % 10), (i * 2) % 12, 8 + (i % 18))),
        address: `${rand(10, 88)}, ${pick(["Navrangpura", "Satellite", "Vastrapur", "Paldi", "Maninagar"])}, Ahmedabad`,
        driver_license:
          designation === "driver"
            ? `GJ01-${220000 + i}`
            : undefined,
        date_of_joining: dmy(new Date(2016 + (i % 8), (i * 3) % 12, 2 + (i % 20))),
        experience: `${4 + (i % 9)} years`,
      }))
    );

    const drivers = staffDocs.filter((s) => s.designation === "driver");
    const guides = staffDocs.filter((s) => s.designation === "guide");

    const buses = await Bus.insertMany([
      {
        bus_number: "GJ01BT1001",
        bus_name: "TMS Swiftline",
        bus_category: "route",
        bus_type: "AC Seater",
        layout_type: "seater",
        total_seats: 32,
      },
      {
        bus_number: "GJ01BT1002",
        bus_name: "TMS Highway King",
        bus_category: "route",
        bus_type: "Non-AC Seater",
        layout_type: "seater",
        total_seats: 30,
      },
      {
        bus_number: "GJ01BT1003",
        bus_name: "TMS Express Star",
        bus_category: "route",
        bus_type: "AC Sleeper",
        layout_type: "sleeper",
        total_seats: 28,
      },
      {
        bus_number: "GJ01BT1004",
        bus_name: "TMS Coastal Ride",
        bus_category: "route",
        bus_type: "AC Seater",
        layout_type: "seater",
        total_seats: 30,
      },
      {
        bus_number: "GJ01TT2001",
        bus_name: "TMS Tour Queen",
        bus_category: "tour",
        bus_type: "AC Seater",
        layout_type: "seater",
        total_seats: 30,
      },
      {
        bus_number: "GJ01TT2002",
        bus_name: "TMS Heritage Coach",
        bus_category: "tour",
        bus_type: "AC Seater",
        layout_type: "seater",
        total_seats: 32,
      },
      {
        bus_number: "GJ01TT2003",
        bus_name: "TMS Desert Runner",
        bus_category: "tour",
        bus_type: "AC Seater",
        layout_type: "seater",
        total_seats: 30,
      },
      {
        bus_number: "GJ01TT2004",
        bus_name: "TMS Pilgrim Special",
        bus_category: "tour",
        bus_type: "Non-AC Seater",
        layout_type: "seater",
        total_seats: 28,
      },
    ]);

    const routeBuses = buses.filter((b) => b.bus_category === "route");
    const tourBuses = buses.filter((b) => b.bus_category === "tour");

    const routeSeeds = [
      ["Ahmedabad to Surat", "Ahmedabad", "Surat"],
      ["Surat to Ahmedabad", "Surat", "Ahmedabad"],
      ["Ahmedabad to Rajkot", "Ahmedabad", "Rajkot"],
      ["Rajkot to Ahmedabad", "Rajkot", "Ahmedabad"],
      ["Vadodara to Mumbai", "Vadodara", "Mumbai"],
      ["Mumbai to Vadodara", "Mumbai", "Vadodara"],
      ["Ahmedabad to Udaipur", "Ahmedabad", "Udaipur"],
      ["Udaipur to Ahmedabad", "Udaipur", "Ahmedabad"],
    ];

    const routeBusMap = {
      "Ahmedabad to Surat": routeBuses[0]._id,
      "Surat to Ahmedabad": routeBuses[0]._id,
      "Ahmedabad to Rajkot": routeBuses[1]._id,
      "Rajkot to Ahmedabad": routeBuses[1]._id,
      "Vadodara to Mumbai": routeBuses[2]._id,
      "Mumbai to Vadodara": routeBuses[2]._id,
      "Ahmedabad to Udaipur": routeBuses[3]._id,
      "Udaipur to Ahmedabad": routeBuses[3]._id,
    };

    const routes = await BusRoute.insertMany(
      routeSeeds.map(([route_name, boarding_from, destination]) => ({
        route_name,
        bus_id: routeBusMap[route_name] || null,
        boarding_state_id: cityByName[boarding_from].state_id,
        boarding_city_id: cityByName[boarding_from]._id,
        boarding_from,
        destination_state_id: cityByName[destination].state_id,
        destination_city_id: cityByName[destination]._id,
        destination,
        status: "Active",
      }))
    );

    const routeByName = Object.fromEntries(routes.map((r) => [r.route_name, r]));

    const scheduleDocs = await BusSchedule.insertMany([
      {
        title: "Ahmedabad -> Surat Morning",
        route_id: routeByName["Ahmedabad to Surat"]._id,
        bus_id: routeBuses[0]._id,
        driver_id: drivers[0]._id,
        driver_ids: [drivers[0]._id],
        departure_time: "06:00",
        arrival_time: "11:00",
        frequency: "Daily",
        boarding_points: ["Nehrunagar"],
        drop_points: ["Kamrej"],
        base_price: 680,
      },
      {
        title: "Surat -> Ahmedabad Return",
        route_id: routeByName["Surat to Ahmedabad"]._id,
        bus_id: routeBuses[0]._id,
        driver_id: drivers[0]._id,
        driver_ids: [drivers[0]._id],
        departure_time: "14:00",
        arrival_time: "19:00",
        frequency: "Daily",
        boarding_points: ["Athwa"],
        drop_points: ["Narol"],
        base_price: 700,
      },
      {
        title: "Ahmedabad -> Rajkot Morning",
        route_id: routeByName["Ahmedabad to Rajkot"]._id,
        bus_id: routeBuses[1]._id,
        driver_id: drivers[1]._id,
        driver_ids: [drivers[1]._id],
        departure_time: "07:30",
        arrival_time: "12:30",
        frequency: "Daily",
        boarding_points: ["Geeta Mandir"],
        drop_points: ["Kuvadva"],
        base_price: 560,
      },
      {
        title: "Rajkot -> Ahmedabad Evening",
        route_id: routeByName["Rajkot to Ahmedabad"]._id,
        bus_id: routeBuses[1]._id,
        driver_id: drivers[2]._id,
        driver_ids: [drivers[2]._id],
        departure_time: "15:30",
        arrival_time: "20:30",
        frequency: "Daily",
        boarding_points: ["Raiya Circle"],
        drop_points: ["SG Highway"],
        base_price: 580,
      },
      {
        title: "Vadodara -> Mumbai Express",
        route_id: routeByName["Vadodara to Mumbai"]._id,
        bus_id: routeBuses[2]._id,
        driver_id: drivers[3]._id,
        driver_ids: [drivers[3]._id],
        departure_time: "22:00",
        arrival_time: "05:30",
        frequency: "Daily",
        boarding_points: ["Alkapuri"],
        drop_points: ["Borivali"],
        base_price: 980,
      },
      {
        title: "Mumbai -> Vadodara Day Return",
        route_id: routeByName["Mumbai to Vadodara"]._id,
        bus_id: routeBuses[2]._id,
        driver_id: drivers[4]._id,
        driver_ids: [drivers[4]._id],
        departure_time: "10:00",
        arrival_time: "17:30",
        frequency: "Daily",
        boarding_points: ["Andheri"],
        drop_points: ["Makarpura"],
        base_price: 960,
      },
      {
        title: "Ahmedabad -> Udaipur Morning",
        route_id: routeByName["Ahmedabad to Udaipur"]._id,
        bus_id: routeBuses[3]._id,
        driver_id: drivers[5]._id,
        driver_ids: [drivers[5]._id],
        departure_time: "05:45",
        arrival_time: "11:15",
        frequency: "Weekdays",
        boarding_points: ["RTO"],
        drop_points: ["Sukher"],
        base_price: 740,
      },
      {
        title: "Udaipur -> Ahmedabad Noon",
        route_id: routeByName["Udaipur to Ahmedabad"]._id,
        bus_id: routeBuses[3]._id,
        driver_id: drivers[6]._id,
        driver_ids: [drivers[6]._id],
        departure_time: "13:30",
        arrival_time: "19:00",
        frequency: "Weekdays",
        boarding_points: ["Udaipole"],
        drop_points: ["Sabarmati"],
        base_price: 760,
      },
    ]);

    scheduleDocs[0].return_schedule_id = scheduleDocs[1]._id;
    scheduleDocs[1].return_schedule_id = scheduleDocs[0]._id;
    scheduleDocs[2].return_schedule_id = scheduleDocs[3]._id;
    scheduleDocs[3].return_schedule_id = scheduleDocs[2]._id;
    await Promise.all(scheduleDocs.map((s) => s.save()));

    const today = toDateOnly(new Date());
    const tripDefs = [];

    for (let i = -3; i <= 3; i++) {
      tripDefs.push({
        schedule: scheduleDocs[0],
        bus: routeBuses[0],
        driver: drivers[0],
        date: new Date(today.getTime() + i * dayMs),
        isReturn: false,
      });
      tripDefs.push({
        schedule: scheduleDocs[1],
        bus: routeBuses[0],
        driver: drivers[0],
        date: new Date(today.getTime() + i * dayMs),
        isReturn: true,
      });
    }

    tripDefs.push(
      { schedule: scheduleDocs[2], bus: routeBuses[1], driver: drivers[1], date: new Date(today.getTime() - 2 * dayMs), isReturn: false },
      { schedule: scheduleDocs[3], bus: routeBuses[1], driver: drivers[2], date: new Date(today.getTime() + dayMs), isReturn: true },
      { schedule: scheduleDocs[4], bus: routeBuses[2], driver: drivers[3], date: new Date(today.getTime() + 2 * dayMs), isReturn: false },
      { schedule: scheduleDocs[5], bus: routeBuses[2], driver: drivers[4], date: new Date(today.getTime() + 3 * dayMs), isReturn: true },
      { schedule: scheduleDocs[6], bus: routeBuses[3], driver: drivers[5], date: new Date(today.getTime() + 4 * dayMs), isReturn: false },
      { schedule: scheduleDocs[7], bus: routeBuses[3], driver: drivers[6], date: new Date(today.getTime() + 5 * dayMs), isReturn: true }
    );

    const busTrips = [];
    for (const td of tripDefs) {
      const dateOnly = toDateOnly(td.date);
      const status = dateOnly < today ? "Completed" : "Scheduled";
      const basePrice = Number(td.schedule.base_price || 600);
      busTrips.push({
        schedule_id: td.schedule._id,
        bus_id: td.bus._id,
        driver_id: td.driver._id,
        trip_date: dateOnly,
        status,
        boarding_points: td.schedule.boarding_points,
        drop_points: td.schedule.drop_points,
        seats: makeBusTripSeats(td.bus.total_seats, basePrice),
        is_return_trip: td.isReturn,
      });
    }

    const tripDocs = await BusTrip.insertMany(busTrips);

    const packageSeeds = [
      {
        package_name: "Kashmir Valley Signature Escape",
        package_type: "Premium Nature",
        destination: "Srinagar - Gulmarg - Pahalgam",
        city: "Ahmedabad",
        state: "Gujarat",
        duration: "6 Days / 5 Nights",
        hotels: ["Statue Vista", "Arabian Pearl"],
        boarding_points: ["Iskcon Cross Road, SG Highway, Ahmedabad"],
        sightseeing: ["Dal Lake", "Nishat Bagh", "Gulmarg Gondola", "Betaab Valley", "Aru Valley"],
        inclusive: "3-star/4-star stays, breakfast and dinner, airport transfers, local sightseeing, tour guide support",
        exclusive: "Airfare, lunch, personal shopping, pony rides, optional adventure activities",
        itinerary: "Day 1 Srinagar check-in and houseboat sunset. Day 2 Mughal gardens and old city walk. Day 3 Gulmarg excursion with gondola. Day 4 Pahalgam valley exploration. Day 5 shopping and cultural evening. Day 6 departure.",
        guideIdx: 0,
        images: ["packages/1775039185273-p1-i1.jpg", "packages/1775039185282-p1-i2.jpg", "packages/1775039185286-p1-i3.jpg", "packages/1775039185289-p1-i4.jpg"],
      },
      {
        package_name: "Goa Coastal Leisure Break",
        package_type: "Beach Leisure",
        destination: "North Goa - South Goa",
        city: "Surat",
        state: "Gujarat",
        duration: "5 Days / 4 Nights",
        hotels: ["Metro Harbor Stay", "Sahyadri Retreat"],
        boarding_points: ["Shivranjani Cross Road, Satellite, Ahmedabad"],
        sightseeing: ["Miramar Beach", "Baga Beach", "Fort Aguada", "Dona Paula", "Colva Beach"],
        inclusive: "Hotel stay, breakfast, private transfers, guided city and beach sightseeing",
        exclusive: "Airfare, watersports, entry fees for optional shows, personal expenses",
        itinerary: "Day 1 arrival and beachside check-in. Day 2 North Goa beaches and fort circuit. Day 3 old churches and local market trail. Day 4 South Goa leisure and sunset cruise. Day 5 departure.",
        guideIdx: 1,
        images: ["packages/1775039606755-p2-i1.jpg", "packages/1775039606766-p2-i2.jpg", "packages/1775039606771-p2-i3.jpg", "packages/1775039606775-p2-i4.jpg", "packages/1775039606788-p2-i5.jpg"],
      },
      {
        package_name: "Rajasthan Royal Heritage Circuit",
        package_type: "Culture and Heritage",
        destination: "Jaipur - Udaipur",
        city: "Jaipur",
        state: "Rajasthan",
        duration: "5 Days / 4 Nights",
        hotels: ["Heritage Courtyard", "Pink City Grand"],
        boarding_points: ["Nehrunagar Circle, Ahmedabad"],
        sightseeing: ["Amber Fort", "City Palace Jaipur", "Hawa Mahal", "Lake Pichola", "City Palace Udaipur"],
        inclusive: "Comfort hotels, breakfast, sightseeing vehicle, local guide support",
        exclusive: "Lunch and dinner, monument camera fees, shopping, personal activities",
        itinerary: "Day 1 Jaipur arrival and evening market visit. Day 2 Amber Fort and palace circuit. Day 3 transfer to Udaipur with enroute stops. Day 4 lake city tour and cultural show. Day 5 departure.",
        guideIdx: 2,
        images: ["packages/1775039836054-p3-i1.webp", "packages/1775039836060-p3-i2.jpg", "packages/1775039836076-p3-i3.jpg", "packages/1775039836077-p3-i4.jpg", "packages/1775039836078-p3-i5.jpg"],
      },
      {
        package_name: "Himachal Snow and Valley Retreat",
        package_type: "Mountain Retreat",
        destination: "Shimla - Manali",
        city: "Ahmedabad",
        state: "Gujarat",
        duration: "6 Days / 5 Nights",
        hotels: ["Royal Dunes", "Pink City Grand"],
        boarding_points: ["Paldi Cross Road, Ahmedabad"],
        sightseeing: ["Mall Road Shimla", "Kufri", "Solang Valley", "Hadimba Temple", "Old Manali"],
        inclusive: "Hotel stay, breakfast and dinner, private transfers, sightseeing assistance",
        exclusive: "Airfare, adventure rides, heater charges, personal spends",
        itinerary: "Day 1 Shimla arrival and local orientation. Day 2 Kufri and town highlights. Day 3 transfer to Manali. Day 4 Solang Valley and adventure window. Day 5 local heritage spots. Day 6 departure.",
        guideIdx: 3,
        images: ["packages/1775040112871-p4-i1.jpg", "packages/1775040112872-p4-i2.jpg", "packages/1775040112875-p4-i3.jpg", "packages/1775040112876-p4-i4.jpg", "packages/1775040112880-p4-i5.jpg"],
      },
      {
        package_name: "Uttarakhand Spiritual Serenity Tour",
        package_type: "Spiritual and Wellness",
        destination: "Haridwar - Rishikesh",
        city: "Ahmedabad",
        state: "Madhya Pradesh",
        duration: "4 Days / 3 Nights",
        hotels: ["Malwa Heights", "Narmada Serenity"],
        boarding_points: ["CTM Expressway Pickup Point, Ahmedabad"],
        sightseeing: ["Har Ki Pauri", "Mansa Devi Temple", "Laxman Jhula", "Ram Jhula", "Ganga Aarti Rishikesh"],
        inclusive: "Hotel stay, breakfast, private transfers, guide for temple circuits",
        exclusive: "Airfare, ropeway tickets, donations, wellness add-ons",
        itinerary: "Day 1 Haridwar check-in and evening aarti. Day 2 temple circuit and transfer to Rishikesh. Day 3 yoga session and riverfront exploration. Day 4 departure.",
        guideIdx: 1,
        images: ["packages/1775040432430-p5-i1.jpg", "packages/1775040432437-p5-i2.jpg", "packages/1775040432446-p5-i3.jpg", "packages/1775040432454-p5-i4.jpg", "packages/1775040432457-p5-i5.jpg"],
      },
      {
        package_name: "South India Heritage and Coastline Trail",
        package_type: "Explorer Special",
        destination: "Bengaluru - Mysuru - Kochi - Chennai",
        city: "Mumbai",
        state: "Maharashtra",
        duration: "7 Days / 6 Nights",
        hotels: ["Metro Harbor Stay", "Sahyadri Retreat", "Arabian Pearl"],
        boarding_points: ["Sabarmati Railway Station Pickup Zone, Ahmedabad"],
        sightseeing: ["Bangalore Palace", "Mysore Palace", "Kochi Marine Drive", "Fort Kochi", "Marina Beach"],
        inclusive: "Hotel stays, breakfast, intercity transport, sightseeing support",
        exclusive: "Airfare, monument tickets, lunch and dinner, personal activities",
        itinerary: "Day 1 Bengaluru arrival and city highlights. Day 2 transfer to Mysuru and palace visit. Day 3 Kochi transfer and waterfront evening. Day 4 Fort Kochi heritage circuit. Day 5 Chennai transfer. Day 6 Marina and cultural zones. Day 7 departure.",
        guideIdx: 2,
        images: ["packages/1775041213690-p6-i1.jpg", "packages/1775041213691-p6-i2.jpg", "packages/1775041213694-p6-i2.png", "packages/1775041213704-p6-i4.jpeg", "packages/1775041213708-p6-i5.jpg"],
      },
    ];

    const packages = await Package.insertMany(
      packageSeeds.map((p) => ({
        package_name: p.package_name,
        package_type: p.package_type,
        source_city: "Ahmedabad",
        destination: p.destination,
        state_id: stateByName[p.state]._id,
        city_id: cityByName[p.city]._id,
        places_visited: [cityByName[p.city]._id],
        hotels: hotels
          .filter((h) => p.hotels.includes(h.name))
          .map((h) => h._id),
        duration: p.duration,
        image_urls: p.images,
        description: `${p.package_name} curated itinerary for smooth family-friendly travel`,
        tour_guide: guides[p.guideIdx]._id,
        inclusive: p.inclusive,
        exclusive: p.exclusive,
        boarding_points: p.boarding_points,
        sightseeing: p.sightseeing,
        itinerary: p.itinerary,
        status: "Active",
      }))
    );

    const customersRaw = [
      ["Amit", "Shah", "Male"],
      ["Riya", "Patel", "Female"],
      ["Krunal", "Dave", "Male"],
      ["Sneha", "Amin", "Female"],
      ["Harsh", "Vyas", "Male"],
      ["Nidhi", "Panchal", "Female"],
      ["Dev", "Rana", "Male"],
      ["Ishita", "Gandhi", "Female"],
      ["Rohan", "Mistry", "Male"],
      ["Ankita", "Desai", "Female"],
      ["Yash", "Kakkad", "Male"],
      ["Meera", "Kapadia", "Female"],
      ["Darsh", "Modi", "Male"],
      ["Pallavi", "Trivedi", "Female"],
      ["Jay", "Bhatt", "Male"],
    ];

    const customerMobiles = customersRaw.map(() =>
      randomIndianMobile(usedMobiles)
    );

    const customers = await Custmer.insertMany(
      customersRaw.map(([first_name, last_name, gender], i) => ({
        first_name,
        last_name,
        email: `${first_name.toLowerCase()}${last_name.toLowerCase()}${i + 1}@gmail.com`,
        dob: dmy(new Date(1988 + (i % 9), (i * 2) % 12, 4 + (i % 22))),
        phone_no: customerMobiles[i],
        password: hash,
        gender,
        address: `${rand(1, 99)}, ${pick(["Bopal", "Thaltej", "Naranpura", "Pal", "Adajan", "Vesu"])}`,
      }))
    );

    const tourScheduleDefs = [
      { pkg: 0, bus: 0, driver: 7, guide: 0, startOffset: -12, days: 6, price: 28900, departure_status: "Completed" },
      { pkg: 1, bus: 1, driver: 6, guide: 1, startOffset: -8, days: 5, price: 21900, departure_status: "Completed" },
      { pkg: 2, bus: 2, driver: 5, guide: 2, startOffset: 1, days: 5, price: 18900, departure_status: "Open" },
      { pkg: 3, bus: 3, driver: 4, guide: 3, startOffset: 3, days: 6, price: 16900, departure_status: "Open" },
      { pkg: 4, bus: 0, driver: 3, guide: 0, startOffset: 4, days: 4, price: 14900, departure_status: "Open" },
      { pkg: 5, bus: 1, driver: 2, guide: 2, startOffset: 6, days: 7, price: 23900, departure_status: "Open" },
    ];

    const tourSchedules = await TourSchedule.insertMany(
      tourScheduleDefs.map((s) => {
        const bus = tourBuses[s.bus];
        const start = toDateOnly(new Date(today.getTime() + s.startOffset * dayMs));
        const end = toDateOnly(new Date(start.getTime() + (s.days - 1) * dayMs));
        const isPast = end < today;
        const seats = makeTourSeats(bus.total_seats);

        return {
          package_id: packages[s.pkg]._id,
          start_date: start,
          end_date: end,
          departure_time: pick(["06:00", "07:00", "08:30"]),
          bus_id: bus._id,
          driver_id: drivers[s.driver]._id,
          guide_id: guides[s.guide]._id,
          price: s.price,
          price_per_person: s.price,
          total_seats: bus.total_seats,
          available_seats: bus.total_seats,
          seats,
          departure_status: s.departure_status || (isPast ? "Completed" : "Open"),
          has_bookings: false,
          notes: `${packages[s.pkg].package_name} departure`,
        };
      })
    );

    const packageBookings = [];

    const reserveTourSeats = (schedule, count, bookingId, reserve) => {
      const freeSeats = schedule.seats.filter((seat) => !seat.is_booked);
      const picked = freeSeats.slice(0, count);

      if (reserve) {
        for (const seat of picked) {
          seat.is_booked = true;
          seat.booked_by = bookingId;
        }
      }

      return picked.map((s) => s.seat_number);
    };

    const packageBookingPlan = [
      { scheduleIndex: 0, customerIndex: 0, travellers: 12, bookingStatus: "completed", paymentStatus: "paid", daysBeforeDeparture: 14, review: true },
      { scheduleIndex: 1, customerIndex: 1, travellers: 11, bookingStatus: "completed", paymentStatus: "paid", daysBeforeDeparture: 12, review: true },
      { scheduleIndex: 2, customerIndex: 2, travellers: 4, bookingStatus: "confirmed", paymentStatus: "paid", daysBeforeDeparture: 6, review: false },
      { scheduleIndex: 3, customerIndex: 3, travellers: 3, bookingStatus: "pending", paymentStatus: "unpaid", daysBeforeDeparture: 5, review: false },
      { scheduleIndex: 4, customerIndex: 4, travellers: 5, bookingStatus: "confirmed", paymentStatus: "paid", daysBeforeDeparture: 4, review: false },
      { scheduleIndex: 5, customerIndex: 5, travellers: 2, bookingStatus: "cancelled", paymentStatus: "refunded", daysBeforeDeparture: 3, review: false },
    ];

    for (const plan of packageBookingPlan) {
      const schedule = tourSchedules[plan.scheduleIndex];
      const pkg = packages.find((p) => String(p._id) === String(schedule.package_id));
      const customer = customers[plan.customerIndex];
      const minDaysBeforeDeparture = Math.max(3, Number(plan.daysBeforeDeparture || 3));
      const bookingDate = new Date(schedule.start_date.getTime() - minDaysBeforeDeparture * dayMs);
      const doc = new PackageBooking({
        package_id: schedule.package_id,
        tour_schedule_id: schedule._id,
        customer_id: customer._id,
        travellers: plan.travellers,
        pickup_location: pick(pkg.boarding_points),
        price_per_person: Number(schedule.price || schedule.price_per_person || 9000),
        total_amount: Number(schedule.price || schedule.price_per_person || 9000) * plan.travellers,
        booking_date: bookingDate,
        booking_status: plan.bookingStatus,
        payment_status: plan.paymentStatus,
        approval_deadline: new Date(bookingDate.getTime() + 2 * dayMs),
        payment_deadline: new Date(bookingDate.getTime() + 3 * dayMs),
        cancelled_by: plan.bookingStatus === "cancelled" ? "customer" : undefined,
        cancellation_reason: plan.bookingStatus === "cancelled" ? "Plan changed" : undefined,
        cancelled_at: plan.bookingStatus === "cancelled" ? new Date() : undefined,
        refund_amount: plan.bookingStatus === "cancelled" ? 2400 : 0,
        refund_status: plan.bookingStatus === "cancelled" ? "completed" : "none",
      });

      await doc.save();

      const reserveSeats = plan.bookingStatus !== "cancelled";
      const seatNumbers = reserveTourSeats(schedule, plan.travellers, doc._id, reserveSeats);
      doc.seat_numbers = seatNumbers;
      doc.seat_price_details = seatNumbers.map((sn) => ({
        seat_number: sn,
        age: rand(21, 54),
        base_fare: doc.price_per_person,
        seat_surcharge: 0,
        final_fare: doc.price_per_person,
      }));

      if (reserveSeats) {
        schedule.available_seats -= plan.travellers;
        schedule.has_bookings = true;
      }

      await doc.save();
      packageBookings.push(doc);

      for (let t = 0; t < plan.travellers; t++) {
        await Passenger.create({
          p_booking_id: doc._id,
          passenger_name: `${pick(["Arjun", "Kavya", "Naman", "Ritu", "Milan", "Tina"])} ${pick(["Patel", "Shah", "Rao", "Kumar", "Joshi", "Amin"])}${t}`,
          age: rand(18, 62),
          gender: pick(["Male", "Female"]),
          is_lead: t === 0,
        });
      }
    }

    for (const schedule of tourSchedules) {
      if (schedule.end_date < today) {
        schedule.departure_status = "Completed";
      } else if (schedule.available_seats <= 0) {
        schedule.departure_status = "BookingFull";
      } else {
        schedule.departure_status = "Open";
      }
      await schedule.save();
    }

    const busBookingTripIndices = [0, 1, 2, 3, 14, 15, 16, 17, 18, 19];

    const busBookings = [];
    for (let i = 0; i < busBookingTripIndices.length; i++) {
      const trip = tripDocs[busBookingTripIndices[i]];
      const customer = customers[(i + 3) % customers.length];
      const seatCount = i < 3 ? rand(3, 4) : rand(1, 3);
      const tripDate = toDateOnly(trip.trip_date);
      const isPastTrip = tripDate < today;
      const status = isPastTrip
        ? pick(["Completed", "Completed", "Completed", "Cancelled"])
        : pick(["Confirmed", "Confirmed", "Confirmed", "Cancelled"]);

      const paymentStatus = status === "Cancelled" ? "Refunded" : "Paid";
      const paymentDeadline = new Date(Math.max(Date.now() + dayMs, tripDate.getTime() - dayMs));

      const booking = new BusTicketBooking({
        route_id: null,
        trip_id: trip._id,
        customer_id: customer._id,
        travel_date: trip.trip_date,
        seat_numbers: [],
        seat_prices: [],
        travellers: seatCount,
        price_per_seat: 0,
        total_amount: 0,
        booking_status: status,
        cancellation_reason:
          status === "Cancelled" ? pick(["Plan changed", "Emergency at home", "Exam schedule changed"]) : null,
        payment_status: paymentStatus,
        payment_deadline: paymentDeadline,
      });

      const seatPool = trip.seats.filter((s) => s.is_available);
      const pickedSeats = seatPool.slice(0, seatCount);
      const seatNumbers = pickedSeats.map((s) => s.seat_number);
      const seatPrices = pickedSeats.map((s) => s.price);
      const totalAmount = seatPrices.reduce((a, b) => a + b, 0);

      booking.seat_numbers = seatNumbers;
      booking.seat_prices = seatPrices;
      booking.total_amount = totalAmount;
      booking.price_per_seat = Math.round(totalAmount / seatCount);

      await booking.save();

      const isActive = status !== "Cancelled";
      if (isActive) {
        for (const seatNo of seatNumbers) {
          const seat = trip.seats.find((s) => s.seat_number === seatNo);
          if (seat) seat.is_available = false;
        }
      }
      await trip.save();

      for (let t = 0; t < seatCount; t++) {
        await Passenger.create({
          b_booking_id: booking._id,
          passenger_name: `${pick(["Dhruv", "Aesha", "Ravi", "Naina", "Kabir", "Ira"])} ${pick(["Mehta", "Shukla", "Soni", "Patel", "Parikh", "Baxi"])}${t}`,
          age: rand(19, 58),
          gender: pick(["Male", "Female"]),
          is_lead: t === 0,
        });
      }

      busBookings.push(booking);
    }

    const cancellationRecords = [];

    const cancelledPackageBookings = packageBookings.filter((b) => b.booking_status === "cancelled");
    for (let i = 0; i < cancelledPackageBookings.length; i++) {
      const b = cancelledPackageBookings[i];
      const status = "Refund Done";
      const refundAmount = Number(b.total_amount || b.refund_amount || 0);

      const c = await Cancellation.create({
        customer_id: b.customer_id,
        booking_id: b._id,
        booking_type: "PackageBooking",
        refund_amount: refundAmount,
        cancellation_reason: b.cancellation_reason || "Cancelled by user",
        status,
        cancelled_at: b.cancelled_at || new Date(),
      });

      cancellationRecords.push(c);
    }

    const cancelledBusBookings = busBookings.filter((b) => b.booking_status === "Cancelled");
    for (let i = 0; i < cancelledBusBookings.length; i++) {
      const b = cancelledBusBookings[i];
      const status = "Refund Done";
      const refundAmount = Number(b.total_amount || 0);

      const c = await Cancellation.create({
        customer_id: b.customer_id,
        booking_id: b._id,
        booking_type: "BusTicketBooking",
        refund_amount: refundAmount,
        cancellation_reason: b.cancellation_reason || "Cancelled by customer",
        status,
        cancelled_at: new Date(),
      });

      cancellationRecords.push(c);
    }

    const refundTargets = cancellationRecords.filter((c) => c.status === "Refund Done");
    for (let i = 0; i < refundTargets.length; i++) {
      const c = refundTargets[i];
      await Refund.create({
        refund_id: `REF-${Date.now()}-${i + 1}`,
        cancellation_id: c._id,
        customer_id: c.customer_id,
        booking_id: c.booking_id,
        booking_type: c.booking_type,
        refund_amount: c.refund_amount,
        refund_mode: pick(["Online", "Original Payment Method", "Bank Transfer"]),
        refund_date: new Date(Date.now() - rand(1, 4) * dayMs),
        refund_status: "Completed",
        transaction_id: `TXN${Date.now()}${i}`,
        notes: "Refund processed by accounts team",
      });
    }

    const completedPackageBookings = packageBookings.filter((b) => b.booking_status === "completed");
    if (completedPackageBookings.length > 0) {
      const reviewTexts = [
        "Excellent planning and smooth travel experience.",
        "Driver was punctual and guide explained every stop clearly.",
        "Hotels were clean and itinerary timing was practical.",
        "Good value for money, will recommend to friends.",
        "Overall very satisfying tour with proper support.",
        "Sightseeing was well managed and there was enough free time.",
        "Pickup and drop timings were accurate and convenient.",
        "The guide was friendly and handled the group very professionally.",
        "Trip was comfortable from start to end, no major delays.",
        "Food and stay arrangement were better than expected for this budget.",
      ];

      const targetReviewCount = Math.max(12, completedPackageBookings.length * 4);

      for (let i = 0; i < targetReviewCount; i++) {
        const baseBooking = completedPackageBookings[i % completedPackageBookings.length];
        const reviewer = pick(customers);
        const rating = pick([5, 5, 4, 4, 4, 3]);

        await Feedback.create({
          custmer_id: reviewer._id,
          package_id: baseBooking.package_id,
          tour_schedule_id: baseBooking.tour_schedule_id,
          booking_id: baseBooking._id,
          rating,
          review_text: pick(reviewTexts),
          hotel_rating: pick([3, 4, 4, 5]),
          service_rating: pick([3, 4, 4, 5]),
          is_published: true,
          createdAt: new Date(Date.now() - rand(5, 120) * dayMs),
        });
      }

      await PackageBooking.updateMany(
        { _id: { $in: completedPackageBookings.map((b) => b._id) } },
        { $set: { review_submitted: true } }
      );
    }

    const invoiceRows = [];
    const paidPackage = packageBookings.filter((b) => b.payment_status === "paid" || b.payment_status === "refunded");
    for (const b of paidPackage.slice(0, 10)) {
      invoiceRows.push({
        invoice_number: `INV-PKG-${Date.now()}-${invoiceRows.length + 1}`,
        customer_id: b.customer_id,
        booking_id: b._id,
        booking_type: "PackageBooking",
        description: "Tour Package Booking",
        booking_date: b.booking_date,
        travel_date: b.booking_date,
        travellers: b.travellers,
        seat_numbers: b.seat_numbers,
        base_fare: b.total_amount,
        child_discount: 0,
        amount: b.total_amount,
        payment_method: "Online (Razorpay)",
        transaction_id: `PAYPKG${rand(100000, 999999)}`,
        status: b.payment_status === "refunded" ? "Refunded" : "Paid",
      });
    }

    const paidBus = busBookings.filter((b) => b.payment_status === "Paid" || b.payment_status === "Refunded");
    for (const b of paidBus.slice(0, 10)) {
      invoiceRows.push({
        invoice_number: `INV-BUS-${Date.now()}-${invoiceRows.length + 1}`,
        customer_id: b.customer_id,
        booking_id: b._id,
        booking_type: "BusTicketBooking",
        description: "Bus Ticket Booking",
        booking_date: b.createdAt,
        travel_date: b.travel_date,
        travellers: b.travellers,
        seat_numbers: b.seat_numbers,
        base_fare: b.total_amount,
        child_discount: 0,
        amount: b.total_amount,
        payment_method: "Online (Razorpay)",
        transaction_id: `PAYBUS${rand(100000, 999999)}`,
        status: b.payment_status === "Refunded" ? "Refunded" : "Paid",
      });
    }

    await Invoice.insertMany(invoiceRows);

    const exportModels = {
      states: State,
      cities: City,
      hotels: Hotel,
      staff: Staff,
      customers: Custmer,
      buses: Bus,
      bus_routes: BusRoute,
      bus_schedules: BusSchedule,
      bus_trips: BusTrip,
      packages: Package,
      tour_schedules: TourSchedule,
      package_bookings: PackageBooking,
      bus_ticket_bookings: BusTicketBooking,
      passengers: Passenger,
      cancellations: Cancellation,
      refunds: Refund,
      feedback: Feedback,
      invoices: Invoice,
    };

    fs.mkdirSync(EXPORT_DIR, { recursive: true });
    for (const [name, model] of Object.entries(exportModels)) {
      const docs = await model.find({}).lean();
      fs.writeFileSync(
        path.join(EXPORT_DIR, `${name}.json`),
        JSON.stringify(docs, null, 2),
        "utf8"
      );
    }

    const summary = {
      states: await State.countDocuments(),
      cities: await City.countDocuments(),
      hotels: await Hotel.countDocuments(),
      staff: await Staff.countDocuments(),
      customers: await Custmer.countDocuments(),
      buses: await Bus.countDocuments(),
      routes: await BusRoute.countDocuments(),
      busSchedules: await BusSchedule.countDocuments(),
      busTrips: await BusTrip.countDocuments(),
      packages: await Package.countDocuments(),
      tourSchedules: await TourSchedule.countDocuments(),
      packageBookings: await PackageBooking.countDocuments(),
      busBookings: await BusTicketBooking.countDocuments(),
      passengers: await Passenger.countDocuments(),
      cancellations: await Cancellation.countDocuments(),
      refunds: await Refund.countDocuments(),
      feedback: await Feedback.countDocuments(),
      invoices: await Invoice.countDocuments(),
    };

    console.log("Seed completed successfully.");
    console.table(summary);
    console.log(`JSON export generated at: ${EXPORT_DIR}`);
    console.log(`Demo login password for seeded users/staff: ${LOGIN_PASSWORD}`);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

main();
