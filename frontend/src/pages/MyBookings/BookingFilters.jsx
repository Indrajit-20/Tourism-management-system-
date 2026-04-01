import React from "react";
import { STATUSES, STATUS_META, countFor } from "./bookingConfig";

const BookingFilters = ({
  bookings,
  mainTab,
  setMainTab,
  statusTab,
  setStatusTab,
  search,
  setSearch,
  resultCount,
}) => {
  const tabItems = [
    { key: "All", label: "All Bookings" },
    { key: "Bus", label: "Bus Bookings" },
    { key: "Tour", label: "Tour Bookings" },
  ];

  return (
    <>
      {/* Main booking type tabs */}
      <div className="fv-main-tabs">
        {tabItems.map((tab) => (
          <button
            key={tab.key}
            className={`fv-main-tab ${mainTab === tab.key ? "active" : ""}`}
            onClick={() => {
              setMainTab(tab.key);
              setStatusTab("All");
            }}
          >
            {tab.label}
            <span className="fv-tab-count">
              {countFor(bookings, tab.key, "All")}
            </span>
          </button>
        ))}
      </div>

      {/* Status pills */}
      <div className="fv-status-row">
        {STATUSES.map((status) => (
          <button
            key={status}
            className={`${STATUS_META[status].pillClass} ${statusTab === status ? "active" : ""}`}
            onClick={() => setStatusTab(status)}
          >
            {status}
            <span className="fv-tab-count">
              {countFor(bookings, mainTab, status)}
            </span>
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="fv-search-wrap">
        <span className="fv-search-icon">🔎</span>
        <input
          className="form-control fv-search-input"
          placeholder="Search by package name, booking ID, from or to city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="fv-search-clear" onClick={() => setSearch("")}>
            ×
          </button>
        )}
      </div>

      {/* Result summary */}
      <div className="fv-result-text">
        {resultCount} booking{resultCount !== 1 ? "s" : ""} found
        {mainTab !== "All" ? ` · ${mainTab}` : ""}
        {statusTab !== "All" ? ` · ${statusTab}` : ""}
      </div>
    </>
  );
};

export default BookingFilters;
