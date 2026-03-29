import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import ReviewsDisplay from "../components/ReviewsDisplay";

const getSeatSurcharge = (seatNumber) => {
  const seatIndex = Number(String(seatNumber).replace(/\D/g, ""));
  if (!seatIndex || Number.isNaN(seatIndex)) return 0;
  if (seatIndex <= 4) return 300;
  if (seatIndex <= 10) return 150;
  return 0;
};

const getPassengerFare = (person, basePrice) => {
  const age = Number(person?.age);
  if (!Number.isNaN(age) && age > 0 && age < 12) {
    return basePrice / 2;
  }
  return basePrice;
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
    location.state?.selectedDeparture || null,
  );
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [pickupLocation, setPickupLocation] = useState("");
  const [aadhaarPhoto, setAadhaarPhoto] = useState(null);

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
        (_, index) => prev[index] || { name: "", age: "", gender: "Male" },
      ),
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
          axios.get(`http://localhost:4000/api/packages/${id}`),
          axios.get(`http://localhost:4000/api/tour-schedules/${departureId}`),
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
    updated[index][field] = value;
    setPassengers(updated);
  };

  // Submit to Backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

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

    if (!pickupLocation) {
      return alert("Please select pickup location.");
    }

    const leadPassenger = passengers[0] || {};
    if (!/^\d{12}$/.test(String(leadPassenger.aadhaar_number || "").trim())) {
      return alert("Lead passenger Aadhaar number must be exactly 12 digits.");
    }

    if (!aadhaarPhoto) {
      return alert(
        "Lead passenger Aadhaar photo is required (JPG/PNG, max 2MB).",
      );
    }

    const invalidPassenger = passengers.find((person) => {
      const name = String(person?.name || "").trim();
      const age = Number(person?.age);
      const gender = String(person?.gender || "");
      return (
        !name ||
        !Number.isFinite(age) ||
        age <= 0 ||
        age > 120 ||
        !["Male", "Female", "Other"].includes(gender)
      );
    });

    if (invalidPassenger) {
      return alert(
        "Please fill valid passenger details (name, age 1-120, gender).",
      );
    }

    setSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("package_id", id);
      payload.append("tour_schedule_id", selectedDeparture._id);
      payload.append("travellers", String(passengers.length));
      payload.append("pickup_location", pickupLocation);
      payload.append("passengers", JSON.stringify(passengers));
      payload.append("seat_numbers", JSON.stringify(selectedSeats));
      payload.append("aadhaar_photo", aadhaarPhoto);

      await axios.post("http://localhost:4000/api/bookings/book", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
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
              `/packages/${id}/select-seats?schedule=${selectedDeparture?._id || scheduleIdFromQuery}`,
              {
                state: { selectedDeparture },
              },
            )
          }
        >
          Go to Seat Selection
        </button>
      </div>
    );
  }

  const seatWiseRows = selectedSeats.map((seatNumber, index) => {
    const person = passengers[index] || {};
    const departurePrice = Number(
      selectedDeparture?.price ?? selectedDeparture?.price_per_person ?? 0,
    );
    const baseFare = getPassengerFare(person, departurePrice);
    const seatSurcharge = getSeatSurcharge(seatNumber);
    const finalFare = baseFare + seatSurcharge;

    return {
      seatNumber,
      passengerName: person.name || `Passenger ${index + 1}`,
      baseFare,
      seatSurcharge,
      finalFare,
    };
  });

  const totalToDisplay = seatWiseRows.reduce(
    (sum, row) => sum + row.finalFare,
    0,
  );

  return (
    <div className="container mt-5">
      <div className="d-flex align-items-center mb-3">
        <button
          className="btn btn-outline-secondary me-3"
          onClick={() =>
            navigate(
              `/packages/${id}/select-seats?schedule=${selectedDeparture?._id || scheduleIdFromQuery}`,
              {
                state: { selectedSeats, selectedDeparture },
              },
            )
          }
        >
          &larr; Change Seats
        </button>
        <h2 className="mb-0">Passenger Details: {packageData.package_name}</h2>
      </div>
      <p>
        Price: ₹
        {selectedDeparture?.price ?? selectedDeparture?.price_per_person ?? "-"}{" "}
        per person. Children below 12 years get 50% off automatically. Seat
        surcharge: S1-S4 +₹300, S5-S10 +₹150.
      </p>

      <div className="card p-4 shadow-sm mt-3">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label fw-semibold">Pickup Location</label>
            <select
              className="form-select"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              required
            >
              <option value="">Select pickup location</option>
              {(
                packageData.boarding_points ||
                packageData.pickup_points ||
                []
              ).map((point) => (
                <option key={point} value={point}>
                  {point}
                </option>
              ))}
            </select>
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

                {index === 0 && (
                  <div className="alert alert-info py-2">
                    Lead passenger must provide Aadhaar details.
                  </div>
                )}

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

                  {index === 0 && (
                    <>
                      <div className="col-md-6 mb-2">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Lead Aadhaar Number (12 digits)"
                          value={person.aadhaar_number || ""}
                          onChange={(e) =>
                            handlePassengerChange(
                              index,
                              "aadhaar_number",
                              e.target.value,
                            )
                          }
                          pattern="\d{12}"
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-2">
                        <input
                          type="file"
                          className="form-control"
                          accept="image/jpeg,image/png"
                          onChange={(e) =>
                            setAadhaarPhoto(e.target.files?.[0] || null)
                          }
                          required
                        />
                      </div>
                    </>
                  )}
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
                      <th>Surcharge</th>
                      <th>Final Fare</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seatWiseRows.map((row) => (
                      <tr key={row.seatNumber}>
                        <td>{row.seatNumber}</td>
                        <td>{row.passengerName}</td>
                        <td>₹{row.baseFare}</td>
                        <td>₹{row.seatSurcharge}</td>
                        <td className="fw-bold">₹{row.finalFare}</td>
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
            Proceed to Payment (₹{totalToDisplay})
          </button>
        </form>
      </div>

      {/* Reviews Section */}
      <ReviewsDisplay packageId={id} type="package" />
    </div>
  );
};

export default BookPackage;
