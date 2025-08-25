const axios = require("axios");

const testRegisterEndpoint = async () => {
  try {
    const response = await axios.post(
      "http://localhost:8001/api/auth/register",
      {
        email: "test@example.com",
        name: "Test User",
        password: "password123",
      },
    );

    console.log("Registration successful:", response.data);
  } catch (error) {
    if (error.response) {
      console.error("Registration failed:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }
  }
};

testRegisterEndpoint();
