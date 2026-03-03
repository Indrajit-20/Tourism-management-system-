import React from "react";
import axios from "axios";

const PaymentButton = ({ amount }) => {
  const handlePayment = async () => {
    try {
      // 1. Call your backend to create an order
      const res = await axios.post(
        "http://localhost:4000/api/payment/create-order",
        { amount }
      );
      const order = res.data;

      // 2. Set up Razorpay Checkout
      const options = {
        key: "rzp_test_SMPUHkAalgy2kE", // Paste your Test Key ID here
        amount: order.amount,
        currency: "INR",
        name: "Tourism mangment", // Project name
        order_id: order.id, // Order ID from backend
        handler: function (response) {
          // This runs when payment is successful
          alert("Payment Successful! ID: " + response.razorpay_payment_id);
        },
      };

      // 3. Open the payment window
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error(error);
      alert("Something went wrong!");
    }
  };

  // ADDING type="button" PREVENTS THE PAGE FROM REFRESHING AND CLOSING THE POPUP
  return (
    <button
      type="button"
      onClick={handlePayment}
      className="btn btn-success mt-2"
    >
      Pay Now
    </button>
  );
};

export default PaymentButton;
