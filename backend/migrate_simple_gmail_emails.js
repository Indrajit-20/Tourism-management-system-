const mongoose = require("mongoose");
const Custmer = require("./models/Custmer");
const Staff = require("./models/Staff");

const DB_URI = "mongodb://localhost:27017/tms2";

const makeCustomerEmail = (firstName, lastName, index) => {
  const first = String(firstName || "").trim().toLowerCase().replace(/\s+/g, "");
  const last = String(lastName || "").trim().toLowerCase().replace(/\s+/g, "");
  return `${first}${last}${index + 1}@gmail.com`;
};

const makeStaffEmail = (name, index) => {
  const base = String(name || "").trim().toLowerCase().replace(/\s+/g, "");
  return `${base}${index + 1}@gmail.com`;
};

const run = async () => {
  await mongoose.connect(DB_URI);

  const customers = await Custmer.find({}).sort({ createdAt: 1 });
  const staff = await Staff.find({}).sort({ createdAt: 1 });

  let customerUpdates = 0;
  for (let i = 0; i < customers.length; i++) {
    const c = customers[i];
    const nextEmail = makeCustomerEmail(c.first_name, c.last_name, i);
    if (c.email !== nextEmail) {
      c.email = nextEmail;
      await c.save();
      customerUpdates += 1;
    }
  }

  let staffUpdates = 0;
  for (let i = 0; i < staff.length; i++) {
    const s = staff[i];
    const nextEmail = makeStaffEmail(s.name, i);
    if (s.email !== nextEmail) {
      s.email = nextEmail;
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
