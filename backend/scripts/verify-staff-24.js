const mongoose = require("mongoose");
const Staff = require("../models/Staff");

(async () => {
  await mongoose.connect("mongodb://localhost:27017/tms2");

  const emails = [
    "aarav@gmail.com","aditya@gmail.com","bhavesh@gmail.com","deepak@gmail.com",
    "harish@gmail.com","imran@gmail.com","jignesh@gmail.com","kunal@gmail.com",
    "mahesh@gmail.com","manoj@gmail.com","nitin@gmail.com","prakash@gmail.com",
    "rahul@gmail.com","rohan@gmail.com","sandeep@gmail.com","tarun@gmail.com",
    "vivaan@gmail.com","yash@gmail.com","anjali@gmail.com","kavya@gmail.com",
    "meera@gmail.com","neha@gmail.com","pooja@gmail.com","sneha@gmail.com"
  ];

  const docs = await Staff.find({ email_id: { $in: emails } }, "designation");
  const counts = docs.reduce((acc, doc) => {
    acc[doc.designation] = (acc[doc.designation] || 0) + 1;
    return acc;
  }, {});

  console.log("Seeded set size =", docs.length);
  console.log("Counts =", counts);

  await mongoose.disconnect();
})().catch(async (error) => {
  console.error(error.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
