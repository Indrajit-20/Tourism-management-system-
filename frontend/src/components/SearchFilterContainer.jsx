import React from "react";
import "../css/searchFilterContainer.css";

const SearchFilterContainer = ({
  title,
  subtitle,
  resultText,
  onClear,
  clearDisabled = false,
  children,
}) => {
  return (
    <section className="sfc-wrap card shadow-sm mb-4">
      <div className="sfc-header">
        <div>
          <h5 className="sfc-title mb-0">{title}</h5>
          {subtitle ? <small className="sfc-subtitle">{subtitle}</small> : null}
        </div>

        {onClear ? (
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm sfc-clear-btn"
            onClick={onClear}
            disabled={clearDisabled}
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="sfc-body">{children}</div>

      {resultText ? <p className="sfc-result mb-0">{resultText}</p> : null}
    </section>
  );
};

export default SearchFilterContainer;
