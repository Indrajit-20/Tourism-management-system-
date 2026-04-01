import React from "react";
import { FaBus, FaPhone, FaMapMarkerAlt, FaCertificate } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

const DriverInfoCard = ({ driver, trips = [], totalTrips = 0 }) => {
  if (!driver) {
    return (
      <div className="alert alert-info">Loading driver information...</div>
    );
  }

  return (
    <div className="card shadow-lg border-0 mb-4">
      <div
        className="card-header bg-gradient text-white p-4"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          minHeight: "150px",
        }}
      >
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <div
              className="rounded-circle bg-white p-3 me-3"
              style={{ width: "100px", height: "100px", fontSize: "3rem" }}
            >
              🚗
            </div>
            <div>
              <h2 className="mb-0">{driver.name}</h2>
              <p className="mb-0 opacity-75">Professional Driver</p>
              <small className="opacity-75">{driver.contact_no}</small>
            </div>
          </div>
          <div className="text-end">
            <div
              className="badge bg-success px-3 py-2"
              style={{ fontSize: "0.95rem" }}
            >
              Active
            </div>
          </div>
        </div>
      </div>

      <div className="card-body">
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="d-flex mb-3">
              <div
                className="p-3 rounded-circle me-3"
                style={{ backgroundColor: "#e3f2fd" }}
              >
                <FaPhone
                  className="text-primary"
                  style={{ fontSize: "1.5rem" }}
                />
              </div>
              <div>
                <small className="text-muted d-block">Contact Number</small>
                <strong>{driver.contact_no}</strong>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="d-flex mb-3">
              <div
                className="p-3 rounded-circle me-3"
                style={{ backgroundColor: "#f3e5f5" }}
              >
                <FaCertificate
                  className="text-danger"
                  style={{ fontSize: "1.5rem" }}
                />
              </div>
              <div>
                <small className="text-muted d-block">License Status</small>
                <strong className="text-success">Valid</strong>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="d-flex mb-3">
              <div
                className="p-3 rounded-circle me-3"
                style={{ backgroundColor: "#fff3e0" }}
              >
                <FaBus
                  className="text-warning"
                  style={{ fontSize: "1.5rem" }}
                />
              </div>
              <div>
                <small className="text-muted d-block">Trips Assigned</small>
                <strong>{totalTrips}</strong>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="d-flex mb-3">
              <div
                className="p-3 rounded-circle me-3"
                style={{ backgroundColor: "#e8f5e9" }}
              >
                <FaMapMarkerAlt
                  className="text-success"
                  style={{ fontSize: "1.5rem" }}
                />
              </div>
              <div>
                <small className="text-muted d-block">Address</small>
                <strong>{driver.address}</strong>
              </div>
            </div>
          </div>
        </div>

        <hr />

        <h6 className="fw-bold mb-3">📍 Upcoming Trips</h6>
        {trips && trips.length > 0 ? (
          <div className="list-group list-group-flush">
            {trips.map((trip, index) => (
              <div key={index} className="list-group-item px-0 py-2">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <strong>Trip {index + 1}</strong>
                    <p className="mb-1 small text-muted">
                      Date: {trip.date || "TBD"}
                    </p>
                    <p className="mb-0 small text-muted">
                      Route: {trip.route || "Not assigned"}
                    </p>
                  </div>
                  <span className="badge bg-primary">Scheduled</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="alert alert-info mb-0">
            No upcoming trips assigned
          </div>
        )}
      </div>

      <div className="card-footer bg-light py-3">
        <div className="row text-center">
          <div className="col-md-4">
            <small className="text-muted d-block">Member Since</small>
            <strong>
              {new Date(driver.createdAt).toLocaleDateString("en-IN")}
            </strong>
          </div>
          <div className="col-md-4 border-start border-end">
            <small className="text-muted d-block">Experience</small>
            <strong>5+ years</strong>
          </div>
          <div className="col-md-4">
            <small className="text-muted d-block">Rating</small>
            <strong className="text-success">⭐ 4.8/5</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverInfoCard;
