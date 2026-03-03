const Staff = require("../models/Staff");

// Get all staff 
const getStaff = async (req, res) => {
  try {
    const staff = await Staff.find();
    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({ message: "Error fetching staff", error });
  }
};

// Add new staff 
const addStaff = async (req, res) => {
  try {
    const newStaff = new Staff(req.body);
    await newStaff.save();
    res
      .status(201)
      .json({ message: "Staff added successfully", staff: newStaff });
  } catch (error) {
    res.status(500).json({ message: "Error adding staff", error });
  }
};

// Delete staff
const deleteStaff = async (req, res) => {
  try {
    await Staff.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Staff deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting staff", error });
  }
};

module.exports = { getStaff, addStaff, deleteStaff };
