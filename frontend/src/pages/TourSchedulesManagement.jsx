import React, { useEffect, useState } from "react";
import axios from "axios";
import ManageTourSchedules from "../components/ManageTourSchedules";

const API_BASE_URL = "http://localhost:4000";
const MIN_ADMIN_SCHEDULE_LEAD_DAYS = 3;

const TourSchedulesManagement = () => {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/packages`);
      setPackages(res.data);
      if (res.data.length > 0) {
        setSelectedPackage(res.data[0]);
      }
    } catch (err) {
      setError("Error loading packages");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="mb-4">📅 Manage Tour Package Schedules</h3>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {packages.length === 0 ? (
        <div className="alert alert-info">
          No packages available. Please create a package first.
        </div>
      ) : (
        <div className="row">
          <div className="col-md-3">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <strong>Select Package</strong>
              </div>
              <div
                className="list-group list-group-flush"
                style={{ maxHeight: "600px", overflowY: "auto" }}
              >
                {packages.map((pkg) => (
                  <button
                    key={pkg._id}
                    className={`list-group-item list-group-item-action text-start ${
                      selectedPackage?._id === pkg._id ? "active" : ""
                    }`}
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    <div className="fw-semibold">{pkg.package_name}</div>
                    <small className="text-muted">{pkg.destination}</small>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="col-md-9">
            {selectedPackage ? (
              <>
                <div className="alert alert-info" role="alert">
                  <strong>Scheduling policy:</strong> Start date must be at
                  least {MIN_ADMIN_SCHEDULE_LEAD_DAYS} days from today, and
                  price must be greater than 0.
                </div>
                <ManageTourSchedules
                  packageId={selectedPackage._id}
                  packageName={selectedPackage.package_name}
                />
              </>
            ) : (
              <div className="alert alert-info">
                Select a package to manage its tour schedules
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TourSchedulesManagement;
