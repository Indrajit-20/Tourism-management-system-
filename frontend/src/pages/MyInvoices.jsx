import React, { useEffect, useState } from "react";
import axios from "axios";
import "../css/invoice.css";

const API_BASE = "http://localhost:4000";

const toNumber = (value) => Number(value || 0);
const isTourInvoice = (invoice) => invoice.booking_type === "Package";

const MyInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Keep all pricing fallback logic in one place so JSX stays simple.
  const getInvoiceBreakdown = (invoice) => {
    const isTour = isTourInvoice(invoice);
    const amount = toNumber(invoice.amount);
    const base = toNumber(invoice.base_fare);
    const storedDiscount = toNumber(invoice.child_discount);

    const baseFare = isTour
      ? base > 0
        ? base
        : amount + storedDiscount
      : base > 0
        ? base
        : amount;

    const childDiscount = isTour
      ? Math.max(0, storedDiscount || baseFare - amount)
      : 0;

    const netFare = Math.max(0, baseFare - childDiscount);
    const travellers = toNumber(invoice.travellers || 1);
    const perTraveller = travellers > 0 ? netFare / travellers : netFare;
    const tax = isTour ? toNumber(invoice.gst) : 0;

    return {
      isTour,
      baseFare,
      childDiscount,
      perTraveller,
      tax,
      startDate: isTour
        ? invoice.tour_start_date || invoice.travel_date
        : invoice.travel_date,
      endDate: isTour ? invoice.tour_end_date : null,
    };
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/invoice/my-invoices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvoices(res.data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (invoiceId) => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE}/api/invoice/${invoiceId}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoiceId}.html`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      alert("Failed to download invoice.");
    }
  };

  const formatMoney = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  };

  const toDateString = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const printInvoice = (invoice) => {
    const invoiceDate = toDateString(invoice.createdAt);
    const {
      isTour,
      baseFare,
      childDiscount,
      perTraveller,
      tax,
      startDate,
      endDate,
    } = getInvoiceBreakdown(invoice);

    const content = `
            ========================================
            ${isTour ? "TOUR INVOICE" : "BUS INVOICE"}
      ========================================
      
      Invoice: #${invoice.invoice_number}
      Date: ${invoiceDate}
      Type: ${invoice.booking_type}
      
      ----------------------------------------
      JOURNEY DETAILS
      ${invoice.description || "-"}
      ${isTour ? `Start Date: ${toDateString(startDate)}` : `Travel Date: ${toDateString(startDate)}`}
      ${isTour ? `End Date: ${toDateString(endDate)}` : ""}
      Travellers: ${invoice.travellers || 1}
      ${isTour ? `Per Traveller: ${formatMoney(perTraveller)}` : ""}
      ${isTour ? "" : invoice.seat_numbers?.length ? `Seats: ${invoice.seat_numbers.join(", ")}` : ""}
      ${isTour && invoice.package_duration ? `Duration: ${invoice.package_duration}` : ""}
      ${!isTour && invoice.bus_details ? `Bus: ${invoice.bus_details}` : ""}
      
      ----------------------------------------
      PRICE BREAKDOWN
      Base Fare: ${formatMoney(baseFare)}
      ${isTour && childDiscount > 0 ? `Child Discount: -${formatMoney(childDiscount)}` : ""}
      ${!isTour && invoice.service_charges > 0 ? `Service Charges: ${formatMoney(invoice.service_charges)}` : ""}
      ${tax > 0 ? `Tax (5% Included): ${formatMoney(tax)}` : ""}
      
      ----------------------------------------
      TOTAL AMOUNT PAID: ${formatMoney(invoice.amount)}
      ----------------------------------------
      
      Payment Method: ${invoice.payment_method || "Online"}
      Transaction ID: ${invoice.transaction_id || "-"}
      Status: ${invoice.status}
      
      Thank you for your booking!
      ========================================
    `;
    const w = window.open();
    w.document.write(
      "<pre style='font-family: monospace; padding: 20px; font-size: 12px;'>" +
        content +
        "</pre>",
    );
    w.print();
    w.close();
  };

  if (loading) {
    return (
      <div className="invoices-container">
        <div className="container mt-5 text-center">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="invoices-container">
      <div className="container">
        <div className="page-header">
          <h2>My Invoices</h2>
        </div>

        {invoices.length === 0 ? (
          <div className="empty-state">
            No records found. Generate one from My Bookings.
          </div>
        ) : (
          <div className="row">
            {invoices.map((invoice) => {
              const {
                isTour,
                baseFare,
                childDiscount,
                perTraveller,
                tax,
                startDate,
                endDate,
              } = getInvoiceBreakdown(invoice);
              return (
                <div key={invoice._id} className="col-md-6 col-lg-4 mb-4">
                  <div
                    className={`invoice-card ${isTour ? "tour-card" : "bus-card"}`}
                  >
                    {/* Header */}
                    <div className="invoice-card-header">
                      <span className="invoice-number">
                        {invoice.invoice_number}
                      </span>
                      <span
                        className={`invoice-type-badge ${
                          isTour ? "badge-tour" : "badge-bus"
                        }`}
                      >
                        {isTour ? "🎫 Tour" : "🚌 Bus"}
                      </span>
                    </div>

                    {/* Body */}
                    <div className="invoice-card-body">
                      <div className="invoice-title">{invoice.description}</div>

                      <div className="invoice-details">
                        <div className="detail-row">
                          <span className="detail-label">
                            {isTour ? "Start Date" : "Travel Date"}
                          </span>
                          <span className="detail-value">
                            {toDateString(startDate)}
                          </span>
                        </div>

                        {isTour && (
                          <div className="detail-row">
                            <span className="detail-label">End Date</span>
                            <span className="detail-value">
                              {toDateString(endDate)}
                            </span>
                          </div>
                        )}

                        <div className="detail-row">
                          <span className="detail-label">Travellers</span>
                          <span className="detail-value">
                            {invoice.travellers || 1}
                          </span>
                        </div>

                        {isTour && (
                          <div className="detail-row">
                            <span className="detail-label">Per Traveller</span>
                            <span className="detail-value">
                              {formatMoney(perTraveller)}
                            </span>
                          </div>
                        )}

                        {!isTour && invoice.seat_numbers?.length > 0 && (
                          <div className="detail-row">
                            <span className="detail-label">Seats</span>
                            <span className="detail-value seats">
                              {invoice.seat_numbers.join(", ")}
                            </span>
                          </div>
                        )}

                        {isTour && invoice.package_duration && (
                          <div className="detail-row">
                            <span className="detail-label">Duration</span>
                            <span className="detail-value">
                              {invoice.package_duration}
                            </span>
                          </div>
                        )}

                        {!isTour && invoice.bus_details && (
                          <div className="detail-row">
                            <span className="detail-label">Bus</span>
                            <span className="detail-value">
                              {invoice.bus_details}
                            </span>
                          </div>
                        )}

                        <div className="detail-row">
                          <span className="detail-label">Transaction ID</span>
                          <span className="detail-value">
                            {invoice.transaction_id || "-"}
                          </span>
                        </div>
                      </div>

                      {/* Price Breakdown */}
                      <div className="price-breakdown">
                        {baseFare > 0 && (
                          <div className="breakdown-item">
                            <span className="breakdown-label">Base Fare</span>
                            <span className="breakdown-value">
                              {formatMoney(baseFare)}
                            </span>
                          </div>
                        )}

                        {isTour && childDiscount > 0 && (
                          <div className="breakdown-item">
                            <span className="breakdown-label">
                              Child Discount
                            </span>
                            <span className="breakdown-value discount">
                              -{formatMoney(childDiscount)}
                            </span>
                          </div>
                        )}

                        {!isTour && invoice.service_charges > 0 && (
                          <div className="breakdown-item">
                            <span className="breakdown-label">
                              Service Charges
                            </span>
                            <span className="breakdown-value">
                              {formatMoney(invoice.service_charges)}
                            </span>
                          </div>
                        )}

                        {tax > 0 && (
                          <div className="breakdown-item">
                            <span className="breakdown-label">
                              Tax (5% Included)
                            </span>
                            <span className="breakdown-value tax">
                              {formatMoney(tax)}
                            </span>
                          </div>
                        )}

                        <div className="total-amount">
                          <span>Total Amount</span>
                          <span className="total-amount-value">
                            {formatMoney(invoice.amount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="invoice-card-footer">
                      <div className="footer-meta">
                        <span className="invoice-date">
                          {toDateString(invoice.createdAt)}
                        </span>
                        <span
                          className={`invoice-status status-${invoice.status.toLowerCase()}`}
                        >
                          ✓ {invoice.status}
                        </span>
                      </div>

                      <div className="invoice-actions">
                        <button
                          className="invoice-btn invoice-btn-download"
                          onClick={() => downloadInvoice(invoice._id)}
                        >
                          Download
                        </button>
                        <button
                          className="invoice-btn invoice-btn-print"
                          onClick={() => printInvoice(invoice)}
                        >
                          Print
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyInvoices;
