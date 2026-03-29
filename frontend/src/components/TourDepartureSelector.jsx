import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:4000";

/**
 * Shows available tour schedules for a package
 * User selects one to proceed with booking
 */
const TourDepartureSelector = ({ packageId, onSelect }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeparture, setSelectedDeparture] = useState(null);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/tour-schedules/package/${packageId}/schedules`,
        );
        setSchedules(res.data);
      } catch (err) {
        console.error("Error fetching schedules:", err);
      } finally {
        setLoading(false);
      }
    };

    if (packageId) {
      fetchSchedules();
    }
  }, [packageId]);

  const handleSelect = (departure) => {
    setSelectedDeparture(departure);
    if (onSelect) {
      onSelect(departure);
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading schedules...</div>;
  }

  if (schedules.length === 0) {
    return (
      <div className="alert alert-info">
        <strong>No schedules available</strong> for this package yet.
      </div>
    );
  }

  return (
    <div className="departure-selector mb-4">
      <h5 className="mb-3">
        <strong>Select Schedule</strong>
      </h5>
      <div className="row g-3">
        {schedules.map((dep) => {
          const startDate = new Date(dep.start_date);
          const formattedDate = startDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
          const isSelected = selectedDeparture?._id === dep._id;
          const isBookable =
            ["Open", "Locked"].includes(dep.departure_status) &&
            Number(dep.available_seats || 0) > 0;
          const statusLabel =
            dep.departure_status === "BookingFull"
              ? "Booking Full"
              : dep.departure_status;

          return (
            <div key={dep._id} className="col-md-6">
              <div
                className={`card p-3 border-2 cursor-pointer ${
                  isSelected ? "border-primary bg-light" : "border-secondary"
                }`}
                onClick={() => isBookable && handleSelect(dep)}
                style={{
                  cursor: isBookable ? "pointer" : "not-allowed",
                  opacity: isBookable ? 1 : 0.7,
                }}
              >
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h6 className="mb-1">📅 {formattedDate}</h6>
                    <small className="text-muted">
                      Status:{" "}
                      <span className="badge bg-info">{statusLabel}</span>
                    </small>
                  </div>
                  {isSelected && (
                    <div className="badge bg-success">Selected</div>
                  )}
                </div>

                <div className="mt-2">
                  <div className="mb-2">
                    <strong>₹{dep.price ?? dep.price_per_person}</strong>
                    <small className="text-muted"> / person</small>
                  </div>

                  <div className="mb-2">
                    <small className="text-muted">
                      🚌 Bus: {dep.bus_id?.bus_name || "N/A"}
                    </small>
                  </div>

                  <div className="d-flex justify-content-between">
                    <small className="text-success">
                      ✓ {dep.available_seats} seats available
                    </small>
                    <small className="text-muted">
                      {dep.total_seats - dep.available_seats} booked
                    </small>
                  </div>
                </div>

                {!isBookable && (
                  <div className="alert alert-danger mt-2 mb-0 py-1 px-2">
                    <small>❌ Not available for booking</small>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TourDepartureSelector;
