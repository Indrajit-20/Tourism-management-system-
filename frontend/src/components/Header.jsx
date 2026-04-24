import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import logo from "../assets/logo.jpg";

const Header = () => {
  const [user, setUser] = useState({ loggedIn: false, name: "" });
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const userAreaRef = useRef(null);
  const location = useLocation();

  const handleLogout = () => {
    // Clear from sessionStorage (per-tab storage)
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");

    // Also clear sessionStorage for backward compatibility
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");

    setUser({ loggedIn: false, name: "" });
    setDropdownOpen(false);
    window.location.href = "/login";
  };

  // Check for existing session on component mount
  useEffect(() => {
    const checkLogin = () => {
      const name = sessionStorage.getItem("username");
      if (name) {
        setUser({ loggedIn: true, name });
      }
    };

    checkLogin();

    // Listen for login events from other components
    const handleLoginEvent = (event) => {
      setUser({
        loggedIn: true,
        name: event.detail.username,
      });
    };

    window.addEventListener("userLogin", handleLoginEvent);

    return () => {
      window.removeEventListener("userLogin", handleLoginEvent);
    };
  }, []);

  // Close open menus when route changes.
  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  // Close user dropdown when clicking outside or pressing Escape.
  useEffect(() => {
    const onWindowClick = (event) => {
      if (!userAreaRef.current) return;
      if (!userAreaRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") setDropdownOpen(false);
    };

    window.addEventListener("click", onWindowClick);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("click", onWindowClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const navLinksClass = menuOpen ? "fh-nav-links open" : "fh-nav-links";

  return (
    <header className="main-header">
      <nav className="fh-navbar">
        <div className="container fh-container">
          <Link to="/" className="fh-brand">
            <img
              src={logo}
              alt="logo"
              className="site-logo"
              onError={(e) => (e.target.style.display = "none")}
            />
            <div>
              <div className="site-name">FlyVedya Tourism</div>
              <div className="site-tag">Travel made simple</div>
            </div>
          </Link>

          <button
            className="fh-mobile-toggle d-lg-none"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
          >
            ☰
          </button>

          <div className={navLinksClass}>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `fh-nav-link ${isActive ? "active" : ""}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/book-bus"
              className={({ isActive }) =>
                `fh-nav-link ${isActive ? "active" : ""}`
              }
            >
              Bus Tickets
            </NavLink>
            <NavLink
              to="/packages"
              className={({ isActive }) =>
                `fh-nav-link ${isActive ? "active" : ""}`
              }
            >
              Tour Packages
            </NavLink>

            {!user.loggedIn ? (
              <div className="fh-auth-actions">
                <Link to="/login" className="btn btn-outline-primary me-2">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Register
                </Link>
              </div>
            ) : (
              <div className="fh-user-area" ref={userAreaRef}>
                <button
                  className={`fh-user-trigger ${dropdownOpen ? "open" : ""}`}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-expanded={dropdownOpen}
                  aria-label="Open user menu"
                >
                  <div className="fh-avatar me-2">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="me-1">{user?.name || "User"}</span>
                  <span className="fh-user-caret">▾</span>
                </button>

                {dropdownOpen && (
                  <div className="fh-user-dropdown">
                    <Link
                      to="/profile"
                      className="fh-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Update Profile
                    </Link>
                    <Link
                      to="/my-bookings"
                      className="fh-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      My Bookings
                    </Link>
                    <Link
                      to="/my-invoices"
                      className="fh-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      My Invoices
                    </Link>
                    <Link
                      to="/cancellations"
                      className="fh-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Cancellations
                    </Link>
                    <button
                      className="fh-dropdown-item fh-dropdown-item-logout"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
