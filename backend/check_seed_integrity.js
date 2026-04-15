const mongoose = require("mongoose");
const Cancellation = require("./models/Cancellation");
const Staff = require("./models/Staff");
require("./models/BusRoute");
const BusSchedule = require("./models/BusSchedule");

const run = async () => {
  await mongoose.connect("mongodb://localhost:27017/tms2");

  const zeroRefundDone = await Cancellation.countDocuments({
    status: "Refund Done",
    refund_amount: { $lte: 0 },
  });

  const missingStaffDetails = await Staff.countDocuments({
    $or: [
      { experience: { $in: [null, ""] } },
      { designation: "driver", driver_license: { $in: [null, ""] } },
    ],
  });

  const schedules = await BusSchedule.find()
    .populate("route_id")
    .populate("driver_id", "name");

  const ahdToSurat = schedules.find(
    (s) =>
      s.route_id &&
      s.route_id.boarding_from === "Ahmedabad" &&
      s.route_id.destination === "Surat"
  );

  const suratToAhd = schedules.find(
    (s) =>
      s.route_id &&
      s.route_id.boarding_from === "Surat" &&
      s.route_id.destination === "Ahmedabad"
  );

  const sameDriverForRoundTrip =
    ahdToSurat &&
    suratToAhd &&
    String(ahdToSurat.driver_id?._id) === String(suratToAhd.driver_id?._id);

  console.log(
    JSON.stringify(
      {
        zeroRefundDone,
        missingStaffDetails,
        ahdSuratDriver: ahdToSurat?.driver_id?.name || null,
        suratAhdDriver: suratToAhd?.driver_id?.name || null,
        sameDriverForRoundTrip,
        ahdDeparture: ahdToSurat?.departure_time || null,
        suratDeparture: suratToAhd?.departure_time || null,
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
