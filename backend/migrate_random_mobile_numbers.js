const mongoose = require("mongoose");
const Custmer = require("./models/Custmer");
const Staff = require("./models/Staff");

const DB_URI = "mongodb://localhost:27017/tms2";

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomIndianMobile = (usedSet) => {
  const firstDigits = ["6", "7", "8", "9"];

  while (true) {
    const first = pick(firstDigits);
    const rest = String(Math.floor(100000000 + Math.random() * 900000000));
    const mobile = `${first}${rest}`;

    if (!usedSet.has(mobile)) {
      usedSet.add(mobile);
      return mobile;
    }
  }
};

const run = async () => {
  await mongoose.connect(DB_URI);

  const customers = await Custmer.find({}).sort({ createdAt: 1 });
  const staff = await Staff.find({}).sort({ createdAt: 1 });

  const usedMobiles = new Set();

  let customerUpdates = 0;
  for (const c of customers) {
    const nextMobile = randomIndianMobile(usedMobiles);
    if (String(c.phone_no) !== nextMobile) {
      c.phone_no = nextMobile;
      await c.save();
      customerUpdates += 1;
    }
  }

  let staffUpdates = 0;
  for (const s of staff) {
    const nextMobile = randomIndianMobile(usedMobiles);
    if (String(s.contact_no) !== nextMobile) {
      s.contact_no = nextMobile;
      await s.save();
      staffUpdates += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        customerUpdates,
        staffUpdates,
        customerCount: customers.length,
        staffCount: staff.length,
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
