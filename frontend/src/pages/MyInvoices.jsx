import React, { useEffect, useState } from "react";
import axios from "axios";

const MyInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:4000/api/invoice/my-invoices",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setInvoices(res.data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const printInvoice = (inv) => {
    const travelDate = inv.travel_date
      ? new Date(inv.travel_date).toLocaleDateString()
      : "-";

    const content = `
      ========================================
                  TRAVEL INVOICE
      ========================================
      
      Invoice No: #${inv.invoice_number}
      Date: ${new Date(inv.createdAt).toLocaleDateString()}
      
      ----------------------------------------
      ${inv.booking_type}: ${inv.description}
      Travel Date: ${travelDate}
      Travellers: ${inv.travellers || 1}
      ${
        inv.booking_type === "Bus" && inv.seat_numbers?.length
          ? `Seats: ${inv.seat_numbers.join(", ")}`
          : ""
      }
      
      ----------------------------------------
      Total Amount: ₹${inv.amount?.toFixed(2)}
      Payment: ${inv.payment_method || "Online"}
      Status: ${inv.status}
      ========================================
    `;
    const w = window.open();
    w.document.write(
      "<pre style='font-family: monospace; padding: 20px;'>" +
        content +
        "</pre>"
    );
    w.print();
    w.close();
  };

  if (loading) {
    return (
      <>
        <div className="container mt-5 text-center">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="container mt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>My Invoices</h2>
        </div>

        {invoices.length === 0 ? (
          <div className="alert alert-info">
            No invoices found. Generate one from My Bookings.
          </div>
        ) : (
          <div className="row">
            {invoices.map((inv) => (
              <div key={inv._id} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100 shadow-sm">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <span className="fw-bold">#{inv.invoice_number}</span>
                    <span
                      className={`badge ${
                        inv.booking_type === "Package"
                          ? "bg-success"
                          : "bg-primary"
                      }`}
                    >
                      {inv.booking_type}
                    </span>
                  </div>
                  <div className="card-body">
                    <h6 className="card-title">{inv.description}</h6>

                    <table className="table table-sm table-borderless mb-0 small">
                      <tbody>
                        {inv.travel_date && (
                          <tr>
                            <td className="text-muted">Travel Date</td>
                            <td className="text-end">
                              {new Date(inv.travel_date).toLocaleDateString()}
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td className="text-muted">Travellers</td>
                          <td className="text-end">{inv.travellers || 1}</td>
                        </tr>
                        {inv.booking_type === "Bus" &&
                          inv.seat_numbers?.length > 0 && (
                            <tr>
                              <td className="text-muted">Seats</td>
                              <td className="text-end">
                                {inv.seat_numbers.join(", ")}
                              </td>
                            </tr>
                          )}
                        <tr>
                          <td className="text-muted">Payment</td>
                          <td className="text-end">
                            {inv.payment_method || "Online"}
                          </td>
                        </tr>
                        <tr className="border-top">
                          <td className="fw-bold">Total</td>
                          <td className="text-end fw-bold text-success">
                            ₹{inv.amount?.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="card-footer bg-white d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </small>
                    <div>
                      <span
                        className={`badge me-2 ${
                          inv.status === "Paid" ? "bg-success" : "bg-danger"
                        }`}
                      >
                        {inv.status}
                      </span>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => printInvoice(inv)}
                      >
                        Print
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MyInvoices;
