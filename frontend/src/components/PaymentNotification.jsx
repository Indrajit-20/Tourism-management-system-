import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL.replace("/api", "");

const PaymentNotification = () => {
  const [unpaidBookings, setUnpaidBookings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const role = sessionStorage.getItem("role");

    // Only run for logged in users — not admin
    if (!token || role === "admin") return;

    // Check immediately when page loads
    checkUnpaidBookings();

    // Then check every 30 seconds automatically
    const interval = setInterval(checkUnpaidBookings, 30000);

    // Cleanup — stop checking when component removed
    return () => clearInterval(interval);
  }, []);

  // Fetch bookings that are Confirmed but not paid yet
  const checkUnpaidBookings = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get(`${API}/api/bus-bookings/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Keep bookings that are confirmed and still pending payment.
      const pendingPayment = (res.data || []).filter(
        (b) =>
          b.booking_status === "Confirmed" && b.payment_status === "Pending"
      );

      setUnpaidBookings(pendingPayment);
    } catch (err) {
      console.error("Error checking notifications", err);
    }
  };

  // If no pending-payment bookings, show nothing.
  if (unpaidBookings.length === 0) return null;

  return (
    <div className="alert alert-warning mb-0 py-2 px-4 rounded-0 border-0">
      <div className="d-flex justify-content-between align-items-center">
        {/* Message */}
        <div className="d-flex align-items-center gap-2">
          <span>⚠️</span>
          <span>
            <strong>
              {unpaidBookings.length === 1
                ? "1 booking"
                : `${unpaidBookings.length} bookings`}
            </strong>{" "}
            confirmed and waiting for payment! Pay within 30 minutes or booking
            will be cancelled.
          </span>
        </div>

        {/* Pay Now button */}
        <button
          className="btn btn-warning btn-sm fw-bold ms-3 border border-dark"
          onClick={() => navigate("/my-bookings")}
          style={{ whiteSpace: "nowrap" }}
        >
          💳 Pay Now
        </button>
      </div>
    </div>
  );
};

export default PaymentNotification;
