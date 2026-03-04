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
    <div
      style={{
        backgroundColor: "#f9f9f9",
        minHeight: "100vh",
        paddingTop: "30px",
      }}
    >
      <div className="container">
        {/* Header with Image & Title */}
        <div className="row g-4 mb-5">
          <div className="col-lg-7">
            <div className="card border-0 shadow overflow-hidden rounded-4">
              <img
                src={`http://localhost:4000/uploads/${packageData.image_url}`}
                className="img-fluid"
                alt={packageData.package_name}
                style={{ height: "450px", objectFit: "cover", width: "100%" }}
              />
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card border-0 shadow-lg p-4 rounded-4 h-100">
              <h2 className="fw-bold text-dark mb-3">
                {packageData.package_name}
              </h2>
              <p className="text-muted fs-5 mb-4">
                <i className="bi bi-geo-alt-fill text-primary"></i>{" "}
                {packageData.destination}
              </p>

              <p className="text-muted lh-lg mb-4">
                {packageData.description ||
                  "No description available for this package."}
              </p>

              {/* Price & Duration Boxes */}
              <div className="row g-3 mb-4">
                <div className="col-6">
                  <div className="bg-light p-3 rounded-3 text-center">
                    <small className="text-muted d-block mb-1">Duration</small>
                    <h5 className="fw-bold text-primary mb-0">
                      {packageData.duration} Days
                    </h5>
                  </div>
                </div>
                <div className="col-6">
                  <div className="bg-light p-3 rounded-3 text-center">
                    <small className="text-muted d-block mb-1">Price</small>
                    <h5 className="fw-bold text-success mb-0">
                      ₹{packageData.price}
                    </h5>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="alert alert-info p-3 rounded-3 mb-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <small className="text-dark d-block fw-bold">
                      Guest Rating
                    </small>
                    <h5 className="fw-bold text-primary mb-0">⭐ 4.8/5.0</h5>
                  </div>
                  <div className="text-end">
                    <small className="text-dark d-block">95% Recommend</small>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="d-grid gap-2">
                <Link
                  to={`/packages/${id}`}
                  className="btn btn-primary btn-lg fw-bold rounded-3"
                >
                  <i className="bi bi-bag-check me-2"></i>Book Now
                </Link>
                <Link
                  to="/"
                  className="btn btn-outline-primary btn-lg rounded-3"
                >
                  <i className="bi bi-arrow-left me-2"></i>Back
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="row g-4 mb-5">
          {/* Hotel Info */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-lg p-4 rounded-4 h-100">
              <h5 className="fw-bold text-dark mb-3">
                <i className="bi bi-building text-primary me-2"></i>Hotel & Stay
              </h5>
              <div className="bg-light p-3 rounded-3">
                <p className="fw-bold text-dark mb-1">
                  {packageData.hotel_id?.name || "Hotel"}
                </p>
                <p className="text-muted small mb-0">
                  📍 {packageData.hotel_id?.location || "Location"}
                </p>
              </div>
            </div>
          </div>

          {/* What's Included */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-lg p-4 rounded-4 h-100">
              <h5 className="fw-bold text-dark mb-3">
                <i className="bi bi-check-circle text-success me-2"></i>What's
                Included
              </h5>
              <div className="bg-light p-3 rounded-3">
                <p className="text-dark small mb-0">
                  {packageData.inclusive || "Food, Transport & Guide"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Exclusions if available */}
        {packageData.exclusive && (
          <div className="row g-4 mb-5">
            <div className="col-12">
              <div className="alert alert-danger p-4 rounded-4 mb-0">
                <h5 className="fw-bold text-danger mb-2">
                  <i className="bi bi-info-circle me-2"></i>Note
                </h5>
                <p className="text-danger mb-0">{packageData.exclusive}</p>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="card border-0 shadow-lg p-5 rounded-4 bg-white mb-5">
          <h3 className="fw-bold text-dark text-center mb-4">
            <i className="bi bi-chat-hearts text-danger me-2"></i>Guest Reviews
          </h3>
          <ReviewsDisplay packageId={id} type="package" />
        </div>
      </div>
    </div>
  );
};

export default PackageDetails;
