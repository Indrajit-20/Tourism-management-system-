const Staff = require("../models/Staff");
const bcrypt = require("bcryptjs");
const DOB_ERROR_MESSAGE = "Invalid dob. Use dd/mm/yyyy or yyyy-mm-dd";

const formatDobDMY = (value) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();

  return `${day}/${month}/${year}`;
};

const parseDobInput = (value) => {
  if (!value) return null;

  // If already a Date object, return it if valid.
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const text = String(value).trim();
  if (!text) return null;

  // Format 1: dd/mm/yyyy
  if (text.includes("/")) {
    const parts = text.split("/");
    if (parts.length !== 3) return null;

    const [day, month, year] = parts;
    if (day.length !== 2 || month.length !== 2 || year.length !== 4) return null;

    const parsed = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  // Format 2: yyyy-mm-dd
  if (text.includes("-")) {
    const parts = text.split("-");
    if (parts.length !== 3) return null;

    const [year, month, day] = parts;
    if (year.length !== 4 || month.length !== 2 || day.length !== 2) return null;

    const parsed = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
};

const toStaffResponse = (staffDoc) => {
  const staff = staffDoc.toObject ? staffDoc.toObject() : { ...staffDoc };

  // Never send password back to frontend.
  delete staff.password;

  // Send DOB in dd/mm/yyyy only.
  staff.dob = formatDobDMY(staff.dob);

  return staff;
};

const hasRequiredStaffFields = (body) => {
  const { name, designation, contact_no, email_id, password, dob, address } = body;
  return !!(name && designation && contact_no && email_id && password && dob && address);
};

// Get all staff
const getStaff = async (req, res) => {
  try {
    const staffList = await Staff.find().select("-password");
    const response = staffList.map((member) => toStaffResponse(member));
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching staff", error });
  }
};

// Add new staff with password hashing
const addStaff = async (req, res) => {
  try {
    const { name, designation, contact_no, email_id, password, dob, address } = req.body;

    if (!hasRequiredStaffFields(req.body)) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const staffWithSameEmail = await Staff.findOne({ email_id });
    if (staffWithSameEmail) {
      return res
        .status(400)
        .json({ message: "Staff with this email already exists" });
    }

    const parsedDob = parseDobInput(dob);
    if (!parsedDob) {
      return res.status(400).json({ message: DOB_ERROR_MESSAGE });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = new Staff({
      name,
      designation,
      contact_no,
      email_id,
      password: hashedPassword,
      dob: parsedDob,
      address,
    });

    await staff.save();
    const staffResponse = toStaffResponse(staff);

    return res.status(201).json({
      message: "Staff added successfully",
      staff: staffResponse,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error adding staff", error: error.message });
  }
};

// Delete staff
const deleteStaff = async (req, res) => {
  try {
    await Staff.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Staff deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting staff", error });
  }
};

// ✅ NEW: Update staff (including password)
const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, designation, contact_no, email_id, password, dob, address } = req.body;

    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    if (email_id && email_id !== staff.email_id) {
      const staffWithSameEmail = await Staff.findOne({ email_id });
      if (staffWithSameEmail) {
        return res
          .status(400)
          .json({ message: "Email already in use by another staff" });
      }
    }

    if (name) staff.name = name;
    if (designation) staff.designation = designation;
    if (contact_no) staff.contact_no = contact_no;
    if (email_id) staff.email_id = email_id;

    if (dob) {
      const parsedDob = parseDobInput(dob);
      if (!parsedDob) {
        return res.status(400).json({ message: DOB_ERROR_MESSAGE });
      }
      staff.dob = parsedDob;
    }

    if (address) staff.address = address;

    if (password) {
      staff.password = await bcrypt.hash(password, 10);
    }

    await staff.save();
    const staffResponse = toStaffResponse(staff);

    return res.status(200).json({
      message: "Staff updated successfully",
      staff: staffResponse,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error updating staff", error: error.message });
  }
};

// ✅ NEW: Change password for staff
const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Old password and new password are required" });
    }

    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, staff.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Old password is incorrect" });
    }

    staff.password = await bcrypt.hash(newPassword, 10);
    await staff.save();

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    return res
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
