import React, { useEffect, useState } from "react";
import axios from "axios";
import Packagecard from "../components/Packagecard";

const mapPackageScheduleToCard = (pkg, schedule) => ({
  cardId: schedule?._id,
  id: pkg?._id,
  scheduleId: schedule?._id,
  package_name: pkg?.package_name,
  source_city: pkg?.source_city || pkg?.start || pkg?.source,
  destination: pkg?.destination || pkg?.destination_city,
  start_date: schedule?.start_date,
  end_date: schedule?.end_date,
  image_urls: pkg?.image_urls,
  image_url: pkg?.image_url,
  price: schedule?.price ?? schedule?.price_per_person,
  duration: pkg?.duration,
  transport: schedule?.bus_id?.bus_type
    ? `${schedule.bus_id.bus_type}${schedule?.bus_id?.bus_name ? ` Bus` : ""}`
    : "-",
  seatBadgeText:
    Number(schedule?.available_seats) > 0
      ? `🔥 ${schedule.available_seats} Seats Left`
      : null,
});

const PackagesList = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const packageRes = await axios.get(
          "http://localhost:4000/api/packages",
        );
        const packageList = Array.isArray(packageRes.data)
          ? packageRes.data
          : [];
        const cards = [];

        for (const item of packageList) {
          try {
            const scheduleRes = await axios.get(
              `http://localhost:4000/api/tour-schedules/package/${item._id}/departures`,
            );
            const departures = Array.isArray(scheduleRes.data)
              ? scheduleRes.data
              : [];

            for (const dep of departures) {
              if (Number(dep?.available_seats || 0) > 0) {
                cards.push(mapPackageScheduleToCard(item, dep));
              }
            }
          } catch (scheduleError) {
            console.error(
              `Error loading schedules for package ${item._id}`,
              scheduleError,
            );
          }
        }

        cards.sort(
          (a, b) =>
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
        );
        setPackages(cards);
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
          {packages.map((packageData) => {
            return (
              <div className="col-md-4 mb-4" key={packageData.cardId}>
                <Packagecard
                  id={packageData.id}
                  scheduleId={packageData.scheduleId}
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
          {packages.length === 0 && (
            <div className="col-12">
              <div className="alert alert-info text-center mb-0">
                No scheduled tour packages are available right now.
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PackagesList;
