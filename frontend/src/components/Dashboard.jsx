import React, { useEffect, useState } from "react";
import axios from "axios";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalPackageBookings: 0,
    totalBusBookings: 0,
    totalRevenue: 0,
    pendingBookings: 0,
    totalPackages: 0,
    recentTransactions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:4000/api/admin-stats/dashboard-stats",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (res.data) setStats(res.data);
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading)
    return (
      <div className="text-center mt-5 p-5">Loading Dashboard Data...</div>
    );

  return (
    <div className="container-fluid p-0 mb-5">
      <h3 className="mb-4 fw-bold pb-2 border-bottom">System Overview</h3>

      <div className="row g-4 mb-5">
        {/* Total Customers */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white border-start border-4 border-primary position-relative overflow-hidden">
            <h6 className="opacity-75 mb-1 small fw-bold text-uppercase text-muted">
              Total Customers
            </h6>
            <h2 className="mb-0 fw-bold display-6">{stats.totalCustomers}</h2>
            <i
              className="bi bi-people-fill position-absolute text-primary opacity-25"
              style={{ fontSize: "5rem", right: "-10px", bottom: "-15px" }}
            ></i>
          </div>
        </div>

        {/* Total Package Bookings */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white border-start border-4 border-info position-relative overflow-hidden">
            <h6 className="opacity-75 mb-1 small fw-bold text-uppercase text-muted">
              Package Bookings
            </h6>
            <h2 className="mb-0 fw-bold display-6">
              {stats.totalPackageBookings}
            </h2>
            <i
              className="bi bi-geo-alt-fill position-absolute text-info opacity-25"
              style={{ fontSize: "5rem", right: "-10px", bottom: "-15px" }}
            ></i>
          </div>
        </div>

        {/* Total Bus Bookings */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white border-start border-4 border-success position-relative overflow-hidden">
            <h6 className="opacity-75 mb-1 small fw-bold text-uppercase text-muted">
              Bus Bookings
            </h6>
            <h2 className="mb-0 fw-bold display-6">{stats.totalBusBookings}</h2>
            <i
              className="bi bi-bus-front-fill position-absolute text-success opacity-25"
              style={{ fontSize: "5rem", right: "-10px", bottom: "-15px" }}
            ></i>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-dark text-white position-relative overflow-hidden">
            <h6 className="opacity-75 mb-1 small fw-bold text-uppercase">
              Total Revenue (INR)
            </h6>
            <h2 className="mb-0 fw-bold display-6">
              ₹{stats.totalRevenue.toLocaleString()}
            </h2>
            <i
              className="bi bi-wallet-fill position-absolute text-white opacity-25"
              style={{ fontSize: "5rem", right: "-10px", bottom: "-15px" }}
            ></i>
          </div>
        </div>

        {/* Pending Bookings */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white border-start border-4 border-warning position-relative overflow-hidden">
            <h6 className="opacity-75 mb-1 small fw-bold text-uppercase text-muted">
              Pending Bookings
            </h6>
            <h2 className="mb-0 fw-bold display-6">{stats.pendingBookings}</h2>
            <i
              className="bi bi-hourglass-split position-absolute text-warning opacity-25"
              style={{ fontSize: "5rem", right: "-10px", bottom: "-15px" }}
            ></i>
          </div>
        </div>

        {/* Total Packages */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white border-start border-4 border-secondary position-relative overflow-hidden">
            <h6 className="opacity-75 mb-1 small fw-bold text-uppercase text-muted">
              Active Packages
            </h6>
            <h2 className="mb-0 fw-bold display-6">{stats.totalPackages}</h2>
            <i
              className="bi bi-box-seam-fill position-absolute text-secondary opacity-25"
              style={{ fontSize: "5rem", right: "-10px", bottom: "-15px" }}
            ></i>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="card border-0 shadow-sm rounded-4 p-0 overflow-hidden">
        <div className="card-header bg-white border-bottom p-4">
          <h5 className="mb-0 fw-bold p-3 bg-info bg-opacity-10 border border-info border-start-0 rounded-end">
            Recent Payments & Bookings
          </h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light color-muted">
                <tr className="text-muted small text-uppercase ">
                  <th className="px-4 py-3">Customer</th>
                  <th className="py-3">Type</th>
                  <th className="py-3">Date</th>
                  <th className="py-3">Amount</th>
                  <th className="py-3">Payment Status</th>
                  <th className="px-4 py-3">Booking Status</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "0.9rem" }}>
                {stats.recentTransactions &&
                stats.recentTransactions.length > 0 ? (
                  stats.recentTransactions.map((tx, idx) => (
                    <tr key={idx} className="border-bottom">
                      <td className="px-4 fw-bold py-3">{tx.customerName}</td>
                      <td>
                        <span
                          className={`badge rounded-pill ${
                            tx.type === "Tour Package"
                              ? "bg-primary-subtle text-primary"
                              : "bg-success-subtle text-success"
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="text-muted">
                        {new Date(tx.date).toLocaleDateString()}
                      </td>
                      <td className="fw-bold fs-6">
                        ₹{tx.amount.toLocaleString()}
                      </td>
                      <td>
                        <span className={`badge bg-success rounded-pill px-3`}>
                          <i className="bi bi-check-circle me-1"></i> Paid
                        </span>
                      </td>
                      <td className="px-4">
                        <span
                          className={`badge ${
                            tx.status === "Active" || tx.status === "Confirmed"
                              ? "bg-info"
                              : "bg-warning"
                          } rounded-pill`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">
                      No recent transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
