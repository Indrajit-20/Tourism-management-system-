const axios = require("axios");

async function testRegistration() {
  try {
    // Test invalid email
    const invalidEmailResponse = await axios.post(
      "http://localhost:4000/api/auth/register",
      {
        first_name: "Test",
        last_name: "User",
        email: "invalid-email",
        dob: "01-01-2000",
        phone_no: "1234567890",
        password: "password123",
        gender: "Male",
        address: "Test Address",
      }
    );
    console.log("Invalid email test:", invalidEmailResponse.data);
  } catch (error) {
    console.log("Invalid email error:", error.response.data);
  }

  try {
    // Test valid email
    const validEmailResponse = await axios.post(
      "http://localhost:4000/api/auth/register",
      {
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
        dob: "01-01-2000",
        phone_no: "1234567890",
        password: "password123",
        gender: "Male",
        address: "Test Address",
      }
    );
    console.log("Valid email test:", validEmailResponse.data);
  } catch (error) {
    console.log("Valid email error:", error.response.data);
  }
}

testRegistration();
