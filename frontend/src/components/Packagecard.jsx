import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../css/packagecard.css";

const API_BASE_URL = "http://localhost:4000";
const FALLBACK_IMAGE = "https://via.placeholder.com/800x500?text=Tour+Package";

function formatDisplayDate(value) {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getPackageImages(imageUrls, imageUrl) {
  if (Array.isArray(imageUrls) && imageUrls.length > 0) {
    return imageUrls.map((img) => `${API_BASE_URL}/uploads/${img}`);
  }

  if (imageUrl) {
    return [`${API_BASE_URL}/uploads/${imageUrl}`];
  }

  return [FALLBACK_IMAGE];
}

const Packagecard = ({
  id,
  package_name,
  source_city,
  destination,
  start_date,
  end_date,
  price,
  duration,
  transport,
  seatBadgeText,
  image_url,
  image_urls,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = getPackageImages(image_urls, image_url);
  const showSliderButtons = images.length > 1;
  const currentImage = images[currentIndex] || images[0] || FALLBACK_IMAGE;

  const showPreviousImage = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const showNextImage = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <article className="pkg-card h-100">
      <div className="pkg-image-wrap">
        <img src={currentImage} className="pkg-image" alt={package_name} />
        <div className="pkg-image-fade" />

        <div className="pkg-count-pill">
          {currentIndex + 1}/{images.length}
        </div>

        {seatBadgeText && <div className="pkg-seat-pill">{seatBadgeText}</div>}

        {showSliderButtons && (
          <>
            <button
              type="button"
              className="pkg-nav pkg-nav-left"
              onClick={showPreviousImage}
              aria-label="Previous image"
            >
              &#10094;
            </button>
            <button
              type="button"
              className="pkg-nav pkg-nav-right"
              onClick={showNextImage}
              aria-label="Next image"
            >
              &#10095;
            </button>
          </>
        )}

        {images.length > 1 && (
          <div className="pkg-dots">
            {images.map((_, index) => (
              <button
                key={`dot-${index}`}
                type="button"
                className={`pkg-dot ${index === currentIndex ? "active" : ""}`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Show image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="pkg-body">
        <h5 className="pkg-title">{package_name || "Tour Package"}</h5>

        <div className="pkg-route">
          <span className="pkg-source">{source_city || "-"}</span>
          <span className="pkg-arrow">&#10230;</span>
          <span className="pkg-destination">{destination || "-"}</span>
        </div>

        <div className="pkg-grid">
          <div className="pkg-cell">
            <small>Start</small>
            <strong>{formatDisplayDate(start_date)}</strong>
          </div>
          <div className="pkg-cell">
            <small>End</small>
            <strong>{formatDisplayDate(end_date)}</strong>
          </div>
          <div className="pkg-cell">
            <small>Duration</small>
            <strong>{duration || "-"}</strong>
          </div>
          <div className="pkg-cell">
            <small>Transport</small>
            <strong>{transport || "-"}</strong>
          </div>
        </div>
      </div>

      <div className="pkg-footer">
        <div className="pkg-price-block">
          <small>Per Person</small>
          <strong className="pkg-price">
            {price ? `Rs. ${price}` : "Select schedule"}
          </strong>
        </div>

        <div className="pkg-actions">
          <Link
            to={`/package-details/${id}`}
            className="btn btn-outline-primary btn-sm"
          >
            View Details
          </Link>
          <Link
            to={`/packages/${id}/select-seats`}
            className="btn btn-primary btn-sm"
          >
            Book Now
          </Link>
        </div>
      </div>
    </article>
  );
};

export default Packagecard;
