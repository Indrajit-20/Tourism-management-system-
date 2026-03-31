import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import axios from "axios";
import ReviewsDisplay from "../components/ReviewsDisplay";
import TourDepartureSelector from "../components/TourDepartureSelector";
import "../css/packageDetails.css";

const API_BASE_URL = "http://localhost:4000";

const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const parseMultiValue = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);

  const text = String(value).split("\r").join("").split("\n").join(",");

  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const toImageUrl = (value) => {
  if (!value) return "https://via.placeholder.com/1200x700?text=Tour+Package";

  const lowerValue = String(value).toLowerCase();
  if (lowerValue.startsWith("http://") || lowerValue.startsWith("https://")) {
    return value;
  }

  return `${API_BASE_URL}/uploads/${value}`;
};

const PackageDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const scheduleIdFromQuery = new URLSearchParams(location.search).get(
    "schedule",
  );
  const [packageData, setPackageData] = useState(null);
  const [activeTab, setActiveTab] = useState("itinerary");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedDeparture, setSelectedDeparture] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/api/packages/${id}`);
        setPackageData(res.data);
      } catch (err) {
        console.error("Error fetching package details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPackage();
  }, [id]);

  const imageList = useMemo(() => {
    if (!packageData) return [];
    if (
      Array.isArray(packageData.image_urls) &&
      packageData.image_urls.length
    ) {
      return packageData.image_urls.map((img) => toImageUrl(img));
    }
    if (packageData.image_url) return [toImageUrl(packageData.image_url)];
    return [toImageUrl(null)];
  }, [packageData]);

  const itineraryItems = useMemo(() => {
    if (!packageData?.itinerary) return [];
    if (Array.isArray(packageData.itinerary))
      return packageData.itinerary.filter(Boolean);
    return String(packageData.itinerary)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }, [packageData]);

  const sightseeingItems = useMemo(
    () => parseMultiValue(packageData?.sightseeing),
    [packageData],
  );

  const inclusionItems = useMemo(
    () => parseMultiValue(packageData?.inclusive),
    [packageData],
  );

  const exclusionItems = useMemo(
    () => parseMultiValue(packageData?.exclusive),
    [packageData],
  );

  const transportText = useMemo(() => {
    const busType = selectedDeparture?.bus_id?.bus_type;
    const busName = selectedDeparture?.bus_id?.bus_name;
    if (busType && busName) return `${busType} (${busName})`;
    if (busType) return busType;
    return "-";
  }, [selectedDeparture]);

  const availableSeats = useMemo(() => {
    if (typeof selectedDeparture?.available_seats === "number") {
      return selectedDeparture.available_seats;
    }

    const totalSeats = Number(selectedDeparture?.total_seats) || 0;
    const bookedTravellers =
      totalSeats - (Number(selectedDeparture?.available_seats) || 0);
    if (!totalSeats) return "-";
    return Math.max(totalSeats - bookedTravellers, 0);
  }, [selectedDeparture]);

  if (loading) return <h3 className="text-center mt-5">Loading...</h3>;
  if (!packageData)
    return <h3 className="text-center mt-5">Package not found.</h3>;

  const selectedImage = imageList[selectedImageIndex] || imageList[0];
  const hotels = Array.isArray(packageData.hotels) ? packageData.hotels : [];

  const tabs = [
    { key: "itinerary", label: "Itinerary" },
    { key: "sightseeing", label: "Sightseeing" },
    { key: "inclusions", label: "Inclusions" },
    { key: "hotels", label: "Hotels" },
    { key: "reviews", label: "Reviews" },
  ];

  const renderTabContent = () => {
    if (activeTab === "itinerary") {
      if (!itineraryItems.length) {
        return <p className="pd-empty">No itinerary available.</p>;
      }

      return (
        <div className="pd-list">
          {itineraryItems.map((item, index) => (
            <div key={`iti-${index}`} className="pd-list-item">
              <span className="pd-list-index">Day {index + 1}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === "sightseeing") {
      if (!sightseeingItems.length) {
        return <p className="pd-empty">No sightseeing data available.</p>;
      }

      return (
        <div className="pd-chip-grid">
          {sightseeingItems.map((item, index) => (
            <span key={`sight-${index}`} className="pd-chip">
              {item}
            </span>
          ))}
        </div>
      );
    }

    if (activeTab === "inclusions") {
      return (
        <div className="pd-two-column">
          <div className="pd-panel">
            <h6>Included</h6>
            {inclusionItems.length ? (
              <ul>
                {inclusionItems.map((item, index) => (
                  <li key={`inc-${index}`}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="pd-empty">No inclusions specified.</p>
            )}
          </div>

          <div className="pd-panel pd-panel-danger">
            <h6>Not Included</h6>
            {exclusionItems.length ? (
              <ul>
                {exclusionItems.map((item, index) => (
                  <li key={`exc-${index}`}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="pd-empty">No exclusions specified.</p>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === "hotels") {
      if (!hotels.length) {
        return <p className="pd-empty">No hotels attached to this package.</p>;
      }

      return (
        <div className="pd-list">
          {hotels.map((hotel) => (
            <div key={hotel._id || hotel.name} className="pd-hotel-card">
              <div>
                <h6>{hotel.name || "Hotel"}</h6>
                <p>{hotel.location || "Location not available"}</p>
              </div>
              <span className="pd-hotel-type">
                {hotel.hotel_type || "Stay"}
              </span>
            </div>
          ))}
        </div>
      );
    }

    return <ReviewsDisplay packageId={id} type="package" />;
  };

  return (
    <div className="pd-page">
      <div className="container py-4">
        <div className="pd-breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/packages">Tour Packages</Link>
          <span>/</span>
          <strong>{packageData.package_name}</strong>
        </div>

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="pd-card pd-gallery-card mb-4">
              <div className="pd-image-stage">
                <img
                  src={selectedImage}
                  alt={packageData.package_name}
                  className="pd-main-image"
                />

                {imageList.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="pd-image-nav pd-image-nav-left"
                      onClick={() =>
                        setSelectedImageIndex((prev) =>
                          prev === 0 ? imageList.length - 1 : prev - 1,
                        )
                      }
                    >
                      {"<"}
                    </button>
                    <button
                      type="button"
                      className="pd-image-nav pd-image-nav-right"
                      onClick={() =>
                        setSelectedImageIndex((prev) =>
                          prev === imageList.length - 1 ? 0 : prev + 1,
                        )
                      }
                    >
                      {">"}
                    </button>
                  </>
                )}

                <div className="pd-image-counter">
                  {selectedImageIndex + 1} / {imageList.length}
                </div>
              </div>

              <div className="pd-thumbs">
                {imageList.map((img, index) => (
                  <img
                    key={`img-${index}`}
                    src={img}
                    alt={`${packageData.package_name}-${index + 1}`}
                    className={`pd-thumb ${selectedImageIndex === index ? "active" : ""}`}
                    onClick={() => setSelectedImageIndex(index)}
                  />
                ))}
              </div>
            </div>

            <div className="pd-card mb-4">
              <div className="pd-body">
                <div className="pd-title-row">
                  <h1>{packageData.package_name}</h1>
                  <span className="pd-type-badge">
                    {packageData.package_type || "Tour"}
                  </span>
                </div>

                <p className="pd-route">
                  <strong>{packageData.source_city || "-"}</strong>
                  <span>{" -> "}</span>
                  <strong>{packageData.destination || "-"}</strong>
                </p>

                <p className="pd-description">
                  {packageData.description ||
                    "No description available for this package."}
                </p>

                <div className="row g-2">
                  <div className="col-6 col-md-3">
                    <div className="pd-info-box">
                      <small>Schedule Start</small>
                      <strong>
                        {formatDate(selectedDeparture?.start_date)}
                      </strong>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="pd-info-box">
                      <small>Schedule End</small>
                      <strong>{formatDate(selectedDeparture?.end_date)}</strong>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="pd-info-box">
                      <small>Duration</small>
                      <strong>{packageData.duration || "-"}</strong>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="pd-info-box">
                      <small>Transport</small>
                      <strong>{transportText}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pd-card">
              <div className="pd-tab-row">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`pd-tab-btn ${activeTab === tab.key ? "active" : ""}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="pd-tab-content">{renderTabContent()}</div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="pd-sticky">
              <div className="pd-card pd-side-card">
                <div className="pd-price-wrap">
                  <small>Per Person</small>
                  {selectedDeparture ? (
                    <h2 className="pd-price-amount">
                      Rs.{" "}
                      {selectedDeparture?.price ??
                        selectedDeparture?.price_per_person}
                    </h2>
                  ) : (
                    <h2>Rs. Select schedule</h2>
                  )}
                </div>

                <div className="pd-divider" />

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <div className="pd-mini-info">
                      <small>Schedule Status</small>
                      <strong>
                        {selectedDeparture?.departure_status || "Not selected"}
                      </strong>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="pd-mini-info">
                      <small>Available Seats</small>
                      <strong>{availableSeats}</strong>
                    </div>
                  </div>
                </div>

                <div className="pd-mini-info mb-3">
                  <small>Boarding Points</small>
                  <strong>
                    {parseMultiValue(packageData.boarding_points)
                      .slice(0, 2)
                      .join(", ") || "-"}
                  </strong>
                </div>

                <div className="mb-3">
                  <TourDepartureSelector
                    packageId={id}
                    initialSelectedId={scheduleIdFromQuery}
                    onSelect={(dep) => setSelectedDeparture(dep)}
                  />
                </div>

                <div className="d-grid gap-2">
                  <button
                    className={`btn btn-lg ${
                      selectedDeparture
                        ? "btn-primary"
                        : "btn-secondary disabled"
                    }`}
                    disabled={!selectedDeparture}
                    onClick={() => {
                      if (selectedDeparture) {
                        navigate(
                          `/packages/${id}/select-seats?schedule=${selectedDeparture._id}`,
                          {
                            state: { selectedDeparture },
                          },
                        );
                      } else {
                        alert("Please select a schedule first");
                      }
                    }}
                  >
                    {selectedDeparture
                      ? "✓ Proceed to Seat Selection"
                      : "📅 Select Schedule First"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-lg"
                    onClick={() => navigate(-1)}
                  >
                    Back
                  </button>
                </div>
              </div>

              <div className="pd-help-card">
                <h6>Need help with booking?</h6>
                <p>Our support team is available to help you plan your tour.</p>
                <a href="tel:+911234567890" className="btn btn-light w-100">
                  Call Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageDetails;
