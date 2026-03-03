import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";
import axios from "axios";
import Packagecard from "../components/Packagecard";

const Hompage = () => {
  const [pkg, setpkg] = useState([]);
  const [featuredRoutes, setFeaturedRoutes] = useState([]); // State for Bus Routes
  const [loading, setLoading] = useState(true);

  // Fetch Packages
  const fetchpkg = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/packages");
      setpkg(res.data);
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

  return (
    <>
      <Header />

      <main className="container my-5">
        {/* --- DYNAMIC BUS PREVIEW SECTION --- */}
        <section className="mb-5">
          <h2 className="text-center mb-4">🚍 Available Bus Services</h2>

          {featuredRoutes.length > 0 ? (
            <div className="row">
              {featuredRoutes.map((route) => (
                <div key={route._id} className="col-md-4 mb-3">
                  <div className="card shadow-sm h-100 border-primary">
                    <div className="card-body">
                      <h5 className="card-title text-primary">
                        {route.boarding_from} &rarr; {route.destination}
                      </h5>
                      <p className="card-text text-muted mb-1">
                        Bus: {route.bus_id?.bus_number || "Standard"} (
                        {route.bus_id?.bus_type})
                      </p>
                      <p className="fw-bold mb-3">
                        Rate: ₹{route.price_per_seat}
                      </p>
                      <Link
                        to="/book-bus"
                        className="btn btn-sm btn-outline-primary w-100"
                      >
                        Book This Route
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              <div className="col-12 text-center mt-3">
                <Link to="/book-bus" className="btn btn-primary">
                  View All Bus Routes
                </Link>
              </div>
            </div>
          ) : (
            <div className="alert alert-warning text-center">
              No Bus Routes Found. (Please add routes in Admin Panel first)
              <br />
              <Link
                to="/book-bus"
                className="btn btn-sm btn-outline-secondary mt-2"
              >
                Go to Bus Booking Page
              </Link>
            </div>
          )}
        </section>

        <h2 className="mb-4 border-bottom pb-2">Popular Tour Packages</h2>

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
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
};

export default Hompage;
