import React from "react";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h4>Flyvedya Tourism</h4>
          <p>Your trusted travel partner.</p>
        </div>
        <div className="footer-section">
          <h4>Address</h4>
          <p>
            115, Rytham Plaza
            <br />
            Nr. Amar Jawan Circle
            <br />
            Nikol, Ahmedabad - 382350
            <br />
            Gujarat, India
          </p>
        </div>
        <div className="footer-section">
          <h4>Contact Us</h4>
          <p>
            <a href="tel:+919082963043">+91 9082963043</a>
          </p>
          <p>
            <a href="mailto:flyvedyatourism@gmail.com">
              flyvedyatourism@gmail.com
            </a>
          </p>
        </div>
        <div className="footer-section">
          <h4>Follow Us</h4>
          <p className="social-links">
            <a
              href="https://facebook.com/flyvedyatourism"
              target="_blank"
              rel="noreferrer"
            >
              📘 Facebook
            </a>
            <br />
            <a
              href="https://instagram.com/flyvedyatourism"
              target="_blank"
              rel="noreferrer"
            >
              📸 Instagram
            </a>
            <br />
            <a
              href="https://wa.me/919082963043"
              target="_blank"
              rel="noreferrer"
            >
              💬 WhatsApp: +91 9082963043
            </a>
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2024 Tourism Management System. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
