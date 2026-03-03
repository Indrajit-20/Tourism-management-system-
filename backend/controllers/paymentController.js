const Razorpay = require("razorpay");

// 1. Initialize Razorpay with your brand new Test Keys
const razorpay = new Razorpay({
  key_id: "rzp_test_SMPUHkAalgy2kE",
  key_secret: "pmiw86K2FG0k5bnfL33OtI4B",
});

// 2. Create the Order API
const createOrder = async (req, res) => {
  try {
    const { amount } = req.body; // React will send the total amount here

    const options = {
      amount: amount * 100, // Razorpay needs the amount in Paise (multiply by 100)
      currency: "INR",
      receipt: "receipt_" + Math.random().toString(36).substring(7),
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create Razorpay order" });
  }
};

module.exports = { createOrder };
