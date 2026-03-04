import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Packagecard from "../components/Packagecard";
import ReviewsDisplay from "../components/ReviewsDisplay";

const Hompage = () => {
  const [pkg, setpkg] = useState([]);
  const [ratings, setRatings] = useState({});
  const [featuredRoutes, setFeaturedRoutes] = useState([]); // State for Bus Routes
  const [loading, setLoading] = useState(true);

  // Fetch Packages
  const fetchpkg = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/packages");
      setpkg(res.data);

      // Fetch ratings (parallel)
      const ratingsData = {};
      const ratingPromises = res.data.map(async (p) => {
        try {
          const r = await axios.get(
            `http://localhost:4000/api/feedback/rating/package/${p._id}`,
          );
          ratingsData[p._id] = r.data;
        } catch (e) {
          ratingsData[p._id] = { average_rating: 0, total_reviews: 0 };
        }
      });
      await Promise.all(ratingPromises);
      setRatings(ratingsData);
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
              <h2 className="display-6 fw-bold mb-0">🚍 Featured Bus Routes</h2>
              <p className="text-muted">
                Top destinations from our latest schedule
              </p>
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
                      <Link
                        to="/book-bus"
                        className="btn btn-primary w-100 py-2 fw-bold"
                      >
                        Check Availability
                      </Link>
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
            <h2 className="display-6 fw-bold mb-0">🌴 Popular Tour Packages</h2>
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
            {pkg.map((p) => (
              <div className="col-md-4 mb-4" key={p._id}>
                <Packagecard
                  id={p._id}
                  image_url={p.image_url}
                  package_name={p.package_name}
                  destination={p.destination}
                  price={p.price}
                  duration={p.duration}
                  rating={ratings[p._id]?.average_rating || 0}
                  totalReviews={ratings[p._id]?.total_reviews || 0}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
};

export default Hompage;
