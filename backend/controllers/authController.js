const Custmer = require("../models/Custmer");
const Admin = require("../models/admin");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Staff = require("../models/Staff");
const { toDMY } = require("../utils/dobHelper");

//Register

const register = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      dob,
      phone_no,
      password,
      gender,
      address,
    } = req.body;

    const exitsuser = await Custmer.findOne({ email });
    if (exitsuser) {
      return res.status(400).json({ message: "Custmer already register" });
    }

    const normalizedDob = toDMY(dob);
    if (!normalizedDob) {
      return res
        .status(400)
        .json({ message: "Invalid dob. Use DD-MM-YYYY or YYYY-MM-DD" });
    }

    // hash password before saving
    const hashed = await bcrypt.hash(password, 10);

    const newCustmer = new Custmer({
      first_name,
      last_name,
      email,
      dob: normalizedDob,
      phone_no,
      password: hashed,
      gender,
      address,
    });

    await newCustmer.save();
    return res
      .status(201)
      .json({ message: "Registration Successfully", Custmer: newCustmer });
  } catch (err) {
    res.status(500).json({
      message: "Registration Failed",
      error: err.message,
    });
  }
};

// Unified Login for Customer and Admin
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await Custmer.findOne({ email });
    let role = "user";

    // If not found in Customer, check Admin
    if (!user) {
      user = await Admin.findOne({ email });
      role = "admin";
    }
    // 3️Check Staff
    if (!user) {
      user = await Staff.findOne({ email });

      if (user) {
        role = user.designation; // driver or guide
      }
    }

    // If still not found, return error
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Verify Password
    // Check if the stored password
    let isMatch = false;
    if (user.password && !user.password.startsWith("$2")) {
      isMatch = password === user.password;
    } else {
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const displayName =
      user.name ||
      (user.first_name ? `${user.first_name} ${user.last_name}` : user.email);
    const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key_123";

    // Create Token
    const token = jwt.sign(
      { id: user._id, role, email: user.email },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: `Login successful as ${role}`,
      token: token,
      role: role,
      user_id: user._id,
      name: displayName,
    });
  } catch (err) {
    res.status(500).json({ message: "Login Failed", error: err.message });
  }
};

module.exports = { register, login };
