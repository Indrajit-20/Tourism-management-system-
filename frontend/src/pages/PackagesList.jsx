import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Packagecard from "../components/Packagecard";

const PackagesList = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/packages");
        setPackages(res.data);
      } catch (err) {
        console.error("Error fetching packages", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  return (
    <>
      <Header />
      <div className="container my-5">
        <h2 className="text-center mb-4">Our Tour Packages</h2>
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="row">
            {packages.map((pkg) => (
              <div className="col-md-4 mb-4" key={pkg._id}>
                <Packagecard
                  id={pkg._id}
                  image_url={pkg.image_url}
                  package_name={pkg.package_name}
                  destination={pkg.destination}
                  price={pkg.price}
                  duration={pkg.duration}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default PackagesList;
