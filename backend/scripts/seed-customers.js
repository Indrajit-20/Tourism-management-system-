const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Custmer = require("../models/Custmer");

const DB_URI = "mongodb://localhost:27017/tms2";

const customersSeed = [
  {
    first_name: "Rohan",
    last_name: "Shah",
    email: "rohan@gmail.com",
    dob: "12-04-1998",
    phone_no: 9876501101,
    password: "rohan@123",
    gender: "Male",
    address: "Navrangpura, Ahmedabad, Gujarat",
  },
  {
    first_name: "Priya",
    last_name: "Patel",
    email: "priya@gmail.com",
    dob: "03-09-1999",
    phone_no: 9876501102,
    password: "priya@123",
    gender: "Female",
    address: "Vastrapur, Ahmedabad, Gujarat",
  },
  {
    first_name: "Aman",
    last_name: "Verma",
    email: "aman@gmail.com",
    dob: "28-01-1997",
    phone_no: 9876501103,
    password: "aman@123",
    gender: "Male",
    address: "Alkapuri, Vadodara, Gujarat",
  },
  {
    first_name: "Neha",
    last_name: "Joshi",
    email: "neha@gmail.com",
    dob: "17-06-2000",
    phone_no: 9876501104,
    password: "neha@123",
    gender: "Female",
    address: "Adajan, Surat, Gujarat",
  },
  {
    first_name: "Karan",
    last_name: "Mehta",
    email: "karan@gmail.com",
    dob: "09-11-1996",
    phone_no: 9876501105,
    password: "karan@123",
    gender: "Male",
    address: "Kalavad Road, Rajkot, Gujarat",
  },
  {
    first_name: "Sneha",
    last_name: "Reddy",
    email: "sneha@gmail.com",
    dob: "24-02-2001",
    phone_no: 9876501106,
    password: "sneha@123",
    gender: "Female",
    address: "Banjara Hills, Hyderabad, Telangana",
  },
];

async function seedCustomers() {
  await mongoose.connect(DB_URI);

  let insertedOrUpdated = 0;

  for (const item of customersSeed) {
    const hashedPassword = await bcrypt.hash(item.password, 10);

    await Custmer.findOneAndUpdate(
      { phone_no: item.phone_no },
      {
        $set: {
          first_name: item.first_name,
          last_name: item.last_name,
          email: item.email,
          dob: item.dob,
          phone_no: item.phone_no,
          password: hashedPassword,
          gender: item.gender,
          address: item.address,
        },
      },
      { upsert: true, new: true },
    );

    insertedOrUpdated += 1;
  }

  const seededCustomers = await Custmer.find(
    { email: { $in: customersSeed.map((c) => c.email) } },
    "first_name last_name email phone_no gender"
  ).sort({ first_name: 1 });

  console.log("Customer seed complete");
  console.log("Inserted/Updated:", insertedOrUpdated);
  console.log("Total seeded customers found:", seededCustomers.length);
  console.table(
    seededCustomers.map((cust) => ({
      name: `${cust.first_name} ${cust.last_name}`,
      email: cust.email,
      phone_no: cust.phone_no,
      gender: cust.gender || "-",
    })),
  );

  await mongoose.disconnect();
}

seedCustomers().catch(async (error) => {
  console.error("Customer seed failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors
  }
  process.exit(1);
});
