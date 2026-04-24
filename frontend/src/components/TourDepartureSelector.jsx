import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL.replace("/api", "");

/**
 * Shows available tour schedules for a package
 * User selects one to proceed with booking
 */
const isScheduleBookable = (schedule) => {
  const validStatus = ["Open"].includes(schedule?.departure_status);
  const hasSeats = Number(schedule?.available_seats || 0) > 0;
  return validStatus && hasSeats;
};

const TourDepartureSelector = ({ packageId, onSelect, initialSelectedId }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartureId, setSelectedDepartureId] = useState(null);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/tour-schedules/package/${packageId}/schedules`
        );
        setSchedules(res.data);
      } catch (err) {
        console.error("Error fetching schedules:", err);
      } finally {
        setLoading(false);
      }
    };

    if (packageId) {
      setHasAutoSelected(false);
      setSelectedDepartureId(null);
      fetchSchedules();
    }
  }, [packageId]);

  useEffect(() => {
    if (!schedules.length || hasAutoSelected) return;

    const scheduleFromQuery = initialSelectedId
      ? schedules.find(
          (schedule) =>
            String(schedule._id) === String(initialSelectedId) &&
            isScheduleBookable(schedule)
        )
      : null;

    const firstBookableSchedule = schedules.find((schedule) =>
      isScheduleBookable(schedule)
    );
    const defaultSchedule =
      scheduleFromQuery || firstBookableSchedule || schedules[0];

    if (!defaultSchedule) return;

    setSelectedDepartureId(defaultSchedule._id);
    if (onSelect) onSelect(defaultSchedule);
    setHasAutoSelected(true);
  }, [schedules, initialSelectedId, hasAutoSelected]);

  const handleSelect = (departure) => {
    setSelectedDepartureId(departure._id);
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
        <strong>Available Schedules</strong>
      </h5>
      <div className="tds-row">
        {schedules.map((dep) => {
          const startDate = new Date(dep.start_date);
          const formattedDate = startDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
          const isSelected = selectedDepartureId === dep._id;
          const isBookable = isScheduleBookable(dep);
          const statusLabel =
            dep.departure_status === "BookingFull"
              ? "Booking Full"
              : dep.departure_status;

          return (
            <div key={dep._id} className="tds-col">
              <div
                className={`card p-3 border-2 ${
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
                    <small className="text-muted d-block">Starting Date</small>
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
                    <strong className="tds-price">
                      ₹{dep.price ?? dep.price_per_person}
                    </strong>
                    <small className="tds-price-unit"> / person</small>
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
