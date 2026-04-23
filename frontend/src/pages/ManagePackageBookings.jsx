import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/managePackageBookings.css";

const ManagePackageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchText, setSearchText] = useState("");

  const lower = (value) => String(value || "").toLowerCase();

  const formatStatus = (value) => {
    const text = lower(value);
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const getStatusClass = (value) => {
    const status = lower(value);

    if (status === "pending") return "status-chip status-chip-pending";
    if (status === "approved") return "status-chip status-chip-approved";
    if (status === "confirmed") return "status-chip status-chip-confirmed";
    if (status === "rejected") return "status-chip status-chip-rejected";
    if (status === "cancelled") return "status-chip status-chip-cancelled";
    if (status === "paid") return "status-chip status-chip-confirmed";
    if (status === "refunded") return "status-chip status-chip-approved";

    return "status-chip status-chip-default";
  };

  const formatCurrency = (value) => {
    const amount = Number(value || 0);
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const dateObj = new Date(value);
    if (Number.isNaN(dateObj.getTime())) return "-";
    return dateObj.toLocaleDateString("en-GB");
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/bookings/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (id, newStatus) => {
    const token = sessionStorage.getItem("token");
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/bookings/update-status/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert(`Booking ${newStatus}!`);
      fetchBookings();
    } catch (err) {
      console.error(err);
      alert("Action Failed");
    }
  };

  const searchValue = lower(searchText.trim());

  const filteredBookings = [];
  for (const booking of bookings) {
    const bookingStatus = lower(booking.booking_status);

    if (filterStatus !== "all" && bookingStatus !== filterStatus) {
      continue;
    }

    if (!searchValue) {
      filteredBookings.push(booking);
      continue;
    }

    const fullName = `${booking.customer_id?.first_name || ""} ${
      booking.customer_id?.last_name || ""
    }`
      .trim()
      .toLowerCase();
    const packageName = lower(booking.package_id?.package_name);
    const bookingId = lower(booking._id);

    if (
      fullName.includes(searchValue) ||
      packageName.includes(searchValue) ||
      bookingId.includes(searchValue)
    ) {
      filteredBookings.push(booking);
    }
  }

  let pendingCount = 0;
  let approvedCount = 0;
  let confirmedCount = 0;

  for (const booking of bookings) {
    const status = lower(booking.booking_status);
    if (status === "pending") pendingCount += 1;
    if (status === "approved") approvedCount += 1;
    if (status === "confirmed") confirmedCount += 1;
  }

  const totalCount = bookings.length;

  const formatRoute = (pkg) => {
    if (!pkg) return "-";
    const source = String(pkg.source_city || "").trim();
    const dest = String(pkg.destination || "").trim();
    if (source && dest) return `${source} ➔ ${dest}`;
    if (source) return source;
    if (dest) return dest;
    return pkg.package_name || "-";
  };

  return (
    <div className="container mt-4 manage-package-bookings-page">
      <div className="manage-package-bookings-head">
        <h2 className="manage-package-bookings-title">
          Package Booking Requests
        </h2>
        <p className="manage-package-bookings-subtitle mb-0">
          Review, approve, or reject tour booking requests.
        </p>
      </div>

      <div className="manage-package-bookings-card p-3 mb-3">
        <div className="manage-package-bookings-counts mb-3">
          <div className="manage-package-bookings-count-item">
            <span>Total</span>
            <strong>{totalCount}</strong>
          </div>
          <div className="manage-package-bookings-count-item">
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>
          <div className="manage-package-bookings-count-item">
            <span>Approved</span>
            <strong>{approvedCount}</strong>
          </div>
          <div className="manage-package-bookings-count-item">
            <span>Confirmed</span>
            <strong>{confirmedCount}</strong>
          </div>
        </div>

        <div className="row g-3 align-items-end">
          <div className="col-md-8">
            <label className="form-label manage-package-bookings-label">
              Search
            </label>
            <input
              type="text"
              className="form-control manage-package-bookings-input"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by user name, package name, or booking ID"
            />
          </div>
          <div className="col-md-4">
            <label className="form-label manage-package-bookings-label">
              Filter Status
            </label>
            <select
              className="form-select manage-package-bookings-input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Bookings</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="confirmed">Confirmed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-responsive manage-package-bookings-table-wrap">
        <table className="table table-sm table-hover table-bordered align-middle manage-package-bookings-table mb-0">
          <thead className="table-dark">
            <tr>
              <th>Sr No</th>
              <th>Booking ID</th>
              <th>User</th>
              <th>Email</th>
              <th>Package</th>
              <th>Departure Date</th>
              <th>Seats</th>
              <th>Travellers</th>
              <th>Price/Person</th>
              <th>Total Amount</th>
              <th>Booking Date</th>
              <th>Status</th>
              <th>Payment</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan="14" className="text-center py-4 text-muted">
                  No bookings found for selected filter.
                </td>
              </tr>
            ) : (
              filteredBookings.map((b, index) => (
                <tr key={b._id}>
                  <td>{index + 1}</td>
                  <td>
                    <span
                      className="booking-id-chip"
                      title={String(b._id || "-")}
                    >
                      {String(b._id || "-")}
                    </span>
                  </td>
                  <td>
                    {b.customer_id?.first_name} {b.customer_id?.last_name}
                  </td>
                  <td>{b.customer_id?.email || "-"}</td>
                  <td>{b.package_id?.package_name || "Unknown Package"}</td>
                  <td>{formatDate(b.tour_schedule_id?.start_date)}</td>
                  <td>
                    {Array.isArray(b.seat_numbers) && b.seat_numbers.length ? (
                      <div className="seats-container">
                        {b.seat_numbers.join(", ")}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{b.travellers}</td>
                  <td>{formatCurrency(b.price_per_person)}</td>
                  <td>{formatCurrency(b.total_amount)}</td>
                  <td>{formatDate(b.booking_date || b.createdAt)}</td>
                  <td>
                    <span className={getStatusClass(b.booking_status)}>
                      {formatStatus(b.booking_status)}
                    </span>
                  </td>
                  <td>
                    <span className={getStatusClass(b.payment_status)}>
                      {formatStatus(b.payment_status || "unpaid")}
                    </span>
                  </td>
                  <td className="text-center">
                    {lower(b.booking_status) === "pending" ? (
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          className="btn btn-sm package-bookings-approve-btn"
                          onClick={() => handleStatus(b._id, "approved")}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-sm package-bookings-reject-btn"
                          onClick={() => handleStatus(b._id, "rejected")}
                        >
                          Reject
                        </button>
                      </div>
                    ) : lower(b.booking_status) === "approved" ||
                      lower(b.booking_status) === "confirmed" ? (
                      <button
                        className="btn btn-sm btn-outline-danger w-100"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Are you sure you want to cancel this booking? This will change status to 'cancelled'.",
                            )
                          ) {
                            handleStatus(b._id, "cancelled");
                          }
                        }}
                      >
                        Cancel
                      </button>
                    ) : (
                      <span className="text-muted small">No action</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManagePackageBookings;
