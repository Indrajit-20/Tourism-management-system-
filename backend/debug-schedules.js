const mongoose = require("mongoose");
const TourSchedule = require("./models/TourSchedule");
const Package = require("./models/Package");

const checkKashmirSchedules = async () => {
  try {
    await mongoose.connect("mongodb+srv://harshverma919:harshverma919@cluster0.a0ydy.mongodb.net/tourism_mgt");
    
    console.log("\n=== CHECKING KASHMIR VALLEY SCHEDULES ===\n");
    
    // Find Kashmir package
    const kashmirPackages = await Package.find({
      destination: { $regex: "Kashmir", $options: "i" }
    }).select("_id package_name destination");
    
    console.log("📦 Kashmir Packages Found:");
    console.log(JSON.stringify(kashmirPackages, null, 2));
    
    if (kashmirPackages.length === 0) {
      console.log("❌ No Kashmir package found in database!");
      await mongoose.disconnect();
      return;
    }
    
    // Find schedules for Kashmir packages
    const kashmirSchedules = await TourSchedule.find({
      package_id: { $in: kashmirPackages.map(p => p._id) }
    }).populate("package_id", "package_name destination")
      .select("_id start_date departure_status available_seats total_seats");
    
    console.log("\n📅 Kashmir Schedules Found: " + kashmirSchedules.length);
    console.log(JSON.stringify(kashmirSchedules, null, 2));
    
    if (kashmirSchedules.length === 0) {
      console.log("❌ No schedules created for Kashmir package!");
    } else {
      console.log("\n✅ Schedules Found. Status Analysis:");
      kashmirSchedules.forEach((sch, idx) => {
        const userCanBook = ["Open"].includes(sch.departure_status);
        const status = sch.departure_status;
        console.log(`  ${idx + 1}. Status: ${status} | Seats: ${sch.available_seats}/${sch.total_seats} | User Can Book: ${userCanBook ? "✅" : "❌"}`);
      });
    }
    
    console.log("\n=== ALL TOUR SCHEDULES ===\n");
    const allSchedules = await TourSchedule.find({})
      .populate("package_id", "package_name")
      .select("_id start_date departure_status package_id available_seats");
    
    console.log(`Total schedules in database: ${allSchedules.length}`);
    if (allSchedules.length > 0) {
      console.log("Statuses in use:");
      const statuses = {};
      allSchedules.forEach(s => {
        statuses[s.departure_status] = (statuses[s.departure_status] || 0) + 1;
      });
      console.log(JSON.stringify(statuses, null, 2));
    }
    
    await mongoose.disconnect();
    console.log("\n✅ Database check complete\n");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

checkKashmirSchedules();
