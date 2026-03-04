import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Packagecard from "../components/Packagecard";

const PackagesList = () => {
  const [packages, setPackages] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/packages");
        setPackages(res.data);

        // Fetch ratings for each package
        const ratingsData = {};
        for (const pkg of res.data) {
          try {
            const ratingRes = await axios.get(
              `http://localhost:4000/api/feedback/rating/package/${pkg._id}`
            );
            ratingsData[pkg._id] = ratingRes.data;
          } catch (err) {
            ratingsData[pkg._id] = { average_rating: 0, total_reviews: 0 };
          }
        }
        setRatings(ratingsData);
      } catch (err) {
        console.error("Error fetching packages", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const renderStars = (stars) => {
    return "⭐".repeat(Math.round(stars)) + "☆".repeat(5 - Math.round(stars));
  };

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
                  rating={ratings[pkg._id]?.average_rating || 0}
                  totalReviews={ratings[pkg._id]?.total_reviews || 0}
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
