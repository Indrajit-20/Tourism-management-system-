import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";

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
    const content = `
      Invoice: #${inv.invoice_number}
      Type: ${inv.booking_type}
      Description: ${inv.description}
      Date: ${new Date(inv.createdAt).toLocaleDateString()}
      --------------------------
      Amount: ₹${inv.amount?.toFixed(2)}
      Tax (18%): ₹${inv.tax?.toFixed(2)}
      Total: ₹${inv.total?.toFixed(2)}
      Status: ${inv.status}
    `;
    const w = window.open();
    w.document.write("<pre>" + content + "</pre>");
    w.print();
    w.close();
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="container mt-5 text-center">
          <div className="spinner-border text-primary"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container mt-4">
        <h2 className="mb-4">My Invoices</h2>

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
                    <p className="text-muted mb-2">{inv.description}</p>
                    <hr />
                    <div className="d-flex justify-content-between">
                      <span>Amount:</span>
                      <span>₹{inv.amount?.toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Tax (18%):</span>
                      <span>₹{inv.tax?.toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between fw-bold mt-2 pt-2 border-top">
                      <span>Total:</span>
                      <span className="text-success">
                        ₹{inv.total?.toFixed(2)}
                      </span>
                    </div>
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
