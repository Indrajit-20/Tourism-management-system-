import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Packagecard from "../components/Packagecard";
import ReviewsDisplay from "../components/ReviewsDisplay";

const mapPackageScheduleToCard = (pkg, schedule) => ({
  cardId: schedule?._id,
  id: pkg?._id,
  scheduleId: schedule?._id,
  package_name: pkg?.package_name,
  source_city: pkg?.source_city || pkg?.start || pkg?.source,
  destination: pkg?.destination || pkg?.destination_city,
  start_date: schedule?.start_date,
  end_date: schedule?.end_date,
  image_urls: pkg?.image_urls,
  image_url: pkg?.image_url,
  price: schedule?.price ?? schedule?.price_per_person,
  duration: pkg?.duration,
  transport: schedule?.bus_id?.bus_type
    ? `${schedule.bus_id.bus_type}${schedule?.bus_id?.bus_name ? ` Bus` : ""}`
    : "-",
  seatBadgeText:
    Number(schedule?.available_seats) > 0
      ? `🔥 ${schedule.available_seats} Seats Left`
      : null,
});

const Hompage = () => {
  const [pkg, setpkg] = useState([]);
  const [featuredRoutes, setFeaturedRoutes] = useState([]); // State for Bus Routes
  const [loading, setLoading] = useState(true);
  const [showTripsModal, setShowTripsModal] = useState(false); // ✅ Modal state
  const [selectedRoute, setSelectedRoute] = useState(null); // ✅ Selected route
  const [trips, setTrips] = useState([]); // ✅ Available trips
  const [tripsLoading, setTripsLoading] = useState(false); // ✅ Loading state

  // Fetch only packages that have at least one open schedule.
  const fetchpkg = async () => {
    try {
      const packageRes = await axios.get("http://localhost:4000/api/packages");
      const packages = Array.isArray(packageRes.data) ? packageRes.data : [];
      const cards = [];

      for (const packageItem of packages) {
        try {
          const scheduleRes = await axios.get(
            `http://localhost:4000/api/tour-schedules/package/${packageItem._id}/departures`,
          );
          const departures = Array.isArray(scheduleRes.data)
            ? scheduleRes.data
            : [];

          for (const dep of departures) {
            if (Number(dep?.available_seats || 0) > 0) {
              cards.push(mapPackageScheduleToCard(packageItem, dep));
            }
          }
        } catch (scheduleError) {
          console.error(
            `Error fetching schedules for package ${packageItem._id}`,
            scheduleError,
          );
        }
      }

      cards.sort(
        (a, b) =>
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
      );

      setpkg(cards);
    } catch (err) {
      console.error("Error fetching packages", err);
    }
  };

  // Fetch Featured Bus Routes (Limit to first 3 for proper display)
  const fetchRoutes = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/bus-routes");
      setFeaturedRoutes(res.data.slice(0, 3)); // Only show top 3
    } catch (err) {
      console.error("Error fetching bus routes", err);
    }
  };

  // ✅ NEW: Fetch available trips for a route
  const handleShowTrips = async (route) => {
    setSelectedRoute(route);
    setShowTripsModal(true);
    setTripsLoading(true);
    setTrips([]);

    try {
      const today = new Date().toISOString().split("T")[0];
      // Fetch trips for next 7 days
      const tripsData = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split("T")[0];

        try {
          const res = await axios.get(
            `http://localhost:4000/api/bus-trips?route_id=${route._id}&date=${dateStr}`,
          );
          if (res.data && res.data.length > 0) {
            tripsData.push(...res.data);
          }
        } catch (err) {
          // Ignore individual date errors
        }
      }
      setTrips(tripsData);
    } catch (err) {
      console.error("Error fetching trips", err);
    } finally {
      setTripsLoading(false);
    }
  };

  useEffect(() => {
    // Run both fetches
    const loadData = async () => {
      await Promise.all([fetchpkg(), fetchRoutes()]);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <div
        className="position-relative overflow-hidden text-center bg-dark text-white shadow-lg"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('/bg2.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "75vh",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 animate__animated animate__fadeIn">
              <h1 className="display-2 fw-bold mb-3">
                Discover Your{" "}
                <span className="text-primary">Next Adventure</span>
              </h1>
              <p className="lead fs-4 mb-5 text-light opacity-75">
                Explore exclusive tour packages and book your bus tickets with
                India's most trusted travel partner.
              </p>
              <div className="d-flex justify-content-center gap-3">
                <Link
                  to="/packages"
                  className="btn btn-primary btn-lg px-5 py-3 fw-bold rounded-pill shadow"
                >
                  View Packages
                </Link>
                <Link
                  to="/book-bus"
                  className="btn btn-outline-light btn-lg px-5 py-3 fw-bold rounded-pill"
                >
                  Search Bus
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container my-5">
        {/* --- BUS PREVIEW SECTION --- */}
        <section className="mb-5 pb-4">
          <div className="row align-items-center mb-4">
            <div className="col-md-6">
              <h2 className="display-6 fw-bold mb-0">🚍 Bus Routes</h2>
              <p className="text-muted">Top destinations</p>
            </div>
            <div className="col-md-6 text-md-end">
              <Link
                to="/book-bus"
                className="btn btn-link text-primary fw-bold text-decoration-none p-0"
              >
                See All Tickets <i className="bi bi-chevron-right"></i>
              </Link>
            </div>
          </div>

          {featuredRoutes.length > 0 ? (
            <div className="row g-4">
              {featuredRoutes.map((route) => (
                <div key={route._id} className="col-md-4">
                  <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden card-hover">
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill">
                          Quick Booking
                        </span>
                        <h4 className="h5 text-success mb-0 fw-bold">
                          ₹{route.price_per_seat}
                        </h4>
                      </div>
                      <div className="d-flex align-items-center mb-4">
                        <div className="flex-grow-1">
                          <p className="text-uppercase small fw-bold text-muted mb-0">
                            Origin
                          </p>
                          <h5 className="mb-0">{route.boarding_from}</h5>
                        </div>
                        <div className="px-3 text-primary">
                          <i className="bi bi-arrow-right fs-4"></i>
                        </div>
                        <div className="flex-grow-1">
                          <p className="text-uppercase small fw-bold text-muted mb-0">
                            Destination
                          </p>
                          <h5 className="mb-0">{route.destination}</h5>
                        </div>
                      </div>
                      <div className="row g-0 py-2 border-top border-bottom mb-4 text-center bg-light rounded-3">
                        <div className="col-6 border-end">
                          <small className="text-muted">Type</small>
                          <p className="mb-0 small fw-bold">
                            {route.bus_id?.bus_type || "AC / Sleeper"}
                          </p>
                        </div>
                        <div className="col-6">
                          <small className="text-muted">Bus No</small>
                          <p className="mb-0 small fw-bold">
                            {route.bus_id?.bus_number || "REG-101"}
                          </p>
                        </div>
                      </div>
                      <button
                        className="btn btn-primary w-100 py-2 fw-bold"
                        onClick={() => handleShowTrips(route)}
                      >
                        Check Availability
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-5 bg-light rounded-4">
              <h4 className="text-muted">
                No featured routes available currently.
              </h4>
              <Link to="/book-bus" className="btn btn-outline-secondary mt-3">
                Browse all routes
              </Link>
            </div>
          )}
        </section>

        {/* --- TOUR PACKAGES SECTION --- */}
        <div className="d-flex justify-content-between align-items-end mb-4 border-bottom pb-3">
          <div>
            <h2 className="display-6 fw-bold mb-0">🌴 Tour Packages</h2>
            <p className="text-muted mb-0">
              Unforgettable experiences curated just for you
            </p>
          </div>
          <Link
            to="/packages"
            className="btn btn-link text-primary fw-bold text-decoration-none p-0"
          >
            View All <i className="bi bi-chevron-right"></i>
          </Link>
        </div>

        {loading ? (
          <div className="text-center">Loading Packages...</div>
        ) : (
          <div className="row">
            {pkg.map((packageData) => {
              return (
                <div className="col-md-4 mb-4" key={packageData.cardId}>
                  <Packagecard
                    id={packageData.id}
                    scheduleId={packageData.scheduleId}
                    source_city={packageData.source_city}
                    destination={packageData.destination}
                    start_date={packageData.start_date}
                    end_date={packageData.end_date}
                    image_urls={packageData.image_urls}
                    image_url={packageData.image_url}
                    package_name={packageData.package_name}
                    price={packageData.price}
                    duration={packageData.duration}
                    transport={packageData.transport}
                    seatBadgeText={packageData.seatBadgeText}
                  />
                </div>
              );
            })}
            {pkg.length === 0 && (
              <div className="col-12">
                <div className="alert alert-info text-center mb-0">
                  No scheduled tour packages are available right now.
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ✅ NEW: AVAILABLE TRIPS MODAL */}
      {showTripsModal && (
        <div
          className="modal d-block"
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 1050,
            overflow: "auto",
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              {/* Header */}
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  🚍 Available Trips - {selectedRoute?.boarding_from} →{" "}
                  {selectedRoute?.destination}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowTripsModal(false);
                    setSelectedRoute(null);
                    setTrips([]);
                  }}
                />
              </div>

              {/* Body */}
              <div
                className="modal-body p-4"
                style={{ maxHeight: "500px", overflowY: "auto" }}
              >
                {tripsLoading ? (
                  <div className="text-center py-5">
                    <div
                      className="spinner-border text-primary"
                      role="status"
                    />
                    <p className="mt-3">Loading available trips...</p>
                  </div>
                ) : trips.length === 0 ? (
                  <div className="text-center py-5">
                    <h5 className="text-muted">😞 No trips available</h5>
                    <p className="text-muted small">
                      This route doesn't have trips scheduled for the next 7
                      days
                    </p>
                  </div>
                ) : (
                  <div className="row g-3">
                    {trips.map((trip) => {
                      const booked =
                        trip.seats?.filter((s) => !s.is_available).length || 0;
                      const total = trip.seats?.length || 0;
                      const available = total - booked;

                      return (
                        <div key={trip._id} className="col-12">
                          <div className="card border-1">
                            <div className="card-body">
                              {/* Date & Time */}
                              <div className="row align-items-center mb-3">
                                <div className="col-md-4">
                                  <h6 className="mb-1 fw-bold">
                                    📅{" "}
                                    {new Date(
                                      trip.trip_date,
                                    ).toLocaleDateString("en-IN", {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </h6>
                                  <small className="text-muted">
                                    {trip.schedule_id?.departure_time || "N/A"}{" "}
                                    → {trip.schedule_id?.arrival_time || "N/A"}
                                  </small>
                                </div>

                                {/* Seats Info */}
                                <div className="col-md-4">
                                  <div className="text-center">
                                    <h6 className="mb-1">
                                      <span className="badge bg-success">
                                        {available}
                                      </span>
                                    </h6>
                                    <small className="text-muted">
                                      Seats Available
                                    </small>
                                  </div>
                                </div>

                                {/* Price */}
                                <div className="col-md-2">
                                  <h6 className="mb-0 fw-bold text-success">
                                    ₹{selectedRoute?.price_per_seat}
                                  </h6>
                                </div>

                                {/* Book Button */}
                                <div className="col-md-2">
                                  <Link
                                    to="/book-seats"
                                    state={{
                                      trip,
                                      route: selectedRoute,
                                      date: new Date(trip.trip_date)
                                        .toISOString()
                                        .split("T")[0],
                                    }}
                                    className="btn btn-sm btn-primary w-100"
                                  >
                                    Book
                                  </Link>
                                </div>
                              </div>

                              {/* Boarding Points */}
                              {trip.boarding_points &&
                                trip.boarding_points.length > 0 && (
                                  <div className="mb-2 p-2 bg-light rounded">
                                    <small className="text-muted d-block">
                                      📍 Boarding Points:
                                    </small>
                                    <small className="fw-500">
                                      {trip.boarding_points.join(", ")}
                                    </small>
                                  </div>
                                )}

                              {/* Seat Status Bar */}
                              <div className="mt-2">
                                <small className="text-muted d-block mb-1">
                                  Seat Status: {booked} booked, {available}{" "}
                                  available
                                </small>
                                <div
                                  className="progress"
                                  style={{ height: "20px" }}
                                >
                                  <div
                                    className="progress-bar bg-danger"
                                    style={{
                                      width: `${(booked / total) * 100}%`,
                                    }}
                                    title={`${booked} booked`}
                                  />
                                  <div
                                    className="progress-bar bg-success"
                                    style={{
                                      width: `${(available / total) * 100}%`,
                                    }}
                                    title={`${available} available`}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowTripsModal(false);
                    setSelectedRoute(null);
                    setTrips([]);
                  }}
                >
                  Close
                </button>
                <Link
                  to="/book-bus"
                  className="btn btn-primary"
                  onClick={() => setShowTripsModal(false)}
                >
                  View All Routes
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Hompage;
