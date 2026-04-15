import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import Storage from "../utils/storage";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "../css/advancedReports.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

const AdvancedReports = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [bookings, setBookings] = useState([]);
  const [busBookings, setBusBookings] = useState([]);
  const [stats, setStats] = useState({});
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const printContainerRef = useRef(null);

  const token = Storage.getToken();
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchData();
  }, [fromDate, toDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all data
      const bookingRes = await axios.get(
        "http://localhost:4000/api/bookings/all",
        { headers },
      );
      setBookings(bookingRes.data || []);

      const busRes = await axios.get(
        "http://localhost:4000/api/bus-bookings/all",
        { headers },
      );
      setBusBookings(busRes.data || []);

      const statsRes = await axios.get(
        "http://localhost:4000/api/admin-stats/dashboard-stats",
        { headers },
      );
      setStats(statsRes.data || {});
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN");
  };

  // Filter by date range
  const filterByDate = (data) => {
    if (!fromDate && !toDate) return data;
    return data.filter((item) => {
      const itemDate = new Date(item.createdAt || item.travel_date);
      const from = fromDate ? new Date(fromDate) : new Date("1900-01-01");
      const to = toDate ? new Date(toDate) : new Date("2100-01-01");
      return itemDate >= from && itemDate <= to;
    });
  };

  const filteredBookings = filterByDate(bookings);
  const filteredBusBookings = filterByDate(busBookings);

  const getCustomerName = (booking) => {
    const customer = booking?.customer_id || booking?.Custmer_id;
    if (!customer) return "N/A";
    const first = String(customer.first_name || "").trim();
    const last = String(customer.last_name || "").trim();
    const fullName = `${first} ${last}`.trim();
    return fullName || customer.email || "N/A";
  };

  const getPackageName = (booking) => {
    const pkg = booking?.package_id || booking?.Package_id;
    return pkg?.package_name || pkg?.title || "N/A";
  };

  const getBookingAmount = (booking) =>
    Number(booking?.total_amount || booking?.total_price || 0);

  const getStatusBadgeClass = (status) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "confirmed" || normalized === "completed") {
      return "bg-success";
    }
    if (normalized === "cancelled" || normalized === "rejected") {
      return "bg-danger";
    }
    if (normalized === "approved") {
      return "bg-info";
    }
    return "bg-warning";
  };

  const getTopCustomers = () => {
    const customerMap = {};
    const allBookings = [
      ...(filteredBookings || []),
      ...(filteredBusBookings || []),
    ];

    allBookings.forEach((b) => {
      if (!b) return;
      const name = getCustomerName(b);

      if (!customerMap[name]) customerMap[name] = { name, spent: 0, count: 0 };
      customerMap[name].spent += getBookingAmount(b);
      customerMap[name].count += 1;
    });

    return Object.values(customerMap)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);
  };

  const topCustomers = getTopCustomers();

  // Revenue by date (last 30 days)
  const getRevenueByDate = () => {
    const last30Days = {};
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      last30Days[dateStr] = 0;
    }

    filteredBookings.forEach((b) => {
      const dateStr = new Date(b.createdAt).toISOString().split("T")[0];
      if (dateStr in last30Days) {
        last30Days[dateStr] += b.total_amount || 0;
      }
    });

    filteredBusBookings.forEach((b) => {
      const dateStr = new Date(b.createdAt).toISOString().split("T")[0];
      if (dateStr in last30Days) {
        last30Days[dateStr] += b.total_amount || 0;
      }
    });

    return {
      labels: Object.keys(last30Days).map((d) =>
        new Date(d).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        }),
      ),
      data: Object.values(last30Days),
    };
  };

  // Package sales breakdown
  const getPackageSales = () => {
    const salesMap = {};
    filteredBookings.forEach((b) => {
      const pkgName = getPackageName(b);
      if (!salesMap[pkgName]) {
        salesMap[pkgName] = 0;
      }
      salesMap[pkgName] += getBookingAmount(b);
    });
    return {
      labels: Object.keys(salesMap),
      data: Object.values(salesMap),
    };
  };

  // Monthly revenue
  const getMonthlyRevenue = () => {
    const monthlyData = {};
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    months.forEach((m) => (monthlyData[m] = 0));

    filteredBookings.forEach((b) => {
      const month = new Date(b.createdAt).getMonth();
      monthlyData[months[month]] += b.total_amount || 0;
    });

    filteredBusBookings.forEach((b) => {
      const month = new Date(b.createdAt).getMonth();
      monthlyData[months[month]] += b.total_amount || 0;
    });

    return {
      labels: months,
      data: Object.values(monthlyData),
    };
  };

  // Booking status breakdown
  const getBookingStatus = () => {
    const statusMap = {};

    // Process tour bookings
    filteredBookings.forEach((b) => {
      let status = b.booking_status || "Pending";
      // Normalize status string (capitalize first letter)
      status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
      statusMap[status] = (statusMap[status] || 0) + 1;
    });

    // Process bus bookings
    filteredBusBookings.forEach((b) => {
      let status = b.booking_status || "Pending";
      status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
      statusMap[status] = (statusMap[status] || 0) + 1;
    });

    const definedColors = {
      Confirmed: "#198754", // Success Green
      Completed: "#0d6efd", // Blue
      Pending: "#ffc107", // Warning Yellow
      Cancelled: "#dc3545", // Danger Red
      Rejected: "#6c757d", // Secondary Gray
    };

    const labels = Object.keys(statusMap);
    const backgroundColors = labels.map(
      (label) => definedColors[label] || "#adb5bd",
    );

    return {
      labels: labels,
      data: Object.values(statusMap),
      colors: backgroundColors,
    };
  };

  // Calculate totals
  const calculateTotals = () => {
    const totalTourRevenue = filteredBookings.reduce(
      (sum, b) => sum + getBookingAmount(b),
      0,
    );
    const totalBusRevenue = filteredBusBookings.reduce(
      (sum, b) => sum + (b.total_amount || 0),
      0,
    );
    const totalBookings = filteredBookings.length + filteredBusBookings.length;
    const avgBookingValue =
      totalBookings > 0
        ? ((totalTourRevenue + totalBusRevenue) / totalBookings).toFixed(2)
        : 0;

    return {
      totalTourRevenue,
      totalBusRevenue,
      totalRevenue: totalTourRevenue + totalBusRevenue,
      totalBookings,
      avgBookingValue,
      tourBookings: filteredBookings.length,
      busBookings: filteredBusBookings.length,
    };
  };

  const getFilteredTotalRevenue = () => {
    let total = 0;
    filteredBookings.forEach((b) => (total += Number(b.total_amount || 0)));
    filteredBusBookings.forEach((b) => (total += Number(b.total_amount || 0)));
    return total;
  };

  const getFilteredTourRevenue = () => {
    return filteredBookings.reduce(
      (sum, b) => sum + Number(b.total_amount || 0),
      0,
    );
  };

  const totals = calculateTotals();
  const revenueByDate = getRevenueByDate();
  const packageSales = getPackageSales();
  const monthlyRevenue = getMonthlyRevenue();
  const bookingStatus = getBookingStatus();

  // Chart configurations
  const revenueChartConfig = {
    labels: revenueByDate.labels,
    datasets: [
      {
        label: "Daily Revenue (₹)",
        data: revenueByDate.data,
        borderColor: "#0d6efd",
        backgroundColor: "rgba(13, 110, 253, 0.1)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#0d6efd",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const monthlyChartConfig = {
    labels: monthlyRevenue.labels,
    datasets: [
      {
        label: "Tour Package Revenue (₹)",
        data: monthlyRevenue.data.slice(0, 6),
        backgroundColor: "rgba(13, 110, 253, 0.8)",
        borderColor: "#0d6efd",
        borderWidth: 1,
      },
      {
        label: "Bus Revenue (₹)",
        data: monthlyRevenue.data.slice(6, 12),
        backgroundColor: "rgba(25, 135, 84, 0.8)",
        borderColor: "#198754",
        borderWidth: 1,
      },
    ],
  };

  const packageChartConfig = {
    labels: packageSales.labels,
    datasets: [
      {
        label: "Package Revenue (₹)",
        data: packageSales.data,
        backgroundColor: [
          "rgba(255, 99, 132, 0.8)",
          "rgba(54, 162, 235, 0.8)",
          "rgba(255, 206, 86, 0.8)",
          "rgba(75, 192, 192, 0.8)",
          "rgba(153, 102, 255, 0.8)",
          "rgba(255, 159, 64, 0.8)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const statusChartConfig = {
    labels: bookingStatus.labels,
    datasets: [
      {
        label: "Bookings",
        data: bookingStatus.data,
        backgroundColor: bookingStatus.colors,
        hoverOffset: 15,
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          font: { size: 12, weight: "bold" },
          padding: 15,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: { size: 14, weight: "bold" },
        bodyFont: { size: 13 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: { size: 11 },
          callback: function (value) {
            return "₹" + value.toLocaleString();
          },
        },
      },
      x: {
        ticks: {
          font: { size: 11 },
        },
      },
    },
  };

  const statusOptions = {
    ...chartOptions,
    scales: {
      x: { display: false },
      y: { display: false },
    },
    plugins: {
      ...chartOptions.plugins,
      legend: {
        ...chartOptions.plugins.legend,
        position: "top",
      },
    },
  };

  const getActiveTabTitle = () => {
    if (activeTab === "overview") return "Overview";
    if (activeTab === "revenue") return "Revenue Analysis";
    if (activeTab === "packages") return "Package Analysis";
    return "Bookings Details";
  };

  const downloadPDF = () => {
    const container = printContainerRef.current;
    if (!container) return;

    const sectionMap = {
      overview: "advanced-report-overview",
      revenue: "advanced-report-revenue",
      packages: "advanced-report-packages",
      bookings: "advanced-report-bookings",
    };

    const activeSection = container.querySelector(`#${sectionMap[activeTab]}`);
    if (!activeSection) return;

    const clonedSection = activeSection.cloneNode(true);

    // Canvas drawings are not preserved by cloneNode in many browsers.
    // Convert rendered chart canvases to static images for reliable PDF output.
    const originalCanvases = activeSection.querySelectorAll("canvas");
    const clonedCanvases = clonedSection.querySelectorAll("canvas");
    clonedCanvases.forEach((canvas, index) => {
      const sourceCanvas = originalCanvases[index];
      if (!sourceCanvas) return;
      try {
        const image = document.createElement("img");
        image.src = sourceCanvas.toDataURL("image/png");
        image.alt = "Chart snapshot";
        image.style.width = "100%";
        image.style.height = "auto";
        image.style.maxWidth = "100%";
        canvas.replaceWith(image);
      } catch (error) {
        console.error("Chart snapshot conversion failed:", error);
      }
    });
    const title = getActiveTabTitle();
    const filterText = `${fromDate || "Start"} to ${toDate || "Today"}`;

    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) return;

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Advanced Report - ${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #1f2937; }
            .pdf-header { border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 16px; }
            .pdf-header h2 { margin: 0 0 6px; font-size: 22px; }
            .pdf-meta { font-size: 13px; color: #4b5563; margin: 2px 0; }
            .report-section { display: block !important; }
            .card { border: 1px solid #e5e7eb; border-radius: 10px; margin-bottom: 14px; }
            .card-body { padding: 14px; }
            .card-title { margin: 0 0 10px; font-size: 18px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 13px; }
            thead { background: #f3f4f6; }
            .badge { border: 1px solid #d1d5db; border-radius: 999px; padding: 2px 8px; font-size: 11px; }
            button, .nav, .alert { display: none !important; }
            canvas { max-width: 100% !important; height: auto !important; }
            @page { size: A4 landscape; margin: 14mm; }
          </style>
        </head>
        <body>
          <div class="pdf-header">
            <h2>Advanced Reports & Analytics</h2>
            <div class="pdf-meta"><strong>Section:</strong> ${title}</div>
            <div class="pdf-meta"><strong>Date Filter:</strong> ${filterText}</div>
            <div class="pdf-meta"><strong>Generated:</strong> ${new Date().toLocaleString("en-IN")}</div>
          </div>
          <div id="pdf-content"></div>
        </body>
      </html>
    `);

    printWindow.document.close();
    const mountPoint = printWindow.document.getElementById("pdf-content");
    if (mountPoint) {
      mountPoint.appendChild(clonedSection);
    }

    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading Report Data...</p>
      </div>
    );
  }

  return (
    <div className="advanced-reports-container p-4" ref={printContainerRef}>
      {/* Header */}
      <div className="report-header mb-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1"> Advanced Reports & Analytics</h2>
            <p className="text-muted mb-0">
              Comprehensive business intelligence dashboard
            </p>
          </div>
          <button className="btn btn-danger btn-lg" onClick={downloadPDF}>
            📄 Download as PDF
          </button>
        </div>

        {/* Date Filter */}
        <div className="filter-section bg-light p-3 rounded-3 border">
          <div className="row align-items-end">
            <div className="col-md-4">
              <label className="form-label fw-bold"> From Date</label>
              <input
                type="date"
                className="form-control form-control-lg"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold"> To Date</label>
              <input
                type="date"
                className="form-control form-control-lg"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <button
                className="btn btn-warning btn-lg w-100"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="summary-card card shadow-sm rounded-3 border-0">
            <div className="card-body">
              <h6 className="card-title text-muted fw-bold small text-uppercase mb-2">
                Total Revenue
              </h6>
              <h1 className="h3 fw-bold text-dark mb-0">
                ₹{getFilteredTotalRevenue().toLocaleString()}
              </h1>
              <p className="small text-muted mt-2 mb-0 border-top pt-2">
                Filtered revenue
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="summary-card card shadow-sm rounded-3 border-0">
            <div className="card-body">
              <h6 className="card-title text-muted fw-bold small text-uppercase mb-2">
                Total Bookings
              </h6>
              <h1 className="h3 fw-bold text-dark mb-0">
                {filteredBookings.length + filteredBusBookings.length} units
              </h1>
              <p className="small text-muted mt-2 mb-0 border-top pt-2">
                {filteredBookings.length} Tour + {filteredBusBookings.length}{" "}
                Bus
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="summary-card card shadow-sm rounded-3 border-0">
            <div className="card-body">
              <h6 className="card-title text-muted fw-bold small text-uppercase mb-2">
                Avg. Value
              </h6>
              <h1 className="h3 fw-bold text-dark mb-0">
                ₹
                {(
                  getFilteredTotalRevenue() /
                  (filteredBookings.length + filteredBusBookings.length || 1)
                ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </h1>
              <p className="small text-muted mt-2 mb-0 border-top pt-2">
                Per transaction
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="summary-card card shadow-sm rounded-3 border-0">
            <div className="card-body">
              <h6 className="card-title text-muted fw-bold small text-uppercase mb-2">
                Tour Revenue
              </h6>
              <h1 className="h3 fw-bold text-dark mb-0">
                ₹{getFilteredTourRevenue().toLocaleString()}
              </h1>
              <p className="small text-muted mt-2 mb-0 border-top pt-2">
                {filteredBookings.length} Packages
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <ul className="nav nav-pills mb-4 bg-light p-2 rounded-3">
        <li className="nav-item flex-grow-1">
          <button
            className={`nav-link w-100 rounded-2 fw-bold ${
              activeTab === "overview" ? "active bg-primary" : ""
            }`}
            onClick={() => setActiveTab("overview")}
          >
            📊 Overview
          </button>
        </li>
        <li className="nav-item flex-grow-1">
          <button
            className={`nav-link w-100 rounded-2 fw-bold ${
              activeTab === "revenue" ? "active bg-success" : ""
            }`}
            onClick={() => setActiveTab("revenue")}
          >
            💰 Revenue Analysis
          </button>
        </li>
        <li className="nav-item flex-grow-1">
          <button
            className={`nav-link w-100 rounded-2 fw-bold ${
              activeTab === "packages" ? "active bg-info" : ""
            }`}
            onClick={() => setActiveTab("packages")}
          >
            🎫 Package Analysis
          </button>
        </li>
        <li className="nav-item flex-grow-1">
          <button
            className={`nav-link w-100 rounded-2 fw-bold ${
              activeTab === "bookings" ? "active bg-warning" : ""
            }`}
            onClick={() => setActiveTab("bookings")}
          >
            📋 Bookings Details
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        <div
          id="advanced-report-overview"
          className={`report-section ${
            activeTab === "overview" ? "d-block" : "d-none d-print-block"
          }`}
        >
          <div className="row">
            <div className="col-lg-5 mb-4">
              <div className="card border-0 shadow-sm rounded-3 h-100">
                <div className="card-body">
                  <h5 className="card-title mb-4 fw-bold">
                    📈 Monthly Revenue
                  </h5>
                  <Bar
                    data={monthlyChartConfig}
                    options={{
                      ...chartOptions,
                      indexAxis: undefined,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="col-lg-7 mb-4">
              <div className="card border-0 shadow-sm rounded-3">
                <div className="card-body">
                  <h5 className="card-title mb-3 fw-bold">
                    💎 Top Value Customers
                  </h5>
                  <div className="table-responsive">
                    <table className="table table-sm table-borderless align-middle m-0">
                      <thead className="bg-light">
                        <tr className="small text-muted text-uppercase">
                          <th>Customer Name</th>
                          <th className="text-center">Bookings</th>
                          <th className="text-end">Total Spent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topCustomers.length > 0 ? (
                          topCustomers.map((c, i) => (
                            <tr key={i} className="border-bottom">
                              <td className="py-3 fw-bold">{c.name}</td>
                              <td className="text-center">
                                <span className="badge bg-light text-dark border">
                                  {c.count}
                                </span>
                              </td>
                              <td className="text-end fw-bold text-success">
                                ₹{c.spent.toLocaleString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="3"
                              className="text-center py-4 text-muted"
                            >
                              No customer data found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-5 mb-4">
              <div className="card border-0 shadow-sm rounded-3 h-100">
                <div className="card-body">
                  <h5 className="card-title mb-4 fw-bold">
                    📊 Booking Status Distribution
                  </h5>
                  <Doughnut data={statusChartConfig} options={statusOptions} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Analysis Tab */}
        <div
          id="advanced-report-revenue"
          className={`report-section ${
            activeTab === "revenue" ? "d-block" : "d-none d-print-block"
          }`}
        >
          <div className="row">
            <div className="col-12 mb-4">
              <div className="card border-0 shadow-sm rounded-3">
                <div className="card-body">
                  <h5 className="card-title mb-4 fw-bold">
                    📉 Daily Revenue Trend
                  </h5>
                  <Line data={revenueChartConfig} options={chartOptions} />
                </div>
              </div>
            </div>

            <div className="col-lg-6 mb-4">
              <div className="card border-0 shadow-sm rounded-3">
                <div className="card-body">
                  <h5 className="card-title mb-4 fw-bold">
                    💵 Revenue Breakdown
                  </h5>
                  <div className="revenue-breakdown">
                    <div className="rb-item mb-3 p-3 bg-light rounded-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold">Tour Package Revenue</span>
                        <span className="badge bg-primary fs-6">
                          ₹{totals.totalTourRevenue.toLocaleString()}
                        </span>
                      </div>
                      <small className="text-muted d-block mt-1">
                        {(
                          (totals.totalTourRevenue /
                            (totals.totalRevenue || 1)) *
                          100
                        ).toFixed(1)}
                        % of total
                      </small>
                    </div>
                    <div className="rb-item mb-3 p-3 bg-light rounded-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold">Bus Booking Revenue</span>
                        <span className="badge bg-success fs-6">
                          ₹{totals.totalBusRevenue.toLocaleString()}
                        </span>
                      </div>
                      <small className="text-muted d-block mt-1">
                        {(
                          (totals.totalBusRevenue /
                            (totals.totalRevenue || 1)) *
                          100
                        ).toFixed(1)}
                        % of total
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6 mb-4">
              <div className="card border-0 shadow-sm rounded-3">
                <div className="card-body">
                  <h5 className="card-title mb-4 fw-bold">📊 Statistics</h5>
                  <div className="stats-item mb-3 p-3 bg-light rounded-2">
                    <small className="text-muted d-block">
                      Average Transaction
                    </small>
                    <h5 className="mb-0 mt-1">₹{totals.avgBookingValue}</h5>
                  </div>
                  <div className="stats-item mb-3 p-3 bg-light rounded-2">
                    <small className="text-muted d-block">Tour Bookings</small>
                    <h5 className="mb-0 mt-1">{totals.tourBookings}</h5>
                  </div>
                  <div className="stats-item p-3 bg-light rounded-2">
                    <small className="text-muted d-block">Bus Bookings</small>
                    <h5 className="mb-0 mt-1">{totals.busBookings}</h5>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Packages Tab */}
        <div
          id="advanced-report-packages"
          className={`report-section ${
            activeTab === "packages" ? "d-block" : "d-none d-print-block"
          }`}
        >
          <div className="row">
            <div className="col-lg-8 mb-4">
              <div className="card border-0 shadow-sm rounded-3">
                <div className="card-body">
                  <h5 className="card-title mb-4 fw-bold">
                    🎫 Package-wise Revenue
                  </h5>
                  {packageSales.labels.length > 0 ? (
                    <Pie data={packageChartConfig} options={chartOptions} />
                  ) : (
                    <div className="alert alert-info">
                      No package data available for the selected period.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-4 mb-4">
              <div className="card border-0 shadow-sm rounded-3">
                <div className="card-body">
                  <h5 className="card-title mb-4 fw-bold">Top Packages</h5>
                  {packageSales.labels.length > 0 ? (
                    <div className="package-list">
                      {packageSales.labels.map((label, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-light rounded-2 mb-3 d-flex justify-content-between align-items-center"
                        >
                          <span className="fw-bold">{label}</span>
                          <span className="badge bg-primary fs-6">
                            ₹{packageSales.data[idx].toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="alert alert-info">
                      No package data available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings Details Tab */}
        <div
          id="advanced-report-bookings"
          className={`report-section ${
            activeTab === "bookings" ? "d-block" : "d-none d-print-block"
          }`}
        >
          <div className="row">
            <div className="col-12 mb-4">
              <div className="card border-0 shadow-sm rounded-3">
                <div className="card-body">
                  <h5 className="card-title mb-4 fw-bold">🎫 Tour Bookings</h5>
                  {filteredBookings.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>#</th>
                            <th>Customer</th>
                            <th>Package</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBookings.slice(0, 10).map((b, i) => (
                            <tr key={b._id}>
                              <td>{i + 1}</td>
                              <td>
                                <strong>{getCustomerName(b)}</strong>
                              </td>
                              <td>{getPackageName(b)}</td>
                              <td>{formatDate(b.createdAt)}</td>
                              <td className="fw-bold">
                                ₹{getBookingAmount(b).toLocaleString()}
                              </td>
                              <td>
                                <span
                                  className={`badge rounded-pill ${getStatusBadgeClass(
                                    b.booking_status,
                                  )}`}
                                >
                                  {b.booking_status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredBookings.length > 10 && (
                        <p className="text-muted text-center">
                          Showing 10 of {filteredBookings.length} records
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="alert alert-info">
                      No tour bookings for the selected period.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-12 mb-4">
              <div className="card border-0 shadow-sm rounded-3">
                <div className="card-body">
                  <h5 className="card-title mb-4 fw-bold">🚌 Bus Bookings</h5>
                  {filteredBusBookings.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover">
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
                          {filteredBusBookings.slice(0, 10).map((b, i) => (
                            <tr key={b._id}>
                              <td>{i + 1}</td>
                              <td>
                                <strong>
                                  {b.customer_id?.first_name || "N/A"}
                                </strong>
                              </td>
                              <td>
                                {b.trip_id?.schedule_id?.route_id
                                  ?.boarding_from || "N/A"}{" "}
                                →{" "}
                                {b.trip_id?.schedule_id?.route_id
                                  ?.destination || "N/A"}
                              </td>
                              <td>{formatDate(b.travel_date)}</td>
                              <td>
                                <span className="badge bg-info">
                                  {b.seat_numbers?.length || 0}
                                </span>
                              </td>
                              <td className="fw-bold">
                                ₹{(b.total_amount || 0).toLocaleString()}
                              </td>
                              <td>
                                <span
                                  className={`badge rounded-pill ${getStatusBadgeClass(
                                    b.booking_status,
                                  )}`}
                                >
                                  {b.booking_status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredBusBookings.length > 10 && (
                        <p className="text-muted text-center">
                          Showing 10 of {filteredBusBookings.length} records
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="alert alert-info">
                      No bus bookings for the selected period.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedReports;
