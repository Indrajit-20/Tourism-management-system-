import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import BusLayout from "../components/BusLayout";

const buildSeatLayout = (totalSeats, layoutType, busType, basePrice) => {
  const normalizedLayout = String(layoutType || "").toLowerCase();
  const isSleeper =
    normalizedLayout === "sleeper" || /sleeper/i.test(String(busType || ""));
  const isDoubleDecker =
    normalizedLayout === "double_decker" ||
    /double\s*-?\s*decker/i.test(String(busType || ""));
  const seats = [];

  if (isSleeper) {
    const upperCount = Math.ceil(totalSeats / 2);
    const lowerCount = totalSeats - upperCount;

    for (let i = 1; i <= upperCount; i++) {
      seats.push({
        seat_number: `U${i}`,
        row: Math.ceil(i / 2),
        column: i % 2 === 0 ? 2 : 1,
        type: "sleeper",
        price: basePrice,
      });
    }

    for (let i = 1; i <= lowerCount; i++) {
      seats.push({
        seat_number: `L${i}`,
        row: Math.ceil(i / 2),
        column: i % 2 === 0 ? 2 : 1,
        type: "sleeper",
        price: basePrice,
      });
    }

    return seats;
  }

  if (isDoubleDecker) {
    const upperCount = Math.ceil(totalSeats / 2);
    const lowerCount = totalSeats - upperCount;

    for (let i = 1; i <= upperCount; i++) {
      seats.push({
        seat_number: `U${i}`,
        row: Math.ceil(i / 4),
        column: ((i - 1) % 4) + 1,
        type: "seat",
        price: basePrice,
      });
    }

    for (let i = 1; i <= lowerCount; i++) {
      seats.push({
        seat_number: `L${i}`,
        row: Math.ceil(i / 4),
        column: ((i - 1) % 4) + 1,
        type: "seat",
        price: basePrice,
      });
    }

    return seats;
  }

  for (let i = 1; i <= totalSeats; i++) {
    seats.push({
      seat_number: `S${i}`,
      row: Math.ceil(i / 4),
      column: ((i - 1) % 4) + 1,
      type: "seat",
      price: basePrice,
    });
  }

  return seats;
};

const PackageSeatSelection = () => {
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
  const [seatLayout, setSeatLayout] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const packageReq = axios.get(
          `${import.meta.env.VITE_API_URL}/packages/${id}`,
        );
        const departureId = selectedDeparture?._id || scheduleIdFromQuery;

        if (!departureId) {
          alert("Please select a schedule first.");
          navigate(`/package-details/${id}`);
          return;
        }

        const [packageRes, departureRes, seatsRes] = await Promise.all([
          packageReq,
          axios.get(`${import.meta.env.VITE_API_URL}/tour-schedules/${departureId}`),
          axios.get(
            `${import.meta.env.VITE_API_URL}/tour-schedules/${departureId}/seats`,
          ),
        ]);

        const pkg = packageRes.data;
        const departure = departureRes.data;
        const totalSeats = Number(departure?.total_seats) || 0;
        const basePrice = Number(
          departure?.price ?? departure?.price_per_person ?? 0,
        );
        const layout = buildSeatLayout(
          totalSeats,
          departure?.bus_id?.layout_type,
          departure?.bus_id?.bus_type,
          basePrice,
        );
        const apiSeats = Array.isArray(seatsRes.data?.seats)
          ? seatsRes.data.seats
          : [];
        const hasCoordinates = apiSeats.every(
          (seat) =>
            Number.isFinite(Number(seat.row)) &&
            Number.isFinite(Number(seat.column)),
        );
        const normalizedLayout =
          apiSeats.length > 0 && hasCoordinates
            ? apiSeats.map((seat) => ({
                ...seat,
                row: Number(seat.row),
                column: Number(seat.column),
                type: seat.type || "seat",
                price: Number(seat.price ?? basePrice),
              }))
            : layout;
        const layoutSeatNumbers = normalizedLayout.map(
          (seat) => seat.seat_number,
        );
        const alreadyBooked = (seatsRes.data?.seats || [])
          .filter((seat) => seat.is_booked)
          .map((seat) => String(seat.seat_number).toUpperCase());

        setPackageData(pkg);
        setSelectedDeparture(departure);
        setSeatLayout(normalizedLayout);
        setBookedSeats(alreadyBooked);

        const previousSelection = Array.isArray(location.state?.selectedSeats)
          ? location.state.selectedSeats
          : [];
        const allowedSelection = previousSelection
          .map((seat) => String(seat).trim().toUpperCase())
          .filter(
            (seat) =>
              layoutSeatNumbers.includes(seat) && !alreadyBooked.includes(seat),
          );

        setSelectedSeats(allowedSelection);
      } catch (error) {
        console.error("Error loading seat map", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    id,
    location.state,
    scheduleIdFromQuery,
    navigate,
    selectedDeparture?._id,
  ]);

  const toggleSeat = (seatNumber) => {
    if (bookedSeats.includes(seatNumber)) return;

    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter((seat) => seat !== seatNumber));
      return;
    }

    setSelectedSeats([...selectedSeats, seatNumber]);
  };

  const goToPassengerDetails = () => {
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat.");
      return;
    }

    navigate(
      `/packages/${id}?schedule=${selectedDeparture?._id || scheduleIdFromQuery}`,
      {
        state: { selectedSeats, selectedDeparture },
      },
    );
  };

  if (loading) return <h3 className="text-center mt-5">Loading seat map...</h3>;

  if (!packageData) {
    return <h3 className="text-center mt-5">Package not found.</h3>;
  }

  return (
    <div className="container mt-5">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h2 className="mb-1">Select Seats</h2>
          <p className="text-muted mb-0">{packageData.package_name}</p>
          {selectedDeparture?.start_date && (
            <small className="text-muted">
              Schedule:{" "}
              {new Date(selectedDeparture.start_date).toLocaleDateString(
                "en-IN",
              )}
            </small>
          )}
        </div>
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate(`/package-details/${id}`)}
        >
          Back
        </button>
      </div>

      <div className="alert alert-info">
        Step 1: Select seats first. Step 2: Fill passenger details for the same
        number of seats.
      </div>

      <div className="d-flex flex-wrap gap-2 mb-4">
        <span className="badge bg-secondary">Available</span>
        <span className="badge bg-success">Selected</span>
        <span className="badge bg-danger">Booked</span>
      </div>

      {seatLayout.length === 0 ? (
        <div className="alert alert-warning">
          Bus seat data is not configured for this package.
        </div>
      ) : (
        <div className="mb-4">
          <BusLayout
            seatLayout={seatLayout}
            bookedSeats={bookedSeats}
            selectedSeats={selectedSeats}
            onSeatClick={toggleSeat}
            busType={selectedDeparture?.bus_id?.bus_type || "AC"}
            layoutType={selectedDeparture?.bus_id?.layout_type || "seater"}
          />
        </div>
      )}

      <div className="card shadow-sm p-3 mb-4">
        <h5 className="mb-2">Selected Seats</h5>
        {selectedSeats.length === 0 ? (
          <p className="text-muted mb-0">No seat selected yet.</p>
        ) : (
          <div className="d-flex flex-wrap gap-2">
            {selectedSeats.map((seat) => (
              <span key={seat} className="badge bg-success">
                {seat}
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        className="btn btn-primary btn-lg w-100"
        onClick={goToPassengerDetails}
      >
        Continue to Passenger Details ({selectedSeats.length} seat
        {selectedSeats.length !== 1 ? "s" : ""})
      </button>
    </div>
  );
};

export default PackageSeatSelection;
