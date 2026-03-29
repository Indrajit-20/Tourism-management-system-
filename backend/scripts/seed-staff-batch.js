const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Staff = require("../models/Staff");

const staffSeed = [
  {
    name: "Aarav Sharma",
    designation: "driver",
    contact_no: "9872614530",
    email_id: "aarav@gmail.com",
    dob: new Date("1997-04-12"),
    address: "14, Navrangpura Society, Ahmedabad, Gujarat",
  },
  {
    name: "Vivaan Patel",
    designation: "driver",
    contact_no: "9817345268",
    email_id: "vivaan@gmail.com",
    dob: new Date("1995-09-03"),
    address: "27, Satellite Road, Ahmedabad, Gujarat",
  },
  {
    name: "Aditya Verma",
    designation: "driver",
    contact_no: "9825061743",
    email_id: "aditya@gmail.com",
    dob: new Date("1998-01-21"),
    address: "9, Maninagar East, Ahmedabad, Gujarat",
  },
  {
    name: "Rohan Singh",
    designation: "driver",
    contact_no: "9863125479",
    email_id: "rohan@gmail.com",
    dob: new Date("1996-06-18"),
    address: "33, Vastrapur Lake Road, Ahmedabad, Gujarat",
  },
  {
    name: "Kunal Mehta",
    designation: "driver",
    contact_no: "9891452673",
    email_id: "kunal@gmail.com",
    dob: new Date("1999-02-10"),
    address: "51, Chandkheda Main Road, Ahmedabad, Gujarat",
  },
  {
    name: "Sandeep Yadav",
    designation: "driver",
    contact_no: "9812674503",
    email_id: "sandeep@gmail.com",
    dob: new Date("1994-11-26"),
    address: "11, Paldi Cross Lane, Ahmedabad, Gujarat",
  },
  {
    name: "Mahesh Chauhan",
    designation: "driver",
    contact_no: "9887132456",
    email_id: "mahesh@gmail.com",
    dob: new Date("1993-08-14"),
    address: "42, Bopal Ghuma Road, Ahmedabad, Gujarat",
  },
  {
    name: "Prakash Solanki",
    designation: "driver",
    contact_no: "9842507316",
    email_id: "prakash@gmail.com",
    dob: new Date("1992-12-30"),
    address: "6, Naranpura Bhuyangdev Road, Ahmedabad, Gujarat",
  },
  {
    name: "Nitin Trivedi",
    designation: "driver",
    contact_no: "9837642510",
    email_id: "nitin@gmail.com",
    dob: new Date("1998-05-07"),
    address: "75, Gota Jagatpur Road, Ahmedabad, Gujarat",
  },
  {
    name: "Harish Desai",
    designation: "driver",
    contact_no: "9879031642",
    email_id: "harish@gmail.com",
    dob: new Date("1991-03-16"),
    address: "18, Nikol Naroda Road, Ahmedabad, Gujarat",
  },
  {
    name: "Rahul Bhatt",
    designation: "driver",
    contact_no: "9824713650",
    email_id: "rahul@gmail.com",
    dob: new Date("1994-02-08"),
    address: "64, Bodakdev Ring Road, Ahmedabad, Gujarat",
  },
  {
    name: "Manoj Parmar",
    designation: "driver",
    contact_no: "9898012743",
    email_id: "manoj@gmail.com",
    dob: new Date("1993-10-22"),
    address: "8, Ranip Railway Colony, Ahmedabad, Gujarat",
  },
  {
    name: "Deepak Rawal",
    designation: "driver",
    contact_no: "9819257340",
    email_id: "deepak@gmail.com",
    dob: new Date("1996-04-11"),
    address: "16, Odhav Industrial Estate Road, Ahmedabad, Gujarat",
  },
  {
    name: "Jignesh Vora",
    designation: "driver",
    contact_no: "9886042157",
    email_id: "jignesh@gmail.com",
    dob: new Date("1992-09-05"),
    address: "45, Sola Science City Road, Ahmedabad, Gujarat",
  },
  {
    name: "Bhavesh Shah",
    designation: "driver",
    contact_no: "9875461230",
    email_id: "bhavesh@gmail.com",
    dob: new Date("1990-12-17"),
    address: "3, Ambawadi Cross Road, Ahmedabad, Gujarat",
  },
  {
    name: "Imran Sheikh",
    designation: "driver",
    contact_no: "9862317450",
    email_id: "imran@gmail.com",
    dob: new Date("1995-07-29"),
    address: "52, Jamalpur City Wall Road, Ahmedabad, Gujarat",
  },
  {
    name: "Tarun Modi",
    designation: "driver",
    contact_no: "9831276504",
    email_id: "tarun@gmail.com",
    dob: new Date("1998-11-01"),
    address: "24, SG Highway Service Lane, Ahmedabad, Gujarat",
  },
  {
    name: "Yash Trivedi",
    designation: "driver",
    contact_no: "9843067215",
    email_id: "yash@gmail.com",
    dob: new Date("1999-06-13"),
    address: "29, Motera Stadium Road, Ahmedabad, Gujarat",
  },
  {
    name: "Meera Joshi",
    designation: "guide",
    contact_no: "9864502731",
    email_id: "meera@gmail.com",
    dob: new Date("1997-10-09"),
    address: "22, Prahlad Nagar Garden Road, Ahmedabad, Gujarat",
  },
  {
    name: "Kavya Reddy",
    designation: "guide",
    contact_no: "9821347650",
    email_id: "kavya@gmail.com",
    dob: new Date("1999-07-04"),
    address: "39, Thaltej Shilaj Road, Ahmedabad, Gujarat",
  },
  {
    name: "Neha Kapoor",
    designation: "guide",
    contact_no: "9892761453",
    email_id: "neha@gmail.com",
    dob: new Date("1996-01-28"),
    address: "12, Memnagar Gurukul Road, Ahmedabad, Gujarat",
  },
  {
    name: "Pooja Nair",
    designation: "guide",
    contact_no: "9815067324",
    email_id: "pooja@gmail.com",
    dob: new Date("1995-05-19"),
    address: "47, Sabarmati Riverfront Road, Ahmedabad, Gujarat",
  },
  {
    name: "Anjali Gupta",
    designation: "guide",
    contact_no: "9847612350",
    email_id: "anjali@gmail.com",
    dob: new Date("1998-09-23"),
    address: "5, Isanpur Vatva Road, Ahmedabad, Gujarat",
  },
  {
    name: "Sneha Iyer",
    designation: "guide",
    contact_no: "9884527301",
    email_id: "sneha@gmail.com",
    dob: new Date("1997-02-15"),
    address: "31, Shahibaug Circuit House Road, Ahmedabad, Gujarat",
  },
];

