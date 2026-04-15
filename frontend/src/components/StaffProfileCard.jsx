import React from "react";
import { FaPhone, FaEnvelope, FaCalendarAlt, FaMapPin } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

const StaffProfileCard = ({ staff }) => {
  if (!staff) {
    return <div className="alert alert-info">Loading staff information...</div>;
  }

  return (
    <div className="card shadow-lg border-0 mb-4">
      <div
        className="card-header bg-gradient p-4"
        style={{
          background:
            staff.designation === "driver"
              ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          color: "white",
        }}
      >
        <div className="d-flex align-items-center">
          <div
            className="rounded-circle bg-white p-3 me-3"
            style={{ width: "80px", height: "80px" }}
          >
            <div
              className="d-flex align-items-center justify-content-center"
              style={{ width: "100%", height: "100%", fontSize: "2rem" }}
            >
              {staff.designation === "driver" ? "🚗" : "🎯"}
            </div>
          </div>
          <div>
            <h2 className="mb-1">{staff.name}</h2>
            <p className="mb-0">
              <span className="badge badge-light">
                {staff.designation.toUpperCase()}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="card-body">
        <div className="row g-4">
          <div className="col-md-6">
            <div className="d-flex align-items-center mb-3">
              <FaPhone
                className="text-primary me-3"
                style={{ fontSize: "1.5rem" }}
              />
              <div>
                <small className="text-muted d-block">Contact Number</small>
                <strong>{staff.contact_no}</strong>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="d-flex align-items-center mb-3">
              <FaEnvelope
                className="text-info me-3"
                style={{ fontSize: "1.5rem" }}
              />
              <div>
                <small className="text-muted d-block">Email</small>
                <strong>{staff.email}</strong>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="d-flex align-items-center mb-3">
              <FaCalendarAlt
                className="text-danger me-3"
                style={{ fontSize: "1.5rem" }}
              />
              <div>
                <small className="text-muted d-block">Date of Birth</small>
                <strong>{staff.dob}</strong>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="d-flex align-items-center mb-3">
              <FaMapPin
                className="text-success me-3"
                style={{ fontSize: "1.5rem" }}
              />
              <div>
                <small className="text-muted d-block">Address</small>
                <strong>{staff.address}</strong>
              </div>
            </div>
          </div>
        </div>

        <hr className="my-4" />

        <div className="row">
          <div className="col-12">
            <div className="alert alert-light border-1 border-secondary">
              <small className="text-muted">Member Since</small>
              <p className="mb-0 text-dark fw-bold">
                {new Date(staff.createdAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfileCard;
