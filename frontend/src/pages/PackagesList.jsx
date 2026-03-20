import React, { useEffect, useState } from "react";
import axios from "axios";
import Packagecard from "../components/Packagecard";

const mapPackageFromDb = (pkg) => ({
  id: pkg?._id,
  package_name: pkg?.package_name,
  source_city: pkg?.source_city || pkg?.start || pkg?.source,
  destination: pkg?.destination || pkg?.destination_city,
  start_date: pkg?.start_date,
  end_date: pkg?.end_date,
  image_urls: pkg?.image_urls,
  image_url: pkg?.image_url,
  price: pkg?.price,
  duration: pkg?.duration,
  transport: pkg?.bus_id?.bus_type
    ? `${pkg.bus_id.bus_type}${pkg?.bus_id?.bus_name ? ` Bus` : ""}`
    : "-",
  seatBadgeText: pkg?.bus_id?.total_seats
    ? `🔥 ${pkg.bus_id.total_seats} Seats`
    : null,
});

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

  if (loading) {
    return <div>Loading packages...</div>;
  }

  return (
    <>
      <div className="container mt-5">
        <h2 className="text-center mb-4">Tour Packages</h2>
        <div className="row">
          {packages.map((pkg) => {
            const packageData = mapPackageFromDb(pkg);
            return (
              <div className="col-md-4 mb-4" key={pkg._id}>
                <Packagecard
                  id={packageData.id}
                  source_city={packageData.source_city}
                  destination={packageData.destination}
                  start_date={packageData.start_date}
                  end_date={packageData.end_date}
                  image_urls={packageData.image_urls}
                  image_url={packageData.image_url}
                  package_name={packageData.package_name}
                  price={packageData.price}
                  duration={packageData.duration}
                  transport={packageData.transport}
                  seatBadgeText={packageData.seatBadgeText}
                />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default PackagesList;
