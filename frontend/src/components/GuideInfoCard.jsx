import React from "react";
import {
  FaMapMarkerAlt,
  FaPhone,
  FaLanguage,
  FaStar,
  FaUsers,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

const GuideInfoCard = ({ guide, tours = [], totalTours = 0 }) => {
  if (!guide) {
    return <div className="alert alert-info">Loading guide information...</div>;
  }

  return (
    <div className="card shadow-lg border-0 mb-4">
      <div
        className="card-header bg-gradient text-white p-4"
        style={{
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          minHeight: "150px",
        }}
      >
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <div
              className="rounded-circle bg-white p-3 me-3"
              style={{ width: "100px", height: "100px", fontSize: "3rem" }}
            >
              🎯
            </div>
            <div>
              <h2 className="mb-0">{guide.name}</h2>
              <p className="mb-0 opacity-75">Professional Tour Guide</p>
              <small className="opacity-75">{guide.contact_no}</small>
            </div>
          </div>
          <div className="text-end">
            <div
              className="badge bg-success px-3 py-2"
              style={{ fontSize: "0.95rem" }}
            >
              Available
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
                style={{ backgroundColor: "#fce4ec" }}
              >
                <FaPhone
                  className="text-danger"
                  style={{ fontSize: "1.5rem" }}
                />
              </div>
              <div>
                <small className="text-muted d-block">Contact Number</small>
                <strong>{guide.contact_no}</strong>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="d-flex mb-3">
              <div
                className="p-3 rounded-circle me-3"
                style={{ backgroundColor: "#fff3e0" }}
              >
                <FaLanguage
                  className="text-warning"
                  style={{ fontSize: "1.5rem" }}
                />
              </div>
              <div>
                <small className="text-muted d-block">Languages</small>
                <strong>English, Hindi, Gujarati</strong>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="d-flex mb-3">
              <div
                className="p-3 rounded-circle me-3"
                style={{ backgroundColor: "#e8f5e9" }}
              >
                <FaUsers
                  className="text-success"
                  style={{ fontSize: "1.5rem" }}
                />
              </div>
              <div>
                <small className="text-muted d-block">Tours Completed</small>
                <strong>{totalTours}</strong>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="d-flex mb-3">
              <div
                className="p-3 rounded-circle me-3"
                style={{ backgroundColor: "#e3f2fd" }}
              >
                <FaStar
                  className="text-primary"
                  style={{ fontSize: "1.5rem" }}
                />
              </div>
              <div>
                <small className="text-muted d-block">Customer Rating</small>
                <strong className="text-warning">⭐ 4.9/5</strong>
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="d-flex mb-3">
              <div
                className="p-3 rounded-circle me-3"
                style={{ backgroundColor: "#f3e5f5" }}
              >
                <FaMapMarkerAlt
                  className="text-danger"
                  style={{ fontSize: "1.5rem" }}
                />
              </div>
              <div>
                <small className="text-muted d-block">Address</small>
                <strong>{guide.address}</strong>
              </div>
            </div>
          </div>
        </div>

        <hr />

        <h6 className="fw-bold mb-3">📍 Upcoming Tours</h6>
        {tours && tours.length > 0 ? (
          <div className="list-group list-group-flush">
            {tours.map((tour, index) => (
              <div key={index} className="list-group-item px-0 py-2">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <strong>{tour.name || `Tour ${index + 1}`}</strong>
                    <p className="mb-1 small text-muted">
                      📅 Date: {tour.date || "TBD"}
                    </p>
                    <p className="mb-0 small text-muted">
                      📍 Location: {tour.destination || "Not assigned"}
                    </p>
                  </div>
                  <span className="badge bg-danger">Scheduled</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="alert alert-info mb-0">
            No upcoming tours assigned
          </div>
        )}
      </div>

      <div className="card-footer bg-light py-3">
        <div className="row text-center">
          <div className="col-md-4">
            <small className="text-muted d-block">Member Since</small>
            <strong>
              {new Date(guide.createdAt).toLocaleDateString("en-IN")}
            </strong>
          </div>
          <div className="col-md-4 border-start border-end">
            <small className="text-muted d-block">Experience</small>
            <strong>7+ years</strong>
          </div>
          <div className="col-md-4">
            <small className="text-muted d-block">Specialization</small>
            <strong>Adventure Tours</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideInfoCard;
