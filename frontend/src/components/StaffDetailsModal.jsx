import React from "react";
import { FaTimes } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

const StaffDetailsModal = ({ staff, onClose }) => {
  if (!staff) return null;

  const getDesignationBadge = (designation) => {
    const badgeClass = designation === "driver" ? "bg-primary" : "bg-danger";
    return (
      <span className={`badge ${badgeClass}`}>{designation.toUpperCase()}</span>
    );
  };

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content border-0 shadow-lg">
          <div
            className="modal-header bg-gradient text-white"
            style={{
              background:
                staff.designation === "driver"
                  ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            }}
          >
            <h5 className="modal-title fw-bold">Staff Information</h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          <div className="modal-body p-4">
            <div className="row mb-4">
              <div className="col-md-12">
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-circle bg-light p-3 me-3"
                    style={{
                      width: "100px",
                      height: "100px",
                      fontSize: "3rem",
                    }}
                  >
                    {staff.designation === "driver" ? "🚗" : "🎯"}
                  </div>
                  <div>
                    <h4 className="mb-1 fw-bold">{staff.name}</h4>
                    <p className="mb-2">
                      {getDesignationBadge(staff.designation)}
                    </p>
                    <small className="text-muted">ID: {staff._id}</small>
                  </div>
                </div>
              </div>
            </div>

            <hr />

            <div className="row">
              <div className="col-md-6 mb-3">
                <div className="bg-light p-3 rounded">
                  <small className="text-muted d-block mb-1">
                    📞 Contact Number
                  </small>
                  <strong className="d-block">{staff.contact_no}</strong>
                </div>
              </div>
              <div className="col-md-6 mb-3">
                <div className="bg-light p-3 rounded">
                  <small className="text-muted d-block mb-1">
                    📧 Email Address
                  </small>
                  <strong className="d-block text-break">
                    {staff.email_id}
                  </strong>
                </div>
              </div>
              <div className="col-md-6 mb-3">
                <div className="bg-light p-3 rounded">
                  <small className="text-muted d-block mb-1">
                    🎂 Date of Birth
                  </small>
                  <strong className="d-block">{staff.dob}</strong>
                </div>
              </div>
              <div className="col-md-6 mb-3">
                <div className="bg-light p-3 rounded">
                  <small className="text-muted d-block mb-1">
                    📍 Designation
                  </small>
                  <strong className="d-block text-capitalize">
                    {staff.designation}
                  </strong>
                </div>
              </div>
              <div className="col-12 mb-3">
                <div className="bg-light p-3 rounded">
                  <small className="text-muted d-block mb-1">🏠 Address</small>
                  <strong className="d-block">{staff.address}</strong>
                </div>
              </div>
              <div className="col-md-6 mb-3">
                <div className="bg-light p-3 rounded">
                  <small className="text-muted d-block mb-1">
                    📅 Member Since
                  </small>
                  <strong className="d-block">
                    {new Date(staff.createdAt).toLocaleDateString("en-IN")}
                  </strong>
                </div>
              </div>
              <div className="col-md-6 mb-3">
                <div className="bg-light p-3 rounded">
                  <small className="text-muted d-block mb-1">
                    🔄 Last Updated
                  </small>
                  <strong className="d-block">
                    {new Date(staff.updatedAt).toLocaleDateString("en-IN")}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDetailsModal;
