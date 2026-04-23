require("dotenv").config();
const mongoose = require("mongoose");

const ConnectMongoDB = async () => {
  try {
    console.log("Connecting to Database...");
    const con = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${con.connection.host}`);
  } catch (error) {
    console.error(`❌ Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = ConnectMongoDB;
