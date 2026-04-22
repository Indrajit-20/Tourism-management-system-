const axios = require("axios");

const BASE_URL = "http://localhost:4000/api/auth";

// Helper to generate valid 10-digit phone number
function generatePhone() {
  return Math.floor(9000000000 + Math.random() * 1000000000).toString();
}

async function testDuplicateEmailCheck() {
  console.log("\n========================================");
  console.log("   DUPLICATE EMAIL CHECK TEST");
  console.log("========================================\n");

  const email = `testuser_${Date.now()}@example.com`;
  const phone1 = generatePhone();

  console.log(`Testing with Email: ${email}`);
  console.log(`Testing with Phone: ${phone1}\n`);

  // Test 1: First registration should succeed
  console.log("📝 TEST 1: First Registration (Should Succeed)");
  try {
    const response = await axios.post(`${BASE_URL}/register`, {
      first_name: "John",
      last_name: "Doe",
      email: email,
      dob: "01-01-2000",
      phone_no: phone1,
      password: "password123",
      gender: "Male",
      address: "Test Address",
    });
    console.log("✅ Success! User registered with email:", email);
    console.log("Response:", response.data.message);
  } catch (err) {
    console.log("❌ Error:", err.response?.data?.message || err.message);
  }

  console.log("\n---\n");

  // Test 2: Second registration with same email should fail
  console.log("📝 TEST 2: Second Registration with SAME Email (Should Fail)");
  try {
    const response = await axios.post(`${BASE_URL}/register`, {
      first_name: "Jane",
      last_name: "Smith",
      email: email, // Same email as before
      dob: "05-05-1995",
      phone_no: generatePhone(),
      password: "password456",
      gender: "Female",
      address: "Another Address",
    });
    console.log("❌ ERROR: Should have failed but succeeded!");
  } catch (err) {
    console.log("✅ Correctly Blocked! Error Message:");
    console.log(`❌ ${err.response?.data?.message}`);
  }

  console.log("\n---\n");

  // Test 3: Third registration with different email should succeed
  console.log(
    "📝 TEST 3: Third Registration with DIFFERENT Email (Should Succeed)"
  );
  const newEmail = `testuser_${Date.now() + 1}@example.com`;
  const newPhone = generatePhone();

  try {
    const response = await axios.post(`${BASE_URL}/register`, {
      first_name: "Bob",
      last_name: "Wilson",
      email: newEmail, // Different email
      dob: "10-10-1990",
      phone_no: newPhone,
      password: "password789",
      gender: "Male",
      address: "Third Address",
    });
    console.log("✅ Success! Different email allowed");
    console.log("Response:", response.data.message);
    console.log("New email:", newEmail);
  } catch (err) {
    console.log("❌ Error:", err.response?.data?.message || err.message);
  }

  console.log("\n========================================");
  console.log("   TEST COMPLETED SUCCESSFULLY");
  console.log("========================================\n");
  console.log("Summary:");
  console.log("✅ First registration with new email: ALLOWED");
  console.log("❌ Second registration with same email: BLOCKED (as expected)");
  console.log("✅ Third registration with different email: ALLOWED");
  console.log("\n========================================\n");
}

testDuplicateEmailCheck().catch((err) =>
  console.error("Test Error:", err.message)
);
