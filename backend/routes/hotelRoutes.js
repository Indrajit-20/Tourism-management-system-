const express = require("express");
const router = express.Router();
const Hotel = require("../models/Hotel");
const City = require("../models/City");
const { authMiddleware, isadmin } = require("../middleware/authmiddleware");

router.get("/", async (req, res) => {
  try {
    const hotels = await Hotel.find()
      .populate("city_id", "city_name state")
      .populate("state_id", "state_name")
      .sort({ createdAt: -1 });
    res.status(200).json(hotels);
  } catch (error) {
    res.status(500).json({ message: "Error fetching hotels", error: error.message });
  }
});

router.post("/", authMiddleware, isadmin, async (req, res) => {
  try {
    const {
      name,
      city_id,
      state_id,
      hotel_type,
      description,
      status,
      location,
    } = req.body;

    if (!name || !city_id || !state_id || !location) {
      return res
        .status(400)
        .json({ message: "name, city_id, state_id and location are required" });
    }

    const city = await City.findById(city_id).select("state_id state city_name");
    if (!city) {
      return res.status(400).json({ message: "Invalid city selected" });
    }
    if (!city.state_id || String(city.state_id) !== String(state_id)) {
      return res.status(400).json({ message: "Selected city does not belong to selected state" });
    }

    const hotel = await Hotel.create({
      name,
      city_id,
      state_id,
      location,
      hotel_type,
      description,
      status: status || "Active",
    });

    const saved = await Hotel.findById(hotel._id)
      .populate("city_id", "city_name state")
      .populate("state_id", "state_name");

    res.status(201).json({ message: "Hotel created", hotel: saved });
  } catch (error) {
    res.status(500).json({ message: "Error creating hotel", error: error.message });
  }
});

router.put("/:id", authMiddleware, isadmin, async (req, res) => {
  try {
    const nextStateId = req.body.state_id;
    const nextCityId = req.body.city_id;

    if (nextStateId && nextCityId) {
      const city = await City.findById(nextCityId).select("state_id");
      if (!city || !city.state_id || String(city.state_id) !== String(nextStateId)) {
        return res.status(400).json({ message: "Selected city does not belong to selected state" });
      }
    }

    const updated = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("city_id", "city_name state")
      .populate("state_id", "state_name");

    if (!updated) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    res.status(200).json({ message: "Hotel updated", hotel: updated });
  } catch (error) {
    res.status(500).json({ message: "Error updating hotel", error: error.message });
  }
});

router.delete("/:id", authMiddleware, isadmin, async (req, res) => {
  try {
    const deleted = await Hotel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    res.status(200).json({ message: "Hotel deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting hotel", error: error.message });
  }
});

module.exports = router;


