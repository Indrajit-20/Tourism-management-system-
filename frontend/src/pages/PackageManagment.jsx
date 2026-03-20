import React, { useEffect, useState } from "react";
import axios from "axios";

const apiBase = "http://localhost:4000";

const initialFormState = {
  package_name: "",
  package_type: "",
  source_city: "Ahmedabad",
  destination: "",
  price: "",
  duration: "",
  description: "",
  bus_id: "",
  tour_guide: "",
  sightseeing: "",
  itinerary: "",
  start_date: "",
  end_date: "",
  inclusive: "",
  exclusive: "",
  status: "Active",
  tour_status: "Scheduled",
};

const PackageManagment = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);

  const [packages, setPackages] = useState([]);
  const [buses, setBuses] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [hotelsList, setHotelsList] = useState([]);

  const [selectedHotels, setSelectedHotels] = useState([""]);
  const [boardingPoints, setBoardingPoints] = useState([""]);
  const [imageInputs, setImageInputs] = useState([null]);

  const token = localStorage.getItem("token");

  const fetchData = async () => {
    try {
      const [pkgRes, busRes, staffRes, hotelRes] = await Promise.all([
        axios.get(`${apiBase}/api/packages`),
        axios.get(`${apiBase}/api/bus`),
        axios.get(`${apiBase}/api/staff`),
        axios.get(`${apiBase}/api/hotels`),
      ]);

      setPackages(pkgRes.data || []);
      setBuses(busRes.data || []);
      setStaffList(staffRes.data || []);
      setHotelsList(hotelRes.data || []);
    } catch (error) {
      console.error("Error loading data", error);
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

  const addHotelSelect = () => setSelectedHotels((prev) => [...prev, ""]);
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

  const addBoardingPoint = () => setBoardingPoints((prev) => [...prev, ""]);
  const removeBoardingPoint = (index) => {
    setBoardingPoints((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };
  const updateBoardingPoint = (index, value) => {
    setBoardingPoints((prev) =>
      prev.map((item, i) => (i === index ? value : item)),
    );
  };

  const resetPackageForm = () => {
    setFormData(initialFormState);
    setSelectedHotels([""]);
    setBoardingPoints([""]);
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
      payload.append("price", formData.price);
      payload.append("duration", formData.duration);
      payload.append("description", formData.description);
      payload.append("bus_id", formData.bus_id);
      payload.append("tour_guide", formData.tour_guide);
      payload.append("start_date", formData.start_date);
      payload.append("end_date", formData.end_date);
      payload.append("inclusive", formData.inclusive);
      payload.append("exclusive", formData.exclusive);
      payload.append("status", formData.status);
      payload.append("tour_status", formData.tour_status);
      payload.append("itinerary", formData.itinerary);
      payload.append(
        "sightseeing",
        JSON.stringify(splitCsv(formData.sightseeing)),
      );

      const hotelsPayload = cleanStringArray(selectedHotels);
      payload.append("hotels", JSON.stringify(hotelsPayload));

      const pointsPayload = cleanStringArray(boardingPoints);
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
      price: pkg.price || "",
      duration: pkg.duration || "",
      description: pkg.description || "",
      bus_id:
        typeof pkg.bus_id === "object" ? pkg.bus_id?._id : pkg.bus_id || "",
      tour_guide:
        typeof pkg.tour_guide === "object"
          ? pkg.tour_guide?._id
          : pkg.tour_guide || "",
      start_date: pkg.start_date ? pkg.start_date.split("T")[0] : "",
      end_date: pkg.end_date ? pkg.end_date.split("T")[0] : "",
      inclusive: pkg.inclusive || "",
      exclusive: pkg.exclusive || "",
      sightseeing: (pkg.sightseeing || []).join(", "),
      itinerary: pkg.itinerary || "",
      status: pkg.status || "Active",
      tour_status: pkg.tour_status || "Scheduled",
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
    setBoardingPoints(points);

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

  const selectedImageCount = imageInputs.filter(Boolean).length;

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getTourStatusBadgeClass = (tourStatus) => {
    if (tourStatus === "Completed") return "bg-success-subtle text-success";
    if (tourStatus === "Running") return "bg-warning-subtle text-warning";
    return "bg-primary-subtle text-primary";
  };

  return (
    <div className="container mt-4 mb-5">
      <div className="card shadow-sm p-4 mb-4">
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
              <label className="form-label">Price</label>
              <input
                type="number"
                name="price"
                className="form-control"
                value={formData.price}
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
              <label className="form-label">Start Date</label>
              <input
                type="date"
                name="start_date"
                className="form-control"
                value={formData.start_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">End Date</label>
              <input
                type="date"
                name="end_date"
                className="form-control"
                value={formData.end_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Bus (from Bus list)</label>
              <select
                name="bus_id"
                className="form-select"
                value={formData.bus_id}
                onChange={handleChange}
              >
                <option value="">Select Bus</option>
                {buses.map((bus) => (
                  <option key={bus._id} value={bus._id}>
                    {bus.bus_number} - {bus.bus_name} ({bus.bus_type})
                  </option>
                ))}
              </select>
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
              <label className="form-label">Hotels (one or more, use +)</label>
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
                        {hotel.name}
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
              <label className="form-label">
                Pick-up / Boarding Points (admin-defined, use +)
              </label>
              {boardingPoints.map((point, index) => (
                <div className="d-flex gap-2 mb-2" key={`boarding-${index}`}>
                  <input
                    type="text"
                    className="form-control"
                    value={point}
                    onChange={(e) => updateBoardingPoint(index, e.target.value)}
                    placeholder="Example: Navrangpura Circle"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={addBoardingPoint}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => removeBoardingPoint(index)}
                  >
                    -
                  </button>
                </div>
              ))}
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

            <div className="col-md-2">
              <label className="form-label">Tour Status</label>
              <select
                name="tour_status"
                className="form-select"
                value={formData.tour_status}
                onChange={handleChange}
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Running">Running</option>
                <option value="Completed">Completed</option>
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

      <div className="card shadow-sm p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">All Packages</h4>
          <span className="badge bg-light text-dark border">
            Total: {packages.length}
          </span>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Price</th>
                <th>Destination</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Hotels</th>
                <th>Pick-up Points</th>
                <th>Manage</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => {
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
                        {formatDate(pkg.start_date)}
                      </div>
                    </td>
                    <td>
                      <div className="fw-semibold">
                        {formatDate(pkg.end_date)}
                      </div>
                    </td>
                    <td className="fw-semibold">Rs. {pkg.price}</td>
                    <td>
                      <div className="fw-semibold">
                        {pkg.destination || "-"}
                      </div>
                    </td>
                    <td>{pkg.duration || "-"}</td>
                    <td>
                      <div className="d-flex flex-column gap-1">
                        <span
                          className={`badge ${getTourStatusBadgeClass(pkg.tour_status || "Scheduled")}`}
                        >
                          {pkg.tour_status || "Scheduled"}
                        </span>
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
              {packages.length === 0 && (
                <tr>
                  <td colSpan="12" className="text-center text-muted py-4">
                    No tour packages found. Add your first package above.
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
