require("dotenv").config();
const mongoose = require("mongoose");

const ConnectMongoDB = async () => {
  try {
    const con = await mongoose.connect(
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tms_live"
    );
    console.log(` MongoDB Connected: ${con.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
};

module.exports = ConnectMongoDB;
