import React, { useEffect, useState } from "react";
import axios from "axios";
import "../css/managePackage.css";

const apiBase = "http://localhost:4000";
const MAX_HOTELS_PER_PACKAGE = 6;

const initialFormState = {
  package_name: "",
  package_type: "",
  source_city: "Ahmedabad",
  destination: "",
  duration: "",
  description: "",
  tour_guide: "",
  sightseeing: "",
  itinerary: "",
  inclusive: "",
  exclusive: "",
  status: "Active",
};

const PackageManagment = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);
  const [searchText, setSearchText] = useState("");

  const [packages, setPackages] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [hotelsList, setHotelsList] = useState([]);

  const [selectedHotels, setSelectedHotels] = useState([""]);
  const [boardingPoint, setBoardingPoint] = useState("");
  const [imageInputs, setImageInputs] = useState([null]);

  const token = localStorage.getItem("token");

  const fetchData = async () => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const pkgRes = await axios.get(`${apiBase}/api/packages`);
      setPackages(pkgRes.data || []);
    } catch (error) {
      console.error("Unable to load packages", error);
      setPackages([]);
    }

    try {
      const staffRes = await axios.get(`${apiBase}/api/staff`, { headers });
      setStaffList(staffRes.data || []);
    } catch (error) {
      console.error("Unable to load staff list for guide dropdown", error);
      setStaffList([]);
    }

    try {
      const hotelRes = await axios.get(`${apiBase}/api/hotels`);
      setHotelsList(hotelRes.data || []);
    } catch (error) {
      console.error("Unable to load hotels list", error);
      setHotelsList([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const splitCsv = (text) =>
    (text || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const cleanStringArray = (arr) =>
    arr.map((v) => (v || "").trim()).filter(Boolean);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addImageInput = () => {
    if (imageInputs.length >= 6) {
      alert("Maximum 6 images allowed.");
      return;
    }
    setImageInputs((prev) => [...prev, null]);
  };

  const removeImageInput = (index) => {
    setImageInputs((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateImageInput = (index, file) => {
    setImageInputs((prev) =>
      prev.map((item, i) => (i === index ? file : item)),
    );
  };

  const addHotelSelect = () => {
    setSelectedHotels((prev) => {
      if (prev.length >= MAX_HOTELS_PER_PACKAGE) {
        alert(`Maximum ${MAX_HOTELS_PER_PACKAGE} hotels allowed per package.`);
        return prev;
      }
      return [...prev, ""];
    });
  };
  const removeHotelSelect = (index) => {
    setSelectedHotels((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };
  const updateHotelSelect = (index, value) => {
    setSelectedHotels((prev) =>
      prev.map((item, i) => (i === index ? value : item)),
    );
  };

  const resetPackageForm = () => {
    setFormData(initialFormState);
    setSelectedHotels([""]);
    setBoardingPoint("");
    setImageInputs([null]);
    setEditingId(null);
  };

  const handleSubmitPackage = async (e) => {
    e.preventDefault();

    try {
      if (!token) {
        alert("Admin token missing. Login again.");
        return;
      }

      const payload = new FormData();

      payload.append("package_name", formData.package_name);
      payload.append("package_type", formData.package_type);
      payload.append("source_city", formData.source_city || "Ahmedabad");
      payload.append("destination", formData.destination);
      payload.append("duration", formData.duration);
      payload.append("description", formData.description);
      payload.append("tour_guide", formData.tour_guide);
      payload.append("inclusive", formData.inclusive);
      payload.append("exclusive", formData.exclusive);
      payload.append("status", formData.status);
      payload.append("itinerary", formData.itinerary);
      payload.append(
        "sightseeing",
        JSON.stringify(splitCsv(formData.sightseeing)),
      );

      const hotelsPayload = cleanStringArray(selectedHotels);
      if (hotelsPayload.length > MAX_HOTELS_PER_PACKAGE) {
        alert(`You can select maximum ${MAX_HOTELS_PER_PACKAGE} hotels.`);
        return;
      }
      payload.append("hotels", JSON.stringify(hotelsPayload));

      const pointsPayload = boardingPoint.trim() ? [boardingPoint.trim()] : [];
      payload.append("boarding_points", JSON.stringify(pointsPayload));
      payload.append("pickup_points", JSON.stringify(pointsPayload));

      imageInputs.forEach((file) => {
        if (file) payload.append("images", file);
      });

      const headers = { Authorization: `Bearer ${token}` };

      if (editingId) {
        await axios.put(
          `${apiBase}/api/packages/update/${editingId}`,
          payload,
          { headers },
        );
        alert("Package updated successfully");
      } else {
        await axios.post(`${apiBase}/api/packages/add`, payload, { headers });
        alert("Package added successfully");
      }

      resetPackageForm();
      fetchData();
    } catch (error) {
      console.error("Save package failed", error);
      alert(error?.response?.data?.message || "Failed to save package");
    }
  };

  const handleEdit = (pkg) => {
    setEditingId(pkg._id);

    setFormData({
      ...initialFormState,
      package_name: pkg.package_name || "",
      package_type: pkg.package_type || "",
      source_city: pkg.source_city || "Ahmedabad",
      destination: pkg.destination || "",
      duration: pkg.duration || "",
      description: pkg.description || "",
      tour_guide:
        typeof pkg.tour_guide === "object"
          ? pkg.tour_guide?._id
          : pkg.tour_guide || "",
      inclusive: pkg.inclusive || "",
      exclusive: pkg.exclusive || "",
      sightseeing: (pkg.sightseeing || []).join(", "),
      itinerary: pkg.itinerary || "",
      status: pkg.status || "Active",
    });

    const hotels = (pkg.hotels || []).map((h) =>
      typeof h === "object" ? h._id : h,
    );
    setSelectedHotels(hotels.length ? hotels : [""]);

    const points = pkg.boarding_points?.length
      ? pkg.boarding_points
      : pkg.pickup_points?.length
        ? pkg.pickup_points
        : [""];
    setBoardingPoint(points[0] || "");

    setImageInputs([null]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this package?")) return;

    try {
      await axios.delete(`${apiBase}/api/packages/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (error) {
      console.error("Delete package failed", error);
      alert("Delete failed");
    }
  };

  const guides = staffList.filter(
    (staff) => (staff.designation || "").toLowerCase() === "guide",
  );

  const getHotelOptionLabel = (hotel) => {
    const cityName = hotel?.city_id?.city_name || "";
    const stateName = hotel?.state_id?.state_name || "";
    const locationName = hotel?.location || "";
    const placeText = [locationName, cityName, stateName]
      .filter(Boolean)
      .join(", ");
    return placeText ? `${hotel.name} (${placeText})` : hotel.name;
  };

  const selectedImageCount = imageInputs.filter(Boolean).length;
  const normalizedSearch = searchText.trim().toLowerCase();
  const filteredPackages = packages.filter((pkg) => {
    if (!normalizedSearch) return true;
    const name = String(pkg.package_name || "").toLowerCase();
    const destination = String(pkg.destination || "").toLowerCase();
    const type = String(pkg.package_type || "").toLowerCase();
    return (
      name.includes(normalizedSearch) ||
      destination.includes(normalizedSearch) ||
      type.includes(normalizedSearch)
    );
  });

  return (
    <div className="container mt-4 mb-5 manage-package-page">
      <div className="card shadow-sm p-4 mb-4 manage-package-card">
        <h4 className="mb-3">
          {editingId ? "Edit Tour Package" : "Add Tour Package"}
        </h4>

        <form onSubmit={handleSubmitPackage}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Package Name</label>
              <input
                type="text"
                name="package_name"
                className="form-control"
                value={formData.package_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Type</label>
              <input
                type="text"
                name="package_type"
                className="form-control"
                value={formData.package_type}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">
                Start City (default Ahmedabad)
              </label>
              <input
                type="text"
                name="source_city"
                className="form-control"
                value={formData.source_city}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Destination</label>
              <input
                type="text"
                name="destination"
                className="form-control"
                value={formData.destination}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Duration</label>
              <input
                type="text"
                name="duration"
                className="form-control"
                value={formData.duration}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Tour Guide (from Staff list)</label>
              <select
                name="tour_guide"
                className="form-select"
                value={formData.tour_guide}
                onChange={handleChange}
              >
                <option value="">Select Guide</option>
                {guides.map((guide) => (
                  <option key={guide._id} value={guide._id}>
                    {guide.name} ({guide.designation})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">
                Hotels (one or more, max {MAX_HOTELS_PER_PACKAGE})
              </label>
              {selectedHotels.map((hotelId, index) => (
                <div className="d-flex gap-2 mb-2" key={`hotel-${index}`}>
                  <select
                    className="form-select"
                    value={hotelId}
                    onChange={(e) => updateHotelSelect(index, e.target.value)}
                  >
                    <option value="">Select Hotel</option>
                    {hotelsList.map((hotel) => (
                      <option key={hotel._id} value={hotel._id}>
                        {getHotelOptionLabel(hotel)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={addHotelSelect}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => removeHotelSelect(index)}
                  >
                    -
                  </button>
                </div>
              ))}
            </div>

            <div className="col-md-6">
              <label className="form-label">Pick-up / Boarding Point</label>
              <input
                type="text"
                className="form-control"
                value={boardingPoint}
                onChange={(e) => setBoardingPoint(e.target.value)}
                placeholder="Example: Navrangpura Circle"
              />
            </div>

            <div className="col-12">
              <label className="form-label">Itinerary</label>
              <textarea
                name="itinerary"
                className="form-control"
                value={formData.itinerary}
                onChange={handleChange}
                rows={5}
              />
            </div>

            <div className="col-12">
              <label className="form-label">
                Sightseeing (comma separated)
              </label>
              <input
                type="text"
                name="sightseeing"
                className="form-control"
                value={formData.sightseeing}
                onChange={handleChange}
                placeholder="Fort, Museum, Beach"
              />
            </div>

            <div className="col-12">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                className="form-control"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="col-12">
              <label className="form-label">Images (max 6, use +)</label>
              {imageInputs.map((file, index) => (
                <div className="d-flex gap-2 mb-2" key={`img-${index}`}>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={(e) =>
                      updateImageInput(index, e.target.files?.[0] || null)
                    }
                  />
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={addImageInput}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => removeImageInput(index)}
                  >
                    -
                  </button>
                </div>
              ))}
              <small className="text-muted">
                {selectedImageCount} image(s) selected
              </small>
            </div>

            <div className="col-md-4">
              <label className="form-label">Inclusive</label>
              <input
                type="text"
                name="inclusive"
                className="form-control"
                value={formData.inclusive}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Exclusive</label>
              <input
                type="text"
                name="exclusive"
                className="form-control"
                value={formData.exclusive}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-2">
              <label className="form-label">Status</label>
              <select
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="col-12 mt-2 d-flex gap-2">
              <button type="submit" className="btn btn-primary w-100">
                {editingId ? "Update Package" : "Save Package"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetPackageForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      <div className="card shadow-sm p-4 manage-package-card">
        <h4 className="mb-3">All Packages</h4>

        <div className="row g-3 align-items-end mb-3">
          <div className="col-md-8">
            <label className="form-label">Search Packages</label>
            <input
              type="text"
              className="form-control"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by package name, destination, or type"
            />
          </div>
          <div className="col-md-4">
            <div className="manage-package-total-item">
              <span>Total Tour Packages</span>
              <strong>{packages.length}</strong>
            </div>
          </div>
        </div>

        <div className="table-responsive manage-package-table-wrap">
          <table className="table table-bordered table-striped align-middle manage-package-table">
            <thead className="table-dark">
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Type</th>
                <th>Destination</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Hotels</th>
                <th>Pick-up Points</th>
                <th>Manage</th>
              </tr>
            </thead>
            <tbody>
              {filteredPackages.map((pkg) => {
                const firstImage = (pkg.image_urls || [])[0];

                return (
                  <tr key={pkg._id}>
                    <td>
                      {firstImage ? (
                        <img
                          src={`${apiBase}/uploads/${firstImage}`}
                          alt={pkg.package_name}
                          style={{
                            width: "64px",
                            height: "64px",
                            objectFit: "cover",
                            borderRadius: "8px",
                          }}
                        />
                      ) : (
                        <span className="text-muted small">No image</span>
                      )}
                    </td>
                    <td>
                      <div className="fw-semibold">{pkg.package_name}</div>
                      <div
                        className="text-muted small text-truncate"
                        style={{ maxWidth: "220px" }}
                      >
                        {pkg.description || "-"}
                      </div>
                    </td>
                    <td>{pkg.package_type || "-"}</td>
                    <td>
                      <div className="fw-semibold">
                        {pkg.destination || "-"}
                      </div>
                    </td>
                    <td>{pkg.duration || "-"}</td>
                    <td>
                      <div className="d-flex flex-column gap-1">
                        <span
                          className={`badge ${
                            pkg.status === "Active"
                              ? "bg-success-subtle text-success"
                              : "bg-secondary-subtle text-secondary"
                          }`}
                        >
                          {pkg.status || "Active"}
                        </span>
                      </div>
                    </td>
                    <td>
                      {Array.isArray(pkg.hotels) && pkg.hotels.length
                        ? pkg.hotels.length
                        : 0}
                    </td>
                    <td>
                      {Array.isArray(pkg.boarding_points) &&
                      pkg.boarding_points.length
                        ? pkg.boarding_points.join(", ")
                        : "-"}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          type="button"
                          onClick={() => handleEdit(pkg)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          type="button"
                          onClick={() => handleDelete(pkg._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredPackages.length === 0 && (
                <tr>
                  <td colSpan="12" className="text-center text-muted py-4">
                    No packages match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PackageManagment;
