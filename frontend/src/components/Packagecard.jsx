import React from "react";
import { Link } from "react-router-dom";

const Packagecard = ({
  id,
  package_name,
  destination,
  price,
  duration,
  image_url,
  rating,
  totalReviews,
}) => {
  return (
    <>
      <div className={`card`} style={{ width: "18rem" }}>
        {rating > 0 && (
          <div className="position-absolute top-0 end-0 m-2">
            <span className="badge bg-warning text-dark shadow-sm">
              ⭐ {rating} ({totalReviews})
            </span>
          </div>
        )}
        <img
          src={`http://localhost:4000/uploads/${image_url}`}
          className={`card-img-top`}
          alt={image_url}
          style={{ height: "200px", objectFit: "cover" }}
        />

        <div className="card-body">
          {/* Apply titleWrap to handle long names like "Dubai Luxury Tour" */}
          <h5 className={`card-title `}>{package_name}</h5>
          <p className="card-text text-muted small"></p>
        </div>

        <ul className="list-group list-group-flush">
          <li className="list-group-item">
            <span className="text-muted small">Location:</span> {destination}
          </li>
          <li className="list-group-item">
            <span className="text-muted small">Duration:</span> {duration}
          </li>
          <li className="list-group-item">
            <span className="text-muted small">Price:</span>
            <span className=""> ₹{price}</span>
          </li>
        </ul>

        <div className="card-body mt-auto p-3 card-actions">
          <Link
            to={`/packages/${id}`}
            className="btn btn-outline-primary btn-sm text-nowrap"
          >
            Details
          </Link>
          <Link
            to={`/packages/${id}`}
            className="btn btn-primary btn-sm text-nowrap"
          >
            Book Now
          </Link>
        </div>
      </div>
    </>
  );
};

export default Packagecard;
