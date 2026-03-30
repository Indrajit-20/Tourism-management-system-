const custmer = require("../models/Custmer");
const { toDMY, dmyToYmd } = require("../utils/dobHelper");

const toCustomerListResponse = (doc) => {
  const row = doc.toObject ? doc.toObject() : doc;
  const normalizedDob = toDMY(row.dob);
  return {
    ...row,
    dob: normalizedDob,
    dob_iso: dmyToYmd(normalizedDob),
  };
};

const getCustmer = async (req, res) => {
  try {
    const cust = await custmer.find().sort({ createdAt: -1 }).lean();
    res.status(200).json(cust.map(toCustomerListResponse));
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

const deleteCustmer = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await custmer.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await custmer.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json({
      message: "Profile fetched successfully",
      user: {
        _id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone_no: user.phone_no,
        dob: toDMY(user.dob),
        dob_display: toDMY(user.dob),
        gender: user.gender,
        address: user.address,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Update user profile (email and phone_no cannot be updated)
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { first_name, last_name, dob, gender, address } = req.body;

    const user = await custmer.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Update only allowed fields
    if (first_name) user.first_name = first_name;
    if (last_name) user.last_name = last_name;
    if (dob) {
      const normalizedDob = toDMY(dob);
      if (!normalizedDob) {
        return res
          .status(400)
          .json({ message: "Invalid dob. Use DD-MM-YYYY or YYYY-MM-DD" });
      }
      user.dob = normalizedDob;
    }
    if (gender) user.gender = gender;
    if (address) user.address = address;

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone_no: user.phone_no,
        dob: toDMY(user.dob),
        dob_display: toDMY(user.dob),
        gender: user.gender,
        address: user.address,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { getCustmer, deleteCustmer, getProfile, updateProfile };
