import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Storage from "../utils/storage";
import ReviewsDisplay from "../components/ReviewsDisplay";
import "../css/bookPackage.css";

const getBoardingPoint = (packageData) => {
  const points =
    packageData?.boarding_points || packageData?.pickup_points || [];
  if (!Array.isArray(points) || points.length === 0) return "";
  return points[0] || "";
};

const getFareAfterChildDiscount = (age, basePrice) => {
  const numericAge = Number(age);
  const isChild =
    Number.isFinite(numericAge) && numericAge > 0 && numericAge < 12;
  return isChild ? basePrice / 2 : basePrice;
};

const isValidPassengerName = (name) => {
  const text = String(name || "").trim();
  if (!text) return false;
  if (text.length > 60) return false;
  if (/^\d+$/.test(text)) return false;
  return true;
};

const isValidPassengerAge = (age) => {
  const numericAge = Number(age);
  return Number.isFinite(numericAge) && numericAge > 0 && numericAge <= 120;
};

const BookPackage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const scheduleIdFromQuery =
    queryParams.get("schedule") || queryParams.get("departure");
  const [packageData, setPackageData] = useState(null);
  const [selectedDeparture, setSelectedDeparture] = useState(
    location.state?.selectedDeparture || null
  );
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [passengers, setPassengers] = useState([]);

  useEffect(() => {
    const incomingSeats = Array.isArray(location.state?.selectedSeats)
      ? location.state.selectedSeats
      : [];

    const normalizedSeats = incomingSeats
      .map((seat) => String(seat).trim().toUpperCase())
      .filter(Boolean);

    setSelectedSeats(normalizedSeats);
  }, [location.state]);

  useEffect(() => {
    if (selectedSeats.length === 0) return;

    // Keep passenger forms exactly same count as selected seats.
    setPassengers((prev) =>
      selectedSeats.map(
        (_, index) => prev[index] || { name: "", age: "", gender: "Male" }
      )
    );
  }, [selectedSeats]);

  // 1. Fetch Package + selected departure data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const departureId = selectedDeparture?._id || scheduleIdFromQuery;
        if (!departureId) {
          navigate(`/package-details/${id}`);
          return;
        }

        const [pkgRes, depRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/packages/${id}`),
          axios.get(`${import.meta.env.VITE_API_URL}/tour-schedules/${departureId}`),
        ]);

        setPackageData(pkgRes.data);
        setSelectedDeparture(depRes.data);
      } catch (err) {
        console.error("Error fetching package details");
      }
    };
    fetchData();
  }, [id, navigate, selectedDeparture?._id, scheduleIdFromQuery]);

  // Update what the user types in the boxes
  const handlePassengerChange = (index, field, value) => {
    const updated = [...passengers];

    if (field === "name") {
      const trimmed = String(value || "");
      if (trimmed.length > 60) {
        alert("Passenger name cannot be more than 60 characters.");
        return;
      }
      if (/^\d+$/.test(trimmed.trim()) && trimmed.trim().length > 0) {
        alert("Passenger name cannot be only numeric.");
        return;
      }
    }

    if (field === "age") {
      const numericAge = Number(value);
      if (
        value !== "" &&
        (!Number.isFinite(numericAge) || numericAge <= 0 || numericAge > 120)
      ) {
        alert("please enter correct age");
        return;
      }
    }

    updated[index][field] = value;
    setPassengers(updated);
  };

  // Submit to Backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = Storage.getToken();

    if (!token) return alert("Please login first!");

    if (selectedSeats.length === 0) {
      return alert("Please select seats first.");
    }

    if (selectedSeats.length !== passengers.length) {
      return alert("Passenger count and selected seat count must be the same.");
    }

    if (!selectedDeparture?._id) {
      return alert("Please select a schedule first.");
    }

    const boardingPoint = getBoardingPoint(packageData);
    if (!boardingPoint) {
      return alert("Boarding point is not available for this package.");
    }

    const invalidPassenger = passengers.find((person) => {
      const name = String(person?.name || "");
      const age = person?.age;
      const gender = String(person?.gender || "");
      return (
        !isValidPassengerName(name) ||
        !isValidPassengerAge(age) ||
        !["Male", "Female", "Other"].includes(gender)
      );
    });

    if (invalidPassenger) {
      return alert(
        "Please fill valid passenger details: Name (not numeric, max 60 chars), Age (1-120), and Gender."
      );
    }

    setSubmitting(true);

    try {
      const payload = {
        package_id: id,
        tour_schedule_id: selectedDeparture._id,
        travellers: String(passengers.length),
        pickup_location: boardingPoint,
        passengers,
        seat_numbers: selectedSeats,
      };

      await axios.post(`${import.meta.env.VITE_API_URL}/bookings/book`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Booking submitted! Waiting for admin approval.");
      navigate("/my-bookings");
    } catch (err) {
      alert(err?.response?.data?.message || "Booking Failed.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!packageData) return <h3>Loading...</h3>;

  if (selectedSeats.length === 0) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          Please select departure and seats first before entering passenger
          details.
        </div>
        <button
          className="btn btn-primary"
          onClick={() =>
            navigate(
              `/packages/${id}/select-seats?schedule=${
                selectedDeparture?._id || scheduleIdFromQuery
              }`,
              {
                state: { selectedDeparture },
              }
            )
          }
        >
          Go to Seat Selection
        </button>
      </div>
    );
  }

  const seatWiseRows = selectedSeats.map((seatNumber, index) => {
    const departurePrice = Number(
      selectedDeparture?.price ?? selectedDeparture?.price_per_person ?? 0
    );
    const age = passengers[index]?.age;
    const fare = getFareAfterChildDiscount(age, departurePrice);
    const discount = Math.max(departurePrice - fare, 0);
    const isChild = discount > 0;

    return {
      seatNumber,
      passengerName: passengers[index]?.name || `Passenger ${index + 1}`,
      isChild,
      baseFare: departurePrice,
      discount,
      fare,
    };
  });

  const totalToDisplay = seatWiseRows.reduce((sum, row) => sum + row.fare, 0);
  const totalDiscount = seatWiseRows.reduce(
    (sum, row) => sum + row.discount,
    0
  );
  const childCount = seatWiseRows.filter((row) => row.isChild).length;
  const boardingPoint = getBoardingPoint(packageData);

  return (
    <div className="container mt-5 mb-5 bp-page">
      <div className="d-flex align-items-center mb-3">
        <button
          className="btn btn-outline-secondary me-3"
          onClick={() =>
            navigate(
              `/packages/${id}/select-seats?schedule=${
                selectedDeparture?._id || scheduleIdFromQuery
              }`,
              {
                state: { selectedSeats, selectedDeparture },
              }
            )
          }
        >
          &larr; Change Seats
        </button>
        <div>
          <h2 className="mb-0">Passenger Details</h2>
          <small className="text-muted">{packageData.package_name}</small>
        </div>
      </div>
      <p className="bp-note">
        Price: ₹
        {selectedDeparture?.price ?? selectedDeparture?.price_per_person ?? "-"}{" "}
        per person. All seats have the same base fare. Child discount (age under
        12) is 50%.
      </p>

      {childCount > 0 && (
        <div className="alert alert-success py-2">
          Child discount applied for {childCount} passenger
          {childCount > 1 ? "s" : ""}. Total discount: ₹{totalDiscount}
        </div>
      )}

      <div className="card p-4 shadow-sm mt-3 bp-card">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label fw-semibold">Boarding Point</label>
            <div className="bp-boarding-box">
              {boardingPoint || "Boarding point not available"}
            </div>
          </div>

          <div className="mb-4">
            <h5 className="mb-3">Passenger Details</h5>
            <div className="alert alert-secondary py-2">
              Selected Seats: {selectedSeats.join(", ")}
            </div>

            {/* Loop through the list to show the boxes */}
            {passengers.map((person, index) => (
              <div key={index} className="border p-3 mb-3 bg-light rounded">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5>Passenger {index + 1}</h5>
                  <span className="badge bg-primary">
                    Seat: {selectedSeats[index]}
                  </span>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Full Name"
                      value={person.name}
                      onChange={(e) =>
                        handlePassengerChange(index, "name", e.target.value)
                      }
                      maxLength={60}
                      required
                    />
                  </div>
                  <div className="col-md-3 mb-2">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Age"
                      value={person.age}
                      onChange={(e) =>
                        handlePassengerChange(index, "age", e.target.value)
                      }
                      min="1"
                      max="120"
                      required
                    />
                  </div>
                  <div className="col-md-3 mb-2">
                    <select
                      className="form-select"
                      value={person.gender}
                      onChange={(e) =>
                        handlePassengerChange(index, "gender", e.target.value)
                      }
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="d-flex justify-content-end align-items-center mb-4">
            <h4 className="text-success mb-0">Total: ₹{totalToDisplay}</h4>
          </div>

          <div className="mb-4">
            <h6 className="mb-2">Seat-wise Price</h6>
            {seatWiseRows.length === 0 ? (
              <p className="text-muted mb-0">
                Select seats to see seat-wise price.
              </p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-bordered align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Seat</th>
                      <th>Passenger</th>
                      <th>Base Fare</th>
                      <th>Child Discount</th>
                      <th>Fare</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seatWiseRows.map((row) => (
                      <tr key={row.seatNumber}>
                        <td>{row.seatNumber}</td>
                        <td>{row.passengerName}</td>
                        <td>₹{row.baseFare}</td>
                        <td>{row.discount > 0 ? `- ₹${row.discount}` : "-"}</td>
                        <td className="fw-bold">₹{row.fare}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-3 fs-5"
            disabled={submitting || selectedSeats.length !== passengers.length}
          >
            Submit Booking Request (₹{totalToDisplay})
          </button>
        </form>
      </div>

      {/* Reviews Section */}
      <ReviewsDisplay packageId={id} type="package" />
    </div>
  );
};

export default BookPackage;
