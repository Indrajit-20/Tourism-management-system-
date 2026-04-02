import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import BookingCard from "./BookingCard";
import BookingModal from "./BookingModal";
import BookingFilters from "./BookingFilters";
import FeedbackModal from "../../components/FeedbackModal";
import "../../css/booking.css";
import { normalize, STATUSES } from "./bookingConfig";
import { toUiBooking } from "./bookingMapper";

const API = "http://localhost:4000";

const toDateLabel = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const toMoney = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const MyBookings = () => {
  // Main state values for bookings and UI filters.
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mainTab, setMainTab] = useState("All");
  const [statusTab, setStatusTab] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedFeedbackBooking, setSelectedFeedbackBooking] = useState(null);

  const canPrintBooking = (booking) => {
    const isTour = normalize(booking?.type) === "tour";
    if (!isTour) return true;
    return normalize(booking?.paymentStatus) === "paid";
  };

  const createInvoiceForBooking = async (booking, transactionId = "") => {
    if (!booking?._id) return;

    const type = normalize(booking.type) === "tour" ? "Package" : "Bus";
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      await axios.post(
        `${API}/api/invoice/create`,
        {
          booking_id: booking._id,
          booking_type: type,
          transaction_id: transactionId,
        },
        { headers }
      );
    } catch (err) {
      const message = String(err?.response?.data?.message || "").toLowerCase();
      if (!message.includes("already exists")) {
        throw err;
      }
    }
  };

  const loadMyBookings = async (headers) => {
    const [tourResponse, busResponse] = await Promise.allSettled([
      axios.get(`${API}/api/bookings/my-bookings`, { headers }),
      axios.get(`${API}/api/bus-bookings/my-bookings`, { headers }),
    ]);

    const tourData =
      tourResponse.status === "fulfilled" &&
      Array.isArray(tourResponse.value.data)
        ? tourResponse.value.data
        : [];

    const busData =
      busResponse.status === "fulfilled" &&
      Array.isArray(busResponse.value.data)
        ? busResponse.value.data
        : [];

    if (
      tourResponse.status === "rejected" &&
      busResponse.status === "rejected"
    ) {
      throw tourResponse.reason || busResponse.reason;
    }

    return [...tourData, ...busData]
      .map((item) => toUiBooking(item))
      .sort((a, b) => {
        const aTime = new Date(a.bookedOn || 0).getTime() || 0;
        const bTime = new Date(b.bookedOn || 0).getTime() || 0;
        return bTime - aTime;
      });
  };

  // Fetch authenticated bookings when page opens.
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const uiBookings = await loadMyBookings(headers);

        setBookings(uiBookings);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load bookings.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Reset status tab to All whenever main tab changes.
  useEffect(() => {
    if (!STATUSES.includes(statusTab)) {
      setStatusTab("All");
      return;
    }

    // Keep this explicit for beginner readability.
    setStatusTab((previous) => {
      if (previous === "All") return "All";
      return "All";
    });
  }, [mainTab]);

  // Filter bookings by main tab, status and search text.
  const filteredBookings = useMemo(() => {
    const searchText = normalize(search);

    return bookings.filter((item) => {
      const itemType = normalize(item.type);
      const itemStatus = normalize(item.status);

      if (normalize(mainTab) !== "all" && itemType !== normalize(mainTab)) {
        return false;
      }

      if (
        normalize(statusTab) !== "all" &&
        itemStatus !== normalize(statusTab)
      ) {
        return false;
      }

      if (!searchText) {
        return true;
      }

      const text = [item.name, item._id, item.from, item.to]
        .join(" ")
        .toLowerCase();
      return text.includes(searchText);
    });
  }, [bookings, mainTab, statusTab, search]);

  // Cancel booking from card actions (bus and tour use different APIs).
  const handleCancelBooking = async (booking) => {
    const status = normalize(booking.status);
    if (!["confirmed", "approved", "pending"].includes(status)) {
      alert("This booking cannot be cancelled.");
      return;
    }

    const isTour = normalize(booking.type) === "tour";
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (isTour) {
        const previewRes = await axios.post(
          `${API}/api/cancellation/preview`,
          { booking_id: booking._id },
          { headers }
        );

        const preview = previewRes.data || {};
        const confirmText = [
          `Amount paid: Rs. ${preview.amount_paid || 0}`,
          `Refund amount: Rs. ${preview.refund_amount || 0}`,
          "",
          "Do you want to cancel this booking?",
        ].join("\n");

        if (!window.confirm(confirmText)) return;

        await axios.post(
          `${API}/api/cancellation/cancel`,
          {
            booking_id: booking._id,
            booking_type: "Package",
            reason: "Cancelled by user from My Bookings",
          },
          { headers }
        );
      } else {
        if (!window.confirm("Do you want to cancel this bus booking?")) return;

        await axios.post(
          `${API}/api/bus-bookings/cancel/${booking._id}`,
          { reason: "Cancelled by user from My Bookings" },
          { headers }
        );
      }

      alert("Booking cancelled successfully.");
      setSelectedBooking(null);

      const refreshed = await loadMyBookings(headers);
      setBookings(refreshed);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel booking.");
    }
  };

  const handlePayTourBooking = async (booking) => {
    const isTour = normalize(booking?.type) === "tour";
    if (!isTour) return;

    const status = normalize(booking?.status);
    const paymentStatus = normalize(booking?.paymentStatus);

    if (status !== "approved" || paymentStatus === "paid") {
      alert("Payment is available only for approved and unpaid tour bookings.");
      return;
    }

    const amount = Number(
      booking?.totalPaid ||
        Number(booking?.pricePerPerson || 0) * Number(booking?.travellers || 0)
    );

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Unable to process payment because booking amount is invalid.");
      return;
    }

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const orderRes = await axios.post(
        `${API}/api/payment/create-order`,
        { amount },
        { headers }
      );

      const order = orderRes.data || {};
      if (!window.Razorpay) {
        alert("Payment gateway failed to load. Please refresh and try again.");
        return;
      }

      const options = {
        key: "rzp_test_SMPUHkAalgy2kE",
        amount: order.amount,
        currency: order.currency || "INR",
        order_id: order.id,
        name: "FlyVedya Tourism",
        description: `Tour Booking ${booking?._id || ""}`,
        prefill: {
          name: localStorage.getItem("username") || "Customer",
        },
        theme: { color: "#0d6efd" },
        handler: async (response) => {
          try {
            await axios.post(
              `${API}/api/bookings/confirm-payment`,
              {
                booking_id: booking._id,
                payment_id: response.razorpay_payment_id,
              },
              { headers }
            );

            await createInvoiceForBooking(
              booking,
              response.razorpay_payment_id
            );

            alert("Payment successful. Your tour booking is now confirmed.");
            const refreshed = await loadMyBookings(headers);
            setBookings(refreshed);
          } catch (err) {
            alert(
              err.response?.data?.message ||
                "Payment was captured, but confirmation failed. Please contact support."
            );
          }
        },
        modal: {
          ondismiss: () => {
            alert("Payment was not completed.");
          },
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to start payment.");
    }
  };

  // Print only one booking detail sheet in a new window.
  const handleGenerateInvoice = async (booking) => {
    try {
      await createInvoiceForBooking(booking);
      alert("Invoice is ready. Check My Invoices page.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate invoice.");
    }
  };

  const handlePrintBooking = (booking) => {
    if (!booking) return;

    if (!canPrintBooking(booking)) {
      alert(
        "Print/Download is available only after successful payment confirmation."
      );
      return;
    }

    const isTour = normalize(booking.type) === "tour";
    const passengers = Array.isArray(booking.passengers)
      ? booking.passengers
      : [];

    const passengerRows =
      passengers.length > 0
        ? passengers
            .map(
              (p, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(p?.name || `Passenger ${index + 1}`)}</td>
              <td>${escapeHtml(p?.age || "-")}</td>
              <td>${escapeHtml(p?.gender || "-")}</td>
              <td>${escapeHtml(p?.seat || "-")}</td>
            </tr>`
            )
            .join("")
        : "<tr><td colspan='5'>No passenger details available.</td></tr>";

    const printWindow = window.open("", "_blank", "width=900,height=900");
    if (!printWindow) {
      alert("Please allow popups to print booking details.");
      return;
    }

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Booking ${escapeHtml(booking._id || "")}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 22px; color: #1f2937; }
          h1 { margin: 0 0 8px; font-size: 24px; }
          .muted { color: #6b7280; font-size: 13px; }
          .head { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
          .badge { display: inline-block; border-radius: 999px; padding: 4px 10px; font-size: 12px; font-weight: 700; margin-right: 6px; background: #e5e7eb; }
          .section { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; margin-top: 12px; }
          .section h3 { margin: 0 0 8px; font-size: 15px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 18px; }
          .label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
          .value { font-weight: 700; font-size: 14px; }
          .price-row { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px dashed #d1d5db; margin-top: 12px; padding-top: 12px; }
          .small-price { font-size: 15px; color: #4b5563; font-weight: 700; }
          .big-total { font-size: 28px; color: #15803d; font-weight: 800; line-height: 1; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 13px; }
          th { background: #f9fafb; }
          @media print {
            body { margin: 8mm; }
          }
        </style>
      </head>
      <body>
        <div class="head">
          <div>
            <h1>${escapeHtml(booking.name || "Booking")}</h1>
            <div class="muted">Booking ID: ${escapeHtml(
              booking._id || "-"
            )}</div>
            <div class="muted">Booked On: ${escapeHtml(
              toDateLabel(booking.bookedOn)
            )}</div>
          </div>
          <div>
            <span class="badge">${escapeHtml(booking.type || "-")}</span>
            <span class="badge">${escapeHtml(booking.status || "-")}</span>
            <span class="badge">Payment: ${escapeHtml(
              booking.paymentStatus || "-"
            )}</span>
          </div>
        </div>

        <div class="section">
          <h3>Journey Details</h3>
          <div class="grid">
            <div><div class="label">From</div><div class="value">${escapeHtml(
              booking.from || "-"
            )}</div></div>
            <div><div class="label">To</div><div class="value">${escapeHtml(
              booking.to || "-"
            )}</div></div>
            <div><div class="label">${
              isTour ? "Start Date" : "Travel Date"
            }</div><div class="value">${escapeHtml(
      toDateLabel(booking.startDate)
    )}</div></div>
            ${
              isTour
                ? `<div><div class="label">End Date</div><div class="value">${escapeHtml(
                    toDateLabel(booking.endDate)
                  )}</div></div>`
                : `<div><div class="label">Duration</div><div class="value">${escapeHtml(
                    booking.duration || "-"
                  )}</div></div>`
            }
            <div><div class="label">Departure</div><div class="value">${escapeHtml(
              booking.departure || "-"
            )}</div></div>
            ${
              isTour
                ? `<div><div class="label">Duration</div><div class="value">${escapeHtml(
                    booking.duration || "-"
                  )}</div></div>`
                : `<div><div class="label">Arrival</div><div class="value">${escapeHtml(
                    booking.arrival || "-"
                  )}</div></div>`
            }
            <div><div class="label">Transport</div><div class="value">${escapeHtml(
              booking.transport || "-"
            )}</div></div>
            <div><div class="label">Bus Type</div><div class="value">${escapeHtml(
              booking.busType || "-"
            )}</div></div>
            <div><div class="label">Bus</div><div class="value">${escapeHtml(
              `${booking.busName || "-"} ${
                booking.busNo ? `(${booking.busNo})` : ""
              }`
            )}</div></div>
            <div><div class="label">${
              isTour ? "Pickup" : "Boarding Point"
            }</div><div class="value">${escapeHtml(
      booking.pickup || "-"
    )}</div></div>
            ${
              isTour
                ? `<div><div class="label">Hotel</div><div class="value">${escapeHtml(
                    booking.hotel || "-"
                  )}</div></div>`
                : `<div><div class="label">Drop Point</div><div class="value">${escapeHtml(
                    booking.drop || "-"
                  )}</div></div>`
            }
          </div>

          <div class="price-row">
            <div>
              <div class="label">Per Person</div>
              <div class="small-price">${escapeHtml(
                toMoney(booking.pricePerPerson)
              )}</div>
            </div>
            <div style="text-align:right;">
              <div class="label">Total Paid</div>
              <div class="big-total">${escapeHtml(
                toMoney(booking.totalPaid)
              )}</div>
            </div>
          </div>
        </div>

        ${
          !isTour && booking.seats?.length
            ? `
          <div class="section">
            <h3>Seat Numbers</h3>
            <div>${escapeHtml(booking.seats.join(", "))}</div>
          </div>
        `
            : ""
        }

        <div class="section">
          <h3>Passenger Details (${passengers.length})</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Seat</th>
              </tr>
            </thead>
            <tbody>
              ${passengerRows}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const busResults = filteredBookings.filter(
    (item) => normalize(item.type) === "bus"
  );
  const tourResults = filteredBookings.filter(
    (item) => normalize(item.type) === "tour"
  );

  if (loading) {
    return (
      <div className="fv-bookings-page d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-3 text-muted fw-semibold">
            Loading your bookings...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fv-bookings-page">
        <div className="container fv-wrap">
          <div className="alert alert-danger">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fv-bookings-page">
      <div className="container fv-wrap">
        {/* Page heading */}
        <h2 className="fw-bold mb-1">My Bookings</h2>
        <p className="text-muted mb-3">
          Manage all your bus tickets and tour packages
        </p>

        {/* Tabs + status pills + search */}
        <BookingFilters
          bookings={bookings}
          mainTab={mainTab}
          setMainTab={setMainTab}
          statusTab={statusTab}
          setStatusTab={setStatusTab}
          search={search}
          setSearch={setSearch}
          resultCount={filteredBookings.length}
        />

        {/* Booking cards list */}
        {filteredBookings.length === 0 ? (
          <div className="alert alert-light border">
            No bookings found for selected filters.
          </div>
        ) : (
          <>
            {busResults.length > 0 && (
              <div className="fv-group-wrap">
                <h5 className="fv-group-title">Bus Ticket Bookings</h5>
                {busResults.map((booking) => (
                  <BookingCard
                    key={booking._id}
                    booking={booking}
                    onView={setSelectedBooking}
                    onCancel={handleCancelBooking}
                    onPrint={handlePrintBooking}
                    onPay={handlePayTourBooking}
                    onGenerateInvoice={handleGenerateInvoice}
                  />
                ))}
              </div>
            )}

            {tourResults.length > 0 && (
              <div className="fv-group-wrap">
                <h5 className="fv-group-title">Tour Package Bookings</h5>
                {tourResults.map((booking) => (
                  <BookingCard
                    key={booking._id}
                    booking={booking}
                    onView={setSelectedBooking}
                    onCancel={handleCancelBooking}
                    onPrint={handlePrintBooking}
                    onPay={handlePayTourBooking}
                    onGenerateInvoice={handleGenerateInvoice}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Details modal */}
        <BookingModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onPrint={handlePrintBooking}
        />
      </div>
    </div>
  );
};

export default MyBookings;