async function seedStaff() {
  await mongoose.connect("mongodb://localhost:27017/tms2");

  const getPasswordFromName = (fullName) => {
    const firstName = String(fullName || "")
      .trim()
      .split(" ")[0]
      .toLowerCase();
    return `${firstName}@123`;
  };

  const operations = await Promise.all(staffSeed.map(async (member) => {
    const plainPassword = getPasswordFromName(member.name);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    return {
    updateOne: {
      filter: { email_id: member.email_id },
      update: {
        $set: {
          name: member.name,
          designation: member.designation,
          contact_no: member.contact_no,
          dob: member.dob,
          address: member.address,
          password: hashedPassword,
        },
        $setOnInsert: {
          email_id: member.email_id,
        },
      },
      upsert: true,
    },
  };
  }));

  const result = await Staff.bulkWrite(operations, { ordered: false });
  const seededDocs = await Staff.find(
    { email_id: { $in: staffSeed.map((s) => s.email_id) } },
    "name designation email_id contact_no"
  ).sort({ designation: 1, name: 1 });

  console.log("Seed complete");
  console.log("Inserted:", result.upsertedCount || 0);
  console.log("Modified:", result.modifiedCount || 0);
  console.log("Matched:", result.matchedCount || 0);
  console.log("Total seeded docs found:", seededDocs.length);
  console.table(
    seededDocs.map((doc) => ({
      name: doc.name,
      designation: doc.designation,
      email_id: doc.email_id,
      contact_no: doc.contact_no,
    }))
  );

  await mongoose.disconnect();
}

seedStaff().catch(async (error) => {
  console.error("Seed failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
