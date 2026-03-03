import React, { useState, useEffect } from "react";
import axios from "axios";

// 1. THE BLUEPRINT: This saves us from typing this 100 times!
const initialFormState = {
  package_name: "",
  package_type: "",
  destination: "",
  price: "",
  duration: "",
  image_url: "",
  description: "",
  bus_id: "",
  hotel_id: "",
  start_date: "",
  inclusive: "",
  exclusive: "",
  status: "Active",
};

const PackageManagment = () => {
  // 2. Use the blueprint here
  const [formData, setFormData] = useState(initialFormState);
  const [packages, setPackages] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [buses, setBuses] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // 3. Load Data
  const fetchData = async () => {
    try {
      const pkgRes = await axios.get("http://localhost:4000/api/packages");
      setPackages(pkgRes.data);
    } catch (error) {
      console.error("Error fetching packages", error);
    }

    try {
      const hotelRes = await axios.get("http://localhost:4000/api/hotels");
      setHotels(hotelRes.data);
    } catch (error) {
      console.error("Error fetching hotels", error);
    }

    try {
      const busRes = await axios.get("http://localhost:4000/api/bus");
      setBuses(busRes.data);
    } catch (error) {
      console.error("Error fetching buses", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 4. Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // 5. Handle Submit (For both Add and Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in as admin to add a package. Please login.");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      if (editingId) {
        // Update existing package
        const res = await axios.put(
          `http://localhost:4000/api/packages/update/${editingId}`,
          formData,
          { headers }
        );
        alert(res?.data?.message || "Package updated!");
        setEditingId(null);
      } else {
        // Create new package
        const res = await axios.post(
          "http://localhost:4000/api/packages/add",
          formData,
          { headers }
        );
        alert(res?.data?.message || "Package Added!");
      }

      fetchData();
      // Reset form instantly using the blueprint!
      setFormData(initialFormState);
    } catch (error) {
      console.error("Error saving package", error);
      const msg = error?.response?.data?.message || error?.message || "Failed to save.";
      alert("Failed to save package: " + msg);
    }
  };

  // 6. Handle Edit (The ultra-short version)
  const handleEdit = (pkg) => {
    setEditingId(pkg._id);
    // Fill the form, but make sure the date is formatted correctly for HTML
    setFormData({
      ...initialFormState, // ensures all fields exist
      ...pkg,              // overwrites with actual data
      start_date: pkg.start_date ? pkg.start_date.split("T")[0] : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 7. Handle Cancel (Just resets to blueprint)
  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialFormState);
  };

  // 8. Handle Delete
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this package?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`http://localhost:4000/api/packages/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchData();
      } catch (error) {
        console.error("Error deleting", error);
      }
    }
  };

  return (
    <div className="container mt-4">
      {/* --- FORM SECTION --- */}
      <div className="card shadow-sm p-4 mb-5">
        <h3 className="mb-3">{editingId ? "Edit Tour Package" : "Add Tour Package"}</h3>

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            {/* Package Name */}
            <div className="col-md-6">
              <label className="form-label">Package Name:</label>
              <input type="text" name="package_name" className="form-control" onChange={handleChange} value={formData.package_name} required />
            </div>

            {/* Package Type */}
            <div className="col-md-6">
              <label className="form-label">Type:</label>
              <input type="text" name="package_type" className="form-control" onChange={handleChange} value={formData.package_type} required />
            </div>

            {/* Destination */}
            <div className="col-md-4">
              <label className="form-label">Destination:</label>
              <input type="text" name="destination" className="form-control" onChange={handleChange} value={formData.destination} required />
            </div>

            {/* Price */}
            <div className="col-md-4">
              <label className="form-label">Price:</label>
              <input type="number" name="price" className="form-control" onChange={handleChange} value={formData.price} required />
            </div>

            {/* Duration */}
            <div className="col-md-4">
              <label className="form-label">Duration:</label>
              <input type="text" name="duration" className="form-control" onChange={handleChange} value={formData.duration} required />
            </div>

            {/* Start Date */}
            <div className="col-md-4">
              <label className="form-label">Start Date:</label>
              <input type="date" name="start_date" className="form-control" onChange={handleChange} value={formData.start_date} required />
            </div>

            {/* IDs */}
            <div className="col-md-4">
              <label className="form-label">Bus ID:</label>
              <select name="bus_id" className="form-select" onChange={handleChange} value={formData.bus_id}>
                <option value="">Select Bus</option>
                {buses && buses.map((bus) => (
                  <option key={bus._id} value={bus._id}>{bus.bus_number} - {bus.bus_type}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Hotel ID:</label>
              <select name="hotel_id" className="form-select" onChange={handleChange} value={formData.hotel_id}>
                <option value="">Select Hotel</option>
                {hotels && hotels.map((hotel) => (
                  <option key={hotel._id} value={hotel._id}>{hotel.name}, {hotel.location}</option>
                ))}
              </select>
            </div>

            {/* Details */}
            <div className="col-12">
              <label className="form-label">Description:</label>
              <textarea name="description" className="form-control" onChange={handleChange} value={formData.description}></textarea>
            </div>
            <div className="col-12">
              <label className="form-label">Image Filename (e.g., goa.jpg):</label>
              <input type="text" name="image_url" className="form-control" placeholder="Paste the filename here" onChange={handleChange} value={formData.image_url} required />
            </div>

            {/* Includes/Excludes */}
            <div className="col-md-4">
              <label className="form-label">Inclusive:</label>
              <input type="text" name="inclusive" className="form-control" onChange={handleChange} value={formData.inclusive} required />
            </div>
            <div className="col-md-4">
              <label className="form-label">Exclusive:</label>
              <input type="text" name="exclusive" className="form-control" onChange={handleChange} value={formData.exclusive} required />
            </div>

            {/* Status */}
            <div className="col-md-4">
              <label className="form-label">Status:</label>
              <select name="status" className="form-select" onChange={handleChange} value={formData.status}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="col-12 mt-3 d-flex gap-2">
              <button type="submit" className="btn btn-primary w-100">
                {editingId ? "Update Package" : "Save Package"}
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary w-50" onClick={handleCancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* --- LIST SECTION --- */}
      <h3 className="mb-3">All Packages</h3>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Destination</th>
            <th>Type</th>
            <th>Price</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg) => (
            <tr key={pkg._id}>
              <td>
                <img
                  src={`http://localhost:4000/uploads/${pkg.image_url}`}
                  alt={pkg.package_name}
                  style={{ width: "50px", height: "50px", objectFit: "cover" }}
                />
              </td>
              <td>{pkg.package_name}</td>
              <td>{pkg.destination}</td>
              <td>{pkg.package_type}</td>
              <td>₹{pkg.price}</td>
              <td>
                <button className="btn btn-sm btn-secondary me-2" onClick={() => handleEdit(pkg)}>
                  Edit
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(pkg._id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PackageManagment;