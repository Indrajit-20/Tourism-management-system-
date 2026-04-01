import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import PaymentNotification from "./PaymentNotification"; // ← ADD line 1

const PublicLayout = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Instant scroll to top on navigation to prevent blank screen gaps
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="visitor-theme d-flex flex-column min-vh-100">
      <Header />
      <PaymentNotification /> {/* ← ADD line 2 */}
      <main className="visitor-main flex-grow-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
