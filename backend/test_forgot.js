const axios = require("axios");

async function testForgotPassword() {
  try {
    // Test forgot password with registered email
    const response = await axios.post(
      "http://localhost:4000/api/auth/forgot-password",
      {
        email: "test@example.com",
      }
    );
    console.log("Forgot password test:", response.data);
  } catch (error) {
    console.log("Forgot password error:", error.response.data);
  }

  try {
    // Test with non-existent email
    const response2 = await axios.post(
      "http://localhost:4000/api/auth/forgot-password",
      {
        email: "nonexistent@example.com",
      }
    );
    console.log("Non-existent email test:", response2.data);
  } catch (error) {
    console.log("Non-existent email error:", error.response.data);
  }
}

testForgotPassword();
