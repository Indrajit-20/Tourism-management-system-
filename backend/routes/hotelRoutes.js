const express = require("express");
const router = express.Router();
const Hotel = require("../models/Hotel");

router.get("/", async (req, res) => {
  try {
    const hotels = await Hotel.find();
    res.json(hotels);
  } catch (error) {
    res.status(500).json({ message: "Error fetching hotels", error });
  }
});

module.exports = router;


