const Staff = require("../models/Staff");
const bcrypt = require("bcryptjs");
const { toDMY } = require("../utils/dobHelper");
const DOB_ERROR_MESSAGE = "Invalid dob. Use DD-MM-YYYY or YYYY-MM-DD";

const toStaffResponse = (staffDoc) => {
  const staff = staffDoc.toObject ? staffDoc.toObject() : { ...staffDoc };

  // Never send password back to frontend.
  delete staff.password;

  // Send DOB in DD-MM-YYYY only.
  staff.dob = toDMY(staff.dob);

  // Format date_of_joining in DD-MM-YYYY only.
  if (staff.date_of_joining) {
    staff.date_of_joining = toDMY(staff.date_of_joining);
  }

  return staff;
};

const hasRequiredStaffFields = (body) => {
  const { name, designation, contact_no, email, password, dob, address } = body;
  const isDriver = designation === "driver";
  const hasDriverLicense = body.driver_license && body.driver_license.trim();

  // Driver license is required for drivers
  if (isDriver && !hasDriverLicense) {
    return false;
  }

  // These fields are required
  return !!(
    name &&
    designation &&
    contact_no &&
    email &&
    password &&
    dob &&
    address
  );
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
    const {
      name,
      designation,
      contact_no,
      email,
      password,
      dob,
      address,
      driver_license,
      date_of_joining,
      experience,
    } = req.body;

    if (!hasRequiredStaffFields(req.body)) {
      if (designation === "driver" && !driver_license) {
        return res
          .status(400)
          .json({ message: "Driving licence is required for drivers" });
      }
      return res.status(400).json({ message: "All fields are required" });
    }

    const staffWithSameEmail = await Staff.findOne({ email });
    if (staffWithSameEmail) {
      return res
        .status(400)
        .json({ message: "Staff with this email already exists" });
    }

    const normalizedDob = toDMY(dob);
    if (!normalizedDob) {
      return res.status(400).json({ message: DOB_ERROR_MESSAGE });
    }

    const normalizedJoiningDate = toDMY(date_of_joining);
    if (!normalizedJoiningDate) {
      return res.status(400).json({
        message: "Invalid date_of_joining. Use DD-MM-YYYY or YYYY-MM-DD",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = new Staff({
      name,
      designation,
      contact_no,
      email,
      password: hashedPassword,
      dob: normalizedDob,
      address,
      driver_license,
      date_of_joining: normalizedJoiningDate,
      experience,
    });

    await staff.save();

    const staffResponse = toStaffResponse(staff);

    return res.status(201).json({
      message: "Staff added successfully",
      staff: staffResponse,
    });
  } catch (error) {
    console.error("❌ AddStaff Error:", error);
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

// Get available staff for a given date range and designation
const getAvailableStaff = async (req, res) => {
  try {
    const { start_date, end_date, designation } = req.query;

    if (!start_date || !end_date || !designation) {
      return res.status(400).json({
        message: "Start date, end date, and designation are required",
      });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const TourSchedule = require("../models/TourSchedule");
    const BusTrip = require("../models/BusTrip");

    // 1. Find assigned staff from Tour Schedules
    const overlappingTours = await TourSchedule.find({
      $or: [{ start_date: { $lte: endDate }, end_date: { $gte: startDate } }],
      departure_status: { $nin: ["Completed", "Archived"] },
    }).select("driver_id guide_id");

    const assignedStaffIds = new Set();
    overlappingTours.forEach((tour) => {
      if (tour.driver_id) assignedStaffIds.add(tour.driver_id.toString());
      if (tour.guide_id) assignedStaffIds.add(tour.guide_id.toString());
    });

    // 2. Find assigned drivers from Bus Trips (if designation is driver)
    if (String(designation).toLowerCase().includes("driver")) {
      const overlappingTrips = await BusTrip.find({
        trip_date: { $gte: startDate, $lte: endDate },
      }).select("driver_id");

      overlappingTrips.forEach((trip) => {
        if (trip.driver_id) assignedStaffIds.add(trip.driver_id.toString());
      });
    }

    // Find all staff who are NOT assigned
    const availableStaff = await Staff.find({
      designation: { $regex: new RegExp(designation, "i") },
      _id: { $nin: Array.from(assignedStaffIds) },
    }).select("-password");

    const response = availableStaff.map((member) => toStaffResponse(member));
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching available staff:", error);
    return res
      .status(500)
      .json({ message: "Error fetching available staff", error });
  }
};

// ✅ NEW: Update staff (including password)
const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      designation,
      contact_no,
      email,
      password,
      dob,
      address,
      driver_license,
      date_of_joining,
      experience,
    } = req.body;

    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    if (email && email !== staff.email) {
      const staffWithSameEmail = await Staff.findOne({ email });
      if (staffWithSameEmail) {
        return res
          .status(400)
          .json({ message: "Email already in use by another staff" });
      }
    }

    if (name) staff.name = name;
    if (designation) staff.designation = designation;
    if (contact_no) staff.contact_no = contact_no;
    if (email) staff.email = email;

    if (dob) {
      const normalizedDob = toDMY(dob);
      if (!normalizedDob) {
        return res.status(400).json({ message: DOB_ERROR_MESSAGE });
      }
      staff.dob = normalizedDob;
    }

    if (address) staff.address = address;
    if (driver_license) staff.driver_license = driver_license;

    if (date_of_joining) {
      const normalizedJoiningDate = toDMY(date_of_joining);
      if (!normalizedJoiningDate) {
        return res.status(400).json({
          message: "Invalid date_of_joining. Use DD-MM-YYYY or YYYY-MM-DD",
        });
      }
      staff.date_of_joining = normalizedJoiningDate;
    }

    if (experience) staff.experience = experience;

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
  getAvailableStaff, // Export the new function
};
