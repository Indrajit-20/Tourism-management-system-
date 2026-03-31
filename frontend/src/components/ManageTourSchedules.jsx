import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:4000";
const MIN_ADMIN_SCHEDULE_LEAD_DAYS = 3;

const addDays = (date, days) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

const toDayString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDurationDays = (durationText) => {
  const text = String(durationText || "");
  const match = text.match(/(\d+)\s*day/i);
  if (!match) return null;
  const days = Number(match[1]);
  if (!Number.isInteger(days) || days < 1) return null;
  return days;
};

const calculateEndDateFromDuration = (startDate, durationText) => {
  if (!startDate) return "";
  const days = getDurationDays(durationText);
  if (!days) return "";

  const start = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) return "";

  // Example: 6 days trip means end date is start + 5 days.
  start.setDate(start.getDate() + (days - 1));
  return toDayString(start);
};

/**
 * Admin component to create and manage tour schedules for a package
 */
const ManageTourSchedules = ({ packageId, packageName, packageDuration }) => {
  const [schedules, setSchedules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
    bus_id: "",
    price: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const minStartDate = toDayString(
    addDays(new Date(), MIN_ADMIN_SCHEDULE_LEAD_DAYS),
  );

  useEffect(() => {
    fetchSchedules();
    fetchBuses();
  }, [packageId]);

  const fetchSchedules = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/tour-schedules/package/${packageId}/schedules?status=Draft,Open,BookingFull,Completed`,
      );
      setSchedules(res.data);
    } catch (err) {
      setError("Error fetching schedules");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuses = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/bus?category=tour`);
      setBuses(res.data);
    } catch (err) {
      console.error("Error fetching buses:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "start_date") {
      setFormData((prev) => ({
        ...prev,
        start_date: value,
        end_date: calculateEndDateFromDuration(value, packageDuration),
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateDeparture = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.start_date || !formData.bus_id || !formData.price) {
      setError("Please fill all required fields");
      return;
    }

    if (formData.start_date < minStartDate) {
      setError(
        `Start date must be at least ${MIN_ADMIN_SCHEDULE_LEAD_DAYS} days from today`,
      );
      return;
    }

    if (formData.end_date && formData.end_date < formData.start_date) {
      setError("End date cannot be earlier than start date");
      return;
    }

    if (Number(formData.price) <= 0) {
      setError("Price must be greater than 0");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const payload = {
        package_id: packageId,
        ...formData,
      };

      if (editingId) {
        await axios.put(
          `${API_BASE_URL}/api/tour-schedules/${editingId}`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setSuccess(`Schedule updated for ${formatDate(formData.start_date)}`);
      } else {
        await axios.post(`${API_BASE_URL}/api/tour-schedules`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess(`Schedule created for ${formatDate(formData.start_date)}`);
      }

      setFormData({
        start_date: "",
        end_date: "",
        bus_id: "",
        price: "",
        notes: "",
      });
      setEditingId(null);
      setShowForm(false);
      fetchSchedules();
    } catch (err) {
      setError(err.response?.data?.message || "Error saving schedule");
    }
  };

  const handleOpenSchedule = async (scheduleId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/api/tour-schedules/${scheduleId}/open`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setSuccess("Schedule opened for bookings");
      fetchSchedules();
    } catch (err) {
      setError(err.response?.data?.message || "Error opening schedule");
    }
  };

  const handleEditSchedule = (schedule) => {
    if (schedule.departure_status !== "Draft") {
      setError("Only draft schedules can be edited");
      return;
    }

    setEditingId(schedule._id);
    setFormData({
      start_date: schedule.start_date ? schedule.start_date.split("T")[0] : "",
      end_date: schedule.end_date ? schedule.end_date.split("T")[0] : "",
      bus_id:
        typeof schedule.bus_id === "object"
          ? schedule.bus_id?._id || ""
          : schedule.bus_id || "",
      price: schedule.price ?? schedule.price_per_person ?? "",
      notes: schedule.notes || "",
    });
    setShowForm(true);
  };

  const handleDeleteSchedule = async (schedule) => {
    if (schedule.departure_status !== "Draft") {
      setError("Only draft schedules can be deleted");
      return;
    }

    const confirmed = window.confirm(
      "Delete this draft schedule? This action cannot be undone.",
    );
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/api/tour-schedules/${schedule._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("Draft schedule deleted successfully");
      fetchSchedules();
    } catch (err) {
      setError(err.response?.data?.message || "Error deleting schedule");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({
      start_date: "",
      end_date: "",
      bus_id: "",
      price: "",
      notes: "",
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "Draft":
        return "secondary";
      case "Open":
        return "success";
      case "BookingFull":
        return "warning";
      case "Completed":
        return "dark";
      case "Archived":
        return "light";
      default:
        return "primary";
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <div className="manage-tour-schedules p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>
          <strong>Tour Schedules - {packageName}</strong>
        </h4>
        <button
          className="btn btn-primary"
          onClick={() => (showForm ? handleCancelEdit() : setShowForm(true))}
        >
          {showForm ? "Cancel" : "+ Create New Schedule"}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Create Form */}
      {showForm && (
        <div className="card p-4 mb-4 bg-light">
          <h5 className="mb-3">
            {editingId ? "Edit Draft Schedule" : "Create New Schedule"}
          </h5>
          <form onSubmit={handleCreateDeparture}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">
                  <strong>Start Date *</strong>
                </label>
                <input
                  type="date"
                  name="start_date"
                  className="form-control"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  min={minStartDate}
                  required
                />
                <small className="text-muted d-block mt-1">
                  Start date must be at least {MIN_ADMIN_SCHEDULE_LEAD_DAYS}{" "}
                  days from today.
                </small>
                {!!getDurationDays(packageDuration) && (
                  <small className="text-muted d-block mt-1">
                    End date auto-fills from package duration ({packageDuration}
                    ).
                  </small>
                )}
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">
                  <strong>End Date</strong>
                </label>
                <input
                  type="date"
                  name="end_date"
                  className="form-control"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  min={formData.start_date || undefined}
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">
                  <strong>Bus *</strong>
                </label>
                <select
                  name="bus_id"
                  className="form-control"
                  value={formData.bus_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Bus</option>
                  {buses.map((bus) => (
                    <option key={bus._id} value={bus._id}>
                      {bus.bus_name} ({bus.bus_number}) - {bus.total_seats}{" "}
                      seats
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">
                  <strong>Price (₹) *</strong>
                </label>
                <input
                  type="number"
                  name="price"
                  className="form-control"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="1"
                  required
                />
              </div>

              <div className="col-md-12 mb-3">
                <label className="form-label">
                  <strong>Notes</strong>
                </label>
                <textarea
                  name="notes"
                  className="form-control"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="2"
                  placeholder="e.g., Early bird discount, Special group offer..."
                />
              </div>
            </div>

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-success">
                {editingId ? "Update Schedule" : "Create Schedule"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleCancelEdit}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Schedules List */}
      <div className="row g-3">
        {schedules.length === 0 ? (
          <div className="col-12">
            <div className="alert alert-info">No schedules created yet.</div>
          </div>
        ) : (
          schedules.map((dep) => (
            <div key={dep._id} className="col-lg-6">
              <div className="card p-3 border-2">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h6 className="mb-1">📅 {formatDate(dep.start_date)}</h6>
                    {dep.end_date && (
                      <small className="text-muted">
                        to {formatDate(dep.end_date)}
                      </small>
                    )}
                  </div>
                  <span
                    className={`badge bg-${getStatusBadgeColor(dep.departure_status)}`}
                  >
                    {dep.departure_status}
                  </span>
                </div>

                <div className="mt-2">
                  <div className="mb-2">
                    <small className="text-muted">📍 Route:</small>
                    <strong>
                      {" "}
                      {dep.package_id?.source_city || "-"} to{" "}
                      {dep.package_id?.destination || "-"}
                    </strong>
                  </div>

                  <div className="mb-2">
                    <small className="text-muted">🚌 Bus:</small>
                    <strong>
                      {" "}
                      {dep.bus_id?.bus_name || "N/A"}
                      {dep.bus_id?.bus_number
                        ? ` (${dep.bus_id.bus_number})`
                        : ""}
                    </strong>
                  </div>

                  <div className="mb-2">
                    <small className="text-muted">💰 Price:</small>
                    <strong>
                      {" "}
                      ₹{dep.price ?? dep.price_per_person}/person
                    </strong>
                  </div>

                  <div className="mb-2">
                    <small className="text-muted">🪑 Seats:</small>
                    <strong>
                      {" "}
                      {dep.available_seats}/{dep.total_seats} available
                    </strong>
                  </div>

                  <div className="mb-2">
                    <small className="text-muted">🧭 Guide:</small>
                    <strong>
                      {" "}
                      {dep.package_id?.tour_guide?.name || "Not assigned"}
                    </strong>
                  </div>

                  {dep.notes && (
                    <div className="mb-2">
                      <small className="text-muted">📝 {dep.notes}</small>
                    </div>
                  )}
                </div>

                <div className="mt-3 d-flex gap-2 flex-wrap">
                  {dep.departure_status === "Draft" && (
                    <>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleOpenSchedule(dep._id)}
                      >
                        Open Booking
                      </button>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleEditSchedule(dep)}
                      >
                        Edit Draft
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteSchedule(dep)}
                      >
                        Delete Draft
                      </button>
                    </>
                  )}

                  {dep.departure_status === "BookingFull" && (
                    <small className="text-warning">
                      Booking full. No seats left.
                    </small>
                  )}

                  {dep.departure_status === "Open" && (
                    <small className="text-success">Open for booking</small>
                  )}

                  {dep.departure_status === "Completed" && (
                    <small className="text-muted">
                      Completed automatically
                    </small>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageTourSchedules;
