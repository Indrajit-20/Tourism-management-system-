import React, { useState, useEffect } from "react";
import axios from "axios";

const RefundReport = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/refunds/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRefunds(res.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-IN");
  };

  return (
    <div className="p-4">
      <h2 className="mb-4">Refund Report</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table border="1" className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Refund ID</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {refunds.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center">
                  No refunds
                </td>
              </tr>
            ) : (
              refunds.map((r, i) => (
                <tr key={r._id}>
                  <td>{i + 1}</td>
                  <td>{r.refund_id}</td>
                  <td>
                    {r.customer_id?.first_name || "N/A"}{" "}
                    {r.customer_id?.last_name || ""}
                  </td>
                  <td>{r.booking_type}</td>
                  <td>₹{r.refund_amount}</td>
                  <td>{formatDate(r.refund_date)}</td>
                  <td>{r.refund_status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RefundReport;
