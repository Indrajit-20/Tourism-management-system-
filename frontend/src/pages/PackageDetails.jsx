import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import ReviewsDisplay from "../components/ReviewsDisplay";

const PackageDetails = () => {
  const { id } = useParams();
  const [packageData, setPackageData] = useState(null);

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/api/packages/${id}`);
        setPackageData(res.data);
      } catch (err) {
        console.error("Error fetching package details");
      }
    };
    fetchPackage();
  }, [id]);

  if (!packageData) return <h3 className="text-center mt-5">Loading...</h3>;

  return (
    <div className="container mt-5">
      <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
        <div className="row g-0">
          <div className="col-md-6">
            <img
              src={`http://localhost:4000/uploads/${packageData.image_url}`}
              className="img-fluid rounded-start h-100"
              alt={packageData.package_name}
              style={{ objectFit: "cover" }}
            />
          </div>
          <div className="col-md-6">
            <div className="card-body p-5">
              <h2 className="card-title text-primary mb-3">
                {packageData.package_name}
              </h2>
              <h4 className="text-muted mb-4">
                <i className="bi bi-geo-alt-fill"></i> {packageData.destination}
              </h4>
              <p className="card-text fs-5">
                {packageData.description ||
                  "No description available for this package."}
              </p>

              <div className="row mt-4 mb-4">
                <div className="col-md-6 border-end">
                  <h5 className="text-primary fw-bold">🏨 Stay Details</h5>
                  <p className="mb-0 fw-bold">
                    {packageData.hotel_id?.hotel_name || "Modern Residency"}
                  </p>
                  <p className="small text-muted mb-0">
                    {packageData.hotel_id?.address || "City Center Area"}
                  </p>
                </div>
                <div className="col-md-6 ps-md-4 mt-3 mt-md-0">
                  <h5 className="text-primary fw-bold">🗺️ Trip Highlights</h5>
                  <p className="mb-0 fw-bold">
                    {packageData.duration} Days of Sightseeing
                  </p>
                  <p className="small text-muted">
                    {packageData.inclusive ||
                      "Food, Transport & Guide included"}
                  </p>
                </div>
              </div>

              {packageData.exclusive && (
                <div className="alert alert-warning border shadow-sm small mb-4 text-dark">
                  <strong>⚠️ Important Note (Exclusions):</strong>{" "}
                  {packageData.exclusive}
                </div>
              )}

              <div className="mt-4 mb-4 p-3 bg-light rounded-3 border">
                <h5 className="text-secondary fw-bold mb-3 border-bottom pb-2">
                  <i className="bi bi-star-fill text-warning me-2"></i>Package
                  Reputation
                </h5>
                <div className="d-flex align-items-center mb-2">
                  <h3 className="mb-0 me-3 fw-bold">4.8</h3>
                  <div>
                    <div className="text-warning">
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-half"></i>
                    </div>
                    <small className="text-muted">
                      Based on recent travelers
                    </small>
                  </div>
                </div>
                <p className="small text-muted mb-0">
                  <i className="bi bi-chat-heart-fill text-danger me-1"></i>
                  95% of guests recommended this tour for its service and
                  arrangements.
                </p>
              </div>

              <div className="mb-4">
                <span className="text-muted small">Starting Price</span>
                <div className="text-primary fs-3 fw-bold">
                  ₹{packageData.price}
                </div>
              </div>

              <div className="d-grid gap-2">
                <Link to={`/packages/${id}`} className="btn btn-primary btn-lg">
                  Book Now
                </Link>
                <Link to="/" className="btn btn-outline-secondary btn-lg">
                  Back to Packages
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 mb-5 p-5 bg-white rounded-4 shadow-lg border">
        <div className="text-center mb-5">
          <h2 className="fw-bold text-dark">Overall Package Reviews</h2>
          <p className="text-muted">
            Hear from travelers who experienced this specific tour
          </p>
        </div>
        <ReviewsDisplay packageId={id} type="package" />
      </div>
    </div>
  );
};

export default PackageDetails;
