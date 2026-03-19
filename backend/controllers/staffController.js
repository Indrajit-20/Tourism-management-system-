const Staff = require("../models/Staff");
const bcrypt = require("bcryptjs");

// Get all staff
const getStaff = async (req, res) => {
  try {
    const staff = await Staff.find().select("-password"); // Don't return password
    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({ message: "Error fetching staff", error });
  }
};

// Add new staff with password hashing
const addStaff = async (req, res) => {
  try {
    const { name, designation, contact_no, email_id, password, dob, address } =
      req.body;

    // Validate required fields
    if (
      !name ||
      !designation ||
      !contact_no ||
      !email_id ||
      !password ||
      !dob ||
      !address
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if email already exists
    const existingStaff = await Staff.findOne({ email_id });
    if (existingStaff) {
      return res
        .status(400)
        .json({ message: "Staff with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff = new Staff({
      name,
      designation,
      contact_no,
      email_id,
      password: hashedPassword,
      dob,
      address,
    });

    await newStaff.save();

    // Return staff data without password
    const staffResponse = newStaff.toObject();
    delete staffResponse.password;

    res.status(201).json({
      message: "Staff added successfully",
      staff: staffResponse,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding staff", error: error.message });
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

// ✅ NEW: Update staff (including password)
const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, designation, contact_no, email_id, password, dob, address } =
      req.body;

    // Find staff
    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // Check if email is being changed and if new email already exists
    if (email_id && email_id !== staff.email_id) {
      const existingStaff = await Staff.findOne({ email_id });
      if (existingStaff) {
        return res
          .status(400)
          .json({ message: "Email already in use by another staff" });
      }
    }

    // Update fields
    if (name) staff.name = name;
    if (designation) staff.designation = designation;
    if (contact_no) staff.contact_no = contact_no;
    if (email_id) staff.email_id = email_id;
    if (dob) staff.dob = dob;
    if (address) staff.address = address;

    // If password is provided, hash it
    if (password) {
      staff.password = await bcrypt.hash(password, 10);
    }

    await staff.save();

    // Return staff data without password
    const staffResponse = staff.toObject();
    delete staffResponse.password;

    res.status(200).json({
      message: "Staff updated successfully",
      staff: staffResponse,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating staff", error: error.message });
  }
};

// ✅ NEW: Change password for staff
const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    // Validate inputs
    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Old password and new password are required" });
    }

    // Find staff
    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, staff.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Old password is incorrect" });
    }

    // Hash new password
    staff.password = await bcrypt.hash(newPassword, 10);
    await staff.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error changing password", error: error.message });
  }
};

module.exports = {
  getStaff,
  addStaff,
  deleteStaff,
  updateStaff,
  changePassword,
};
