const express = require("express");
const router = express.Router();
const City = require("../models/City");

router.get("/", async (req, res) => {
  try {
    const cities = await City.find().sort({ city_name: 1 });
    res.status(200).json(cities);
  } catch (error) {
    res.status(500).json({ message: "Error fetching cities", error: error.message });
  }
});

module.exports = router;