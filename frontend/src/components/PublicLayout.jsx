import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

const PublicLayout = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Instant scroll to top on navigation to prevent blank screen gaps
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <main className="flex-grow-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
