import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:4000";

const PaymentNotification = () => {
  const [approvedBookings, setApprovedBookings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role  = localStorage.getItem("role");

    // Only run for logged in users — not admin
    if (!token || role === "admin") return;

    // Check immediately when page loads
    checkApprovedBookings();

    // Then check every 30 seconds automatically
    const interval = setInterval(checkApprovedBookings, 30000);

    // Cleanup — stop checking when component removed
    return () => clearInterval(interval);
  }, []);

  // Fetch bookings that are Approved but not paid yet
  const checkApprovedBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/bus-bookings/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Only keep bookings where admin approved but user not paid yet
      const approved = (res.data || []).filter(
        b => b.booking_status === "Approved" && b.payment_status === "Pending"
      );

      setApprovedBookings(approved);
    } catch (err) {
      console.error("Error checking notifications", err);
    }
  };

  // If no approved bookings — show nothing
  if (approvedBookings.length === 0) return null;

  return (
    <div className="alert alert-warning mb-0 py-2 px-4 rounded-0 border-0">
      <div className="d-flex justify-content-between align-items-center">

        {/* Message */}
        <div className="d-flex align-items-center gap-2">
          <span>⚠️</span>
          <span>
            <strong>
              {approvedBookings.length === 1
                ? "1 booking"
                : `${approvedBookings.length} bookings`}
            </strong>
            {" "}approved and waiting for payment!
            {" "}Pay within 30 minutes or booking will be cancelled.
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

export default PaymentNotification