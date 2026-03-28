import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Header = () => {
  const [user, setUser] = useState({ loggedIn: false, name: "" });
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUser({ loggedIn: false, name: "" });
    setDropdownOpen(false);
    window.location.href = "/login";
  };

  useEffect(() => {
    const name = localStorage.getItem("username");
    if (name) setUser({ loggedIn: true, name });
  }, []);

  const navLinksClass = menuOpen ? "nav-links open" : "nav-links";

  return (
    <header>
      <nav className="navbar bg-white shadow-sm">
        <div className="container d-flex align-items-center justify-content-between">
          <Link
            to="/"
            className="d-flex align-items-center text-decoration-none"
          >
            <img
              src="/src/assets/logo.jpg"
              alt="logo"
              className="me-2 site-logo"
              onError={(e) => (e.target.style.display = "none")}
            />
            <div>
              <div className="site-name">FlyVedya Tourism</div>
              <div className="site-tag">Travel made simple</div>
            </div>
          </Link>

          <button
            className="btn btn-light d-lg-none"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>

          <div className={navLinksClass}>
            <Link to="/" className="me-3 nav-link active">
              Home
            </Link>
            <Link to="/book-bus" className="me-3 nav-link">
              Bus Tickets
            </Link>
            <Link to="/packages" className="me-3 nav-link">
              Tour Packages
            </Link>

            {!user.loggedIn ? (
              <div className="d-flex align-items-center">
                <Link to="/login" className="btn btn-outline-primary me-2">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Register
                </Link>
              </div>
            ) : (
              <div className="user-area">
                <button
                  className="btn btn-light d-flex align-items-center"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <div className="avatar me-2">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="me-2">{user?.name || "User"}</span>▾
                </button>

                {dropdownOpen && (
                  <div className="user-dropdown shadow-sm">
                    <Link to="/profile" className="dropdown-item">
                      Update Profile
                    </Link>
                    <Link to="/my-bookings" className="dropdown-item">
                      My Bookings
                    </Link>
                    <Link to="/my-invoices" className="dropdown-item">
                      My Invoices
                    </Link>
                    <Link to="/cancellations" className="dropdown-item">
                      Cancellations
                    </Link>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item" onClick={handleLogout}>
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
