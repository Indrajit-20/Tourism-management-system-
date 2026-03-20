const express = require("express");
const router = express.Router();
const State = require("../models/State");
const { authMiddleware, isadmin } = require("../middleware/authmiddleware");

router.get("/", async (req, res) => {
  try {
    const states = await State.find().sort({ state_name: 1 });
    res.status(200).json(states);
  } catch (error) {
    res.status(500).json({ message: "Error fetching states", error: error.message });
  }
});

router.post("/", authMiddleware, isadmin, async (req, res) => {
  try {
    const { state_name, status } = req.body;
    if (!state_name) {
      return res.status(400).json({ message: "state_name is required" });
    }

    const exists = await State.findOne({ state_name: state_name.trim() });
    if (exists) {
      return res.status(400).json({ message: "State already exists" });
    }

    const state = await State.create({
      state_name: state_name.trim(),
      status: status || "Active",
    });

    res.status(201).json({ message: "State created", state });
  } catch (error) {
    res.status(500).json({ message: "Error creating state", error: error.message });
  }
});

module.exports = router;