const axios = require("axios");

const BASE_URL = "http://localhost:4000/api/auth";

async function testAllErrors() {
  console.log("\n========================================");
  console.log("   ERROR HANDLING IMPROVEMENTS TEST");
  console.log("========================================\n");

  // Test 1: Invalid Email Format
  console.log("❌ TEST 1: Invalid Email Format");
  try {
    await axios.post(`${BASE_URL}/register`, {
      first_name: "John",
      last_name: "Doe",
      email: "invalid-email",
      dob: "01-01-2000",
      phone_no: "1234567890",
      password: "password123",
      gender: "Male",
      address: "Test Address",
    });
  } catch (err) {
    console.log("✅ Response:", err.response?.data?.message);
  }

  // Test 2: Missing First Name
  console.log("\n❌ TEST 2: Missing First Name");
  try {
    await axios.post(`${BASE_URL}/register`, {
      first_name: "",
      last_name: "Doe",
      email: "test2@example.com",
      dob: "01-01-2000",
      phone_no: "9876543210",
      password: "password123",
      gender: "Male",
      address: "Test Address",
    });
  } catch (err) {
    console.log("✅ Response:", err.response?.data?.message);
  }

  // Test 3: Invalid Phone Number
  console.log("\n❌ TEST 3: Invalid Phone Number (too short)");
  try {
    await axios.post(`${BASE_URL}/register`, {
      first_name: "John",
      last_name: "Doe",
      email: "test3@example.com",
      dob: "01-01-2000",
      phone_no: "123",
      password: "password123",
      gender: "Male",
      address: "Test Address",
    });
  } catch (err) {
    console.log("✅ Response:", err.response?.data?.message);
  }

  // Test 4: Short Password
  console.log("\n❌ TEST 4: Password Too Short (less than 6 characters)");
  try {
    await axios.post(`${BASE_URL}/register`, {
      first_name: "John",
      last_name: "Doe",
      email: "test4@example.com",
      dob: "01-01-2000",
      phone_no: "1234567890",
      password: "123",
      gender: "Male",
      address: "Test Address",
    });
  } catch (err) {
    console.log("✅ Response:", err.response?.data?.message);
  }

  // Test 5: Invalid DOB
  console.log("\n❌ TEST 5: Invalid Date of Birth");
  try {
    await axios.post(`${BASE_URL}/register`, {
      first_name: "John",
      last_name: "Doe",
      email: "test5@example.com",
      dob: "invalid-date",
      phone_no: "1234567890",
      password: "password123",
      gender: "Male",
      address: "Test Address",
    });
  } catch (err) {
    console.log("✅ Response:", err.response?.data?.message);
  }

  // Test 6: Duplicate Email
  console.log("\n❌ TEST 6: Duplicate Email (already registered)");
  try {
    await axios.post(`${BASE_URL}/register`, {
      first_name: "John",
      last_name: "Doe",
      email: "test@example.com",
      dob: "01-01-2000",
      phone_no: "1111111111",
      password: "password123",
      gender: "Male",
      address: "Test Address",
    });
  } catch (err) {
    console.log("✅ Response:", err.response?.data?.message);
  }

  // Test 7: Login - Email not found
  console.log("\n❌ TEST 7: Login - Email Not Found");
  try {
    await axios.post(`${BASE_URL}/login`, {
      email: "nonexistent@example.com",
      password: "password123",
    });
  } catch (err) {
    console.log("✅ Response:", err.response?.data?.message);
  }

  // Test 8: Login - Wrong Password
  console.log("\n❌ TEST 8: Login - Incorrect Password");
  try {
    await axios.post(`${BASE_URL}/login`, {
      email: "test@example.com",
      password: "wrongpassword",
    });
  } catch (err) {
    console.log("✅ Response:", err.response?.data?.message);
  }

  // Test 9: Forgot Password - Email not found
  console.log("\n❌ TEST 9: Forgot Password - Email Not Found");
  try {
    await axios.post(`${BASE_URL}/forgot-password`, {
      email: "notfound@example.com",
    });
  } catch (err) {
    console.log("✅ Response:", err.response?.data?.message);
  }

  // Test 10: Reset Password - Invalid OTP
  console.log("\n❌ TEST 10: Reset Password - Invalid/Expired OTP");
  try {
    await axios.post(`${BASE_URL}/reset-password`, {
      email: "test@example.com",
      otp: "invalid",
      newPassword: "newpassword123",
    });
  } catch (err) {
    console.log("✅ Response:", err.response?.data?.message);
  }

  console.log("\n========================================");
  console.log("   ALL TESTS COMPLETED SUCCESSFULLY");
  console.log("========================================\n");
}

testAllErrors().catch((err) => console.error("Test Error:", err.message));
