const Custmer = require("../models/Custmer");
const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Staff = require("../models/Staff");
const { toDMY } = require("../utils/dobHelper");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const validator = require("validator");

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

    // Validate required fields
    if (!first_name || !first_name.trim()) {
      return res.status(400).json({ message: "First name is required" });
    }
    if (!last_name || !last_name.trim()) {
      return res.status(400).json({ message: "Last name is required" });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!phone_no || !phone_no.trim()) {
      return res.status(400).json({ message: "Mobile number is required" });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ message: "Password is required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ message: "Invalid email format. Please enter a valid email" });
    }

    // Validate phone number (10-13 digits)
    if (!/^\d{10,13}$/.test(phone_no)) {
      return res
        .status(400)
        .json({ message: "Mobile number must be 10-13 digits" });
    }

    const exitsuser = await Custmer.findOne({ email });
    if (exitsuser) {
      return res.status(400).json({
        message:
          "Email already registered. Please login or use a different email",
      });
    }

    // Check if phone already exists
    const existingPhone = await Custmer.findOne({ phone_no });
    if (existingPhone) {
      return res
        .status(400)
        .json({ message: "This mobile number is already registered" });
    }

    const normalizedDob = toDMY(dob);
    if (!normalizedDob) {
      return res.status(400).json({
        message: "Invalid date of birth. Use DD-MM-YYYY or YYYY-MM-DD format",
      });
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
    console.error("Registration error:", err);

    // Handle specific Mongoose validation errors
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        message: "Registration Failed - Validation Error",
        details: messages.join(", "),
      });
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({
        message: `Registration Failed - ${
          field === "email" ? "Email" : "Mobile number"
        } already exists`,
      });
    }

    res.status(500).json({
      message: "Registration Failed - Server Error",
      error: err.message,
    });
  }
};

// Unified Login for Customer and Admin
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Validate required fields
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ message: "Password is required" });
    }

    let user = await Custmer.findOne({ email });
    let role = "user";

    // If not found in Customer, check Admin
    if (!user) {
      user = await Admin.findOne({ email });
      role = "admin";
    }
    // Check Staff
    if (!user) {
      user = await Staff.findOne({ email });

      if (user) {
        role = user.designation; // driver or guide
      }
    }

    // If still not found, return error
    if (!user) {
      return res
        .status(401)
        .json({ message: "Email not found. Please register first" });
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
      return res
        .status(401)
        .json({ message: "Incorrect password. Please try again" });
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
    console.error("Login error:", err);
    res
      .status(500)
      .json({ message: "Login Failed - Server Error", error: err.message });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    // Validate email
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    let user = await Custmer.findOne({ email });
    let role = "user";

    if (!user) {
      user = await Admin.findOne({ email });
      role = "admin";
    }

    if (!user) {
      user = await Staff.findOne({ email });
      if (user) role = user.designation;
    }

    if (!user) {
      return res.status(404).json({
        message: "Email not found in our system. Please check and try again",
      });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // In a real app, you might want to hash this before saving
    user.resetPasswordToken = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    const message = `Your password reset OTP is: ${otp}\n\nThis OTP is valid for 10 minutes only.\n\nIf you did not request this, please ignore this email.`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset OTP - Tourism Management System",
        message,
      });

      res.status(200).json({
        message:
          "OTP sent successfully to your registered email. Please check your inbox (or spam folder)",
      });
    } catch (err) {
      console.error("EMAIL ERROR:", err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return res.status(500).json({
        message:
          "Failed to send OTP email - Please check your email configuration or try again later",
        error: err.message,
      });
    }
  } catch (err) {
    console.error("Forgot Password error:", err);
    res.status(500).json({
      message: "Forgot Password Failed - Server Error",
      error: err.message,
    });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    // Validate required fields
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!otp || !otp.trim()) {
      return res.status(400).json({ message: "OTP is required" });
    }
    if (!newPassword || !newPassword.trim()) {
      return res.status(400).json({ message: "New password is required" });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    let user = await Custmer.findOne({
      email,
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      user = await Admin.findOne({
        email,
        resetPasswordToken: otp,
        resetPasswordExpires: { $gt: Date.now() },
      });
    }

    if (!user) {
      user = await Staff.findOne({
        email,
        resetPasswordToken: otp,
        resetPasswordExpires: { $gt: Date.now() },
      });
    }

    if (!user) {
      return res.status(400).json({
        message:
          "Invalid OTP or OTP has expired (valid for 10 minutes only). Please request a new OTP",
      });
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({
      message:
        "Password updated successfully. Please login with your new password",
    });
  } catch (err) {
    console.error("Reset Password error:", err);
    res.status(500).json({
      message: "Reset Password Failed - Server Error",
      error: err.message,
    });
  }
};

module.exports = { register, login, forgotPassword, resetPassword };
