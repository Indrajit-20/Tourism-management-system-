import React from "react";
import "../css/loading-skeleton.css";

export const LoadingSkeleton = ({ count = 1, height = "200px" }) => {
  return (
    <div className="skeleton-wrapper">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="skeleton-card" style={{ minHeight: height }}>
          <div className="skeleton-image"></div>
          <div className="skeleton-title"></div>
          <div className="skeleton-text"></div>
          <div className="skeleton-text"></div>
          <div className="skeleton-button"></div>
        </div>
      ))}
    </div>
  );
};

export const LoadingSpinner = () => {
  return (
    <div className="spinner-container">
      <div className="spinner"></div>
      <p>Loading data...</p>
    </div>
  );
};

export const LoadingBar = () => {
  return <div className="loading-bar"></div>;
};

export default LoadingSkeleton;
