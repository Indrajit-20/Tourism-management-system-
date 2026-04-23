import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Packagecard from "../components/Packagecard";
import SearchFilterContainer from "../components/SearchFilterContainer";
import "../css/homepage.css";

const mapPackageScheduleToCard = (pkg, schedule) => ({
  cardId: schedule?._id,
  id: pkg?._id,
  scheduleId: schedule?._id,
  package_name: pkg?.package_name,
  package_type: pkg?.package_type || "Other Tours",
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
  const [searchText, setSearchText] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const packageTrackRefs = useRef({});

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const packageRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/packages`,
        );
        const packageList = Array.isArray(packageRes.data)
          ? packageRes.data
          : [];
        const cards = [];

        for (const item of packageList) {
          try {
            const scheduleRes = await axios.get(
              `${import.meta.env.VITE_API_URL}/tour-schedules/package/${item._id}/departures`,
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

  const destinationOptions = useMemo(() => {
    const values = new Set(
      packages
        .map((item) => String(item.destination || "").trim())
        .filter(Boolean),
    );
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [packages]);

  const typeOptions = useMemo(() => {
    const values = new Set(
      packages
        .map((item) => String(item.package_type || "").trim())
        .filter(Boolean),
    );
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [packages]);

  const filteredPackages = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return packages.filter((item) => {
      const packageName = String(item.package_name || "").toLowerCase();
      const destination = String(item.destination || "").toLowerCase();

      const matchesQuery =
        !q || packageName.includes(q) || destination.includes(q);

      const matchesDestination =
        !destinationFilter ||
        String(item.destination || "").toLowerCase() ===
          destinationFilter.toLowerCase();

      const matchesType =
        !typeFilter ||
        String(item.package_type || "").toLowerCase() ===
          typeFilter.toLowerCase();

      return matchesQuery && matchesDestination && matchesType;
    });
  }, [packages, searchText, destinationFilter, typeFilter]);

  const groupedPackages = useMemo(() => {
    const grouped = {};

    for (const item of filteredPackages) {
      const typeKey =
        String(item.package_type || "Other Tours").trim() || "Other Tours";
      if (!grouped[typeKey]) grouped[typeKey] = [];
      grouped[typeKey].push(item);
    }

    const typeGroups = Object.entries(grouped).map(([typeKey, items]) => ({
      key: typeKey,
      title: typeKey,
      items,
    }));

    const pairedGroups = [];
    for (let index = 0; index < typeGroups.length; index += 2) {
      const first = typeGroups[index];
      const second = typeGroups[index + 1];

      if (!second) {
        pairedGroups.push(first);
        continue;
      }

      pairedGroups.push({
        key: `${first.key}__${second.key}`,
        title: `${first.title} + ${second.title}`,
        items: [...first.items, ...second.items],
      });
    }

    return pairedGroups;
  }, [filteredPackages]);

  const scrollPackageGroup = (groupKey, direction) => {
    const track = packageTrackRefs.current[groupKey];
    if (!track) return;

    const scrollAmount = Math.max(track.clientWidth * 0.85, 260);
    track.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const clearFilters = () => {
    setSearchText("");
    setDestinationFilter("");
    setTypeFilter("");
  };

  if (loading) {
    return <div>Loading packages...</div>;
  }

  return (
    <>
      <div className="container mt-5">
        <h2 className="text-center mb-4">Tour Packages</h2>

        <SearchFilterContainer
          title="Search Tour Packages"
          subtitle="Find packages by name, destination, or type"
          resultText={`Showing ${filteredPackages.length} of ${packages.length} packages`}
          onClear={clearFilters}
          clearDisabled={!searchText && !destinationFilter && !typeFilter}
        >
          <div className="row g-2">
            <div className="col-md-5">
              <input
                type="text"
                className="form-control sfc-input"
                placeholder="Search package or destination"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <select
                className="form-select sfc-select"
                value={destinationFilter}
                onChange={(e) => setDestinationFilter(e.target.value)}
              >
                <option value="">All Destinations</option>
                {destinationOptions.map((destination) => (
                  <option key={destination} value={destination}>
                    {destination}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select sfc-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </SearchFilterContainer>

        {filteredPackages.length === 0 ? (
          <div className="alert alert-info text-center mb-0">
            No tour packages match your search/filter.
          </div>
        ) : (
          <div className="hp-package-groups">
            {groupedPackages.map((group) => (
              <section className="hp-package-group" key={group.key}>
                <div className="hp-package-group-header">
                  <h5 className="mb-0">{group.title}</h5>
                  <span className="text-muted small">
                    {group.items.length} package
                    {group.items.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="hp-package-track-shell">
                  <button
                    type="button"
                    className="hp-track-arrow hp-track-arrow-left"
                    aria-label={`Scroll ${group.title} left`}
                    onClick={() => scrollPackageGroup(group.key, "left")}
                  >
                    &#10094;
                  </button>

                  <div
                    className="hp-package-track"
                    ref={(element) => {
                      packageTrackRefs.current[group.key] = element;
                    }}
                  >
                    {group.items.map((packageData) => (
                      <div
                        className="hp-package-slide"
                        key={packageData.cardId}
                      >
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
                    ))}
                  </div>

                  <button
                    type="button"
                    className="hp-track-arrow hp-track-arrow-right"
                    aria-label={`Scroll ${group.title} right`}
                    onClick={() => scrollPackageGroup(group.key, "right")}
                  >
                    &#10095;
                  </button>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default PackagesList;
