import React, { useState, useEffect } from "react";
import axios from "axios";

const Reports = () => {
  const [activeTab, setActiveTab] = useState("booking");
  const [bookings, setBookings] = useState([]);
  const [busBookings, setBusBookings] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const bookingRes = await axios.get(
        "http://localhost:4000/api/bookings/all",
        { headers }
      );
      setBookings(bookingRes.data);

      const busRes = await axios.get(
        "http://localhost:4000/api/bus-bookings/all",
        { headers }
      );
      setBusBookings(busRes.data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN");
  };

  // Filter by date
  const filterByDate = (data) => {
    if (!fromDate && !toDate) return data;
    return data.filter((item) => {
      const itemDate = new Date(item.createdAt || item.travel_date);
      const from = fromDate ? new Date(fromDate) : new Date("1900-01-01");
      const to = toDate ? new Date(toDate) : new Date("2100-01-01");
      return itemDate >= from && itemDate <= to;
    });
  };

  // Calculate package sales
  const getPackageSales = () => {
    const salesMap = {};
    bookings.forEach((b) => {
      const pkgName = b.package_id?.package_name || "Unknown";
      const pkgId = b.package_id?._id || "N/A";
      if (!salesMap[pkgId]) {
        salesMap[pkgId] = { name: pkgName, count: 0, revenue: 0 };
      }
      salesMap[pkgId].count += 1;
      salesMap[pkgId].revenue += b.total_price || 0;
    });
    return Object.values(salesMap);
  };

  const filteredBookings = filterByDate(bookings);
  const filteredBusBookings = filterByDate(busBookings);
  const packageSales = getPackageSales();

  // Simple PDF Download using browser print
  const downloadPDF = () => {
    window.print();
  };

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">Reports</h3>
        <button className="btn btn-danger" onClick={downloadPDF}>
          📄 Download PDF
        </button>
      </div>

      {/* Date Filter */}
      <div className="row mb-4">
        <div className="col-md-3">
          <label>From Date</label>
          <input
            type="date"
            className="form-control"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <label>To Date</label>
          <input
            type="date"
            className="form-control"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <div className="col-md-3 d-flex align-items-end">
          <button
            className="btn btn-secondary"
            onClick={() => {
              setFromDate("");
              setToDate("");
            }}
          >
            Clear Filter
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-3">
        <button
          className={`btn ${
            activeTab === "booking" ? "btn-primary" : "btn-outline-primary"
          } me-2`}
          onClick={() => setActiveTab("booking")}
        >
          Tour Bookings
        </button>
        <button
          className={`btn ${
            activeTab === "bus" ? "btn-primary" : "btn-outline-primary"
          } me-2`}
          onClick={() => setActiveTab("bus")}
        >
          Bus Bookings
        </button>
        <button
          className={`btn ${
            activeTab === "sales" ? "btn-success" : "btn-outline-success"
          }`}
          onClick={() => setActiveTab("sales")}
        >
          Package Sales
        </button>
      </div>

      {/* Tour Booking Report */}
      {activeTab === "booking" && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0">Tour Booking Report</h5>
            <button
              className="btn btn-sm btn-success"
              onClick={() => downloadCSV("tour")}
            >
              📥 Download CSV
            </button>
          </div>
          <table className="table table-bordered">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Package</th>
                <th>Travel Date</th>
                <th>Persons</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b, i) => (
                <tr key={b._id}>
                  <td>{i + 1}</td>
                  <td>{b.custmer_id?.first_name || "Guest"}</td>
                  <td>{b.package_id?.package_name || "-"}</td>
                  <td>{formatDate(b.travel_date)}</td>
                  <td>{b.travellers}</td>
                  <td>₹{b.total_price}</td>
                  <td>{b.payment_status}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="table-secondary">
              <tr>
                <th colSpan="4">Total</th>
                <th>
                  {filteredBookings.reduce(
                    (sum, b) => sum + (b.travellers || 0),
                    0
                  )}
                </th>
                <th>
                  ₹
                  {filteredBookings
                    .reduce((sum, b) => sum + (b.total_price || 0), 0)
                    .toLocaleString()}
                </th>
                <th></th>
              </tr>
            </tfoot>
          </table>
          <p>
            <strong>Total Records:</strong> {filteredBookings.length}
          </p>
        </div>
      )}

      {/* Bus Booking Report */}
      {activeTab === "bus" && (
        <div>
          <h5>Bus Booking Report</h5>
          <table className="table table-bordered">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Route</th>
                <th>Travel Date</th>
                <th>Seats</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredBusBookings.map((b, i) => (
                <tr key={b._id}>
                  <td>{i + 1}</td>
                  <td>
                    {b.custmer_id?.first_name || b.custmer_id?.name || "Guest"}
                  </td>
                  <td>
                    {b.route_id?.boarding_from} → {b.route_id?.destination}
                  </td>
                  <td>{formatDate(b.travel_date)}</td>
                  <td>{b.seat_numbers?.join(", ")}</td>
                  <td>₹{b.total_amount}</td>
                  <td>{b.booking_status}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="table-secondary">
              <tr>
                <th colSpan="5">Total</th>
                <th>
                  ₹
                  {filteredBusBookings
                    .reduce((sum, b) => sum + (b.total_amount || 0), 0)
                    .toLocaleString()}
                </th>
                <th></th>
              </tr>
            </tfoot>
          </table>
          <p>
            <strong>Total Records:</strong> {filteredBusBookings.length}
          </p>
        </div>
      )}

      {/* Package Sales Report */}
      {activeTab === "sales" && (
        <div>
          <h5>Package Sales Report</h5>
          <table className="table table-bordered">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Package Name</th>
                <th>Total Bookings</th>
                <th>Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {packageSales.map((p, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{p.name}</td>
                  <td>{p.count}</td>
                  <td>₹{p.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="table-secondary">
              <tr>
                <th colSpan="2">Total</th>
                <th>{packageSales.reduce((sum, p) => sum + p.count, 0)}</th>
                <th>
                  ₹
                  {packageSales
                    .reduce((sum, p) => sum + p.revenue, 0)
                    .toLocaleString()}
                </th>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default Reports;
