import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaUserTie,
  FaUsers,
} from "react-icons/fa";
import StaffDetailsModal from "../components/StaffDetailsModal";
import StaffProfileCard from "../components/StaffProfileCard";
import "bootstrap/dist/css/bootstrap.min.css";

const API = "http://localhost:4000";

const ManageGuidesAndDrivers = () => {
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [designationFilter, setDesignationFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    designation: "driver",
    contact_no: "",
    email: "",
    password: "",
    dob: "",
    address: "",
  });

  // Fetch all staff
  useEffect(() => {
    fetchStaff();
  }, []);

  // Filter staff based on search and designation
  useEffect(() => {
    let filtered = staff;

    if (designationFilter !== "all") {
      filtered = filtered.filter((s) => s.designation === designationFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.contact_no.includes(searchTerm)
      );
    }

    setFilteredStaff(filtered);
  }, [staff, searchTerm, designationFilter]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      const res = await axios.get(`${API}/api/staff`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStaff(res.data || []);
      setError(null);
    } catch (err) {
      setError("Failed to fetch staff members");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem("token");
      await axios.post(`${API}/api/staff/add`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchStaff();
      resetForm();
      setShowModal(false);
      alert("Staff added successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Error adding staff");
    }
  };

  const handleDeleteStaff = async (id) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      try {
        const token = sessionStorage.getItem("token");
        await axios.delete(`${API}/api/staff/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchStaff();
        alert("Staff deleted successfully!");
      } catch (err) {
        alert(err.response?.data?.message || "Error deleting staff");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      designation: "driver",
      contact_no: "",
      email: "",
      password: "",
      dob: "",
      address: "",
    });
  };

  const getDesignationColor = (designation) => {
    return designation === "driver" ? "text-primary" : "text-danger";
  };

  const getDesignationIcon = (designation) => {
    return designation === "driver" ? "🚗" : "🎯";
  };

  const getStaffCount = (designation) => {
    return staff.filter((s) => s.designation === designation).length;
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: "#f8f9fa" }}>
      {/* Header */}
      <div
        className="bg-gradient text-white py-5 mb-5"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <div className="container">
          <h1 className="mb-1">
            <FaUsers className="me-3" />
            Guides & Drivers Management
          </h1>
          <p className="lead mb-0">Manage tour guides and bus drivers</p>
        </div>
      </div>

      <div className="container mb-5">
        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body text-center">
                <h3 className="card-title text-primary">
                  <FaUserTie className="me-2" />
                  Total Staff
                </h3>
                <h1 className="display-4 fw-bold text-primary">
                  {staff.length}
                </h1>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body text-center">
                <h3 className="card-title text-success">🚗 Drivers</h3>
                <h1 className="display-4 fw-bold text-success">
                  {getStaffCount("driver")}
                </h1>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body text-center">
                <h3 className="card-title text-danger">🎯 Guides</h3>
                <h1 className="display-4 fw-bold text-danger">
                  {getStaffCount("guide")}
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-bold">🔍 Search</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name, email, or contact..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">📋 Filter by Role</label>
                <select
                  className="form-select"
                  value={designationFilter}
                  onChange={(e) => setDesignationFilter(e.target.value)}
                >
                  <option value="all">All Staff</option>
                  <option value="driver">Drivers</option>
                  <option value="guide">Guides</option>
                </select>
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button
                  className="btn btn-primary w-100"
                  onClick={() => setShowModal(true)}
                >
                  <FaPlus className="me-2" />
                  Add Staff
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="alert alert-danger alert-dismissible fade show"
            role="alert"
          >
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError(null)}
            ></button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading staff members...</p>
          </div>
        )}

        {/* Staff Table */}
        {!loading && filteredStaff.length > 0 && (
          <div className="card shadow-sm border-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="fw-bold">Name</th>
                    <th className="fw-bold">Role</th>
                    <th className="fw-bold">Contact</th>
                    <th className="fw-bold">Email</th>
                    <th className="fw-bold">Address</th>
                    <th className="fw-bold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((member) => (
                    <tr key={member._id}>
                      <td className="fw-bold">
                        {getDesignationIcon(member.designation)} {member.name}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            member.designation === "driver"
                              ? "bg-primary"
                              : "bg-danger"
                          }`}
                        >
                          {member.designation.toUpperCase()}
                        </span>
                      </td>
                      <td>{member.contact_no}</td>
                      <td className="text-break" style={{ maxWidth: "200px" }}>
                        {member.email}
                      </td>
                      <td style={{ maxWidth: "150px" }}>
                        <small>{member.address}</small>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-info me-2"
                          onClick={() => {
                            setSelectedStaff(member);
                            setShowDetailsModal(true);
                          }}
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          className="btn btn-sm btn-warning me-2"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteStaff(member._id)}
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && filteredStaff.length === 0 && (
          <div className="alert alert-info text-center py-5">
            <h5>No staff members found</h5>
            <p className="mb-0">
              Try adjusting your search or filter criteria, or add a new staff
              member.
            </p>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  <FaPlus className="me-2" />
                  Add New Staff Member
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                ></button>
              </div>
              <form onSubmit={handleAddStaff}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter full name"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Role *</label>
                    <select
                      className="form-select"
                      required
                      value={formData.designation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          designation: e.target.value,
                        })
                      }
                    >
                      <option value="driver">Driver</option>
                      <option value="guide">Guide</option>
                    </select>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">
                        Contact Number *
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        required
                        value={formData.contact_no}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contact_no: e.target.value,
                          })
                        }
                        placeholder="10-digit number"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">
                        Date of Birth *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.dob}
                        onChange={(e) =>
                          setFormData({ ...formData, dob: e.target.value })
                        }
                        placeholder="DD-MM-YYYY"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          email: e.target.value,
                        })
                      }
                      placeholder="Enter email address"
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Password *</label>
                      <input
                        type="password"
                        className="form-control"
                        required
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            password: e.target.value,
                          })
                        }
                        placeholder="Enter password"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Address *</label>
                    <textarea
                      className="form-control"
                      required
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      placeholder="Enter address"
                      rows="3"
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Add Staff Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Staff Details Modal */}
      {showDetailsModal && (
        <StaffDetailsModal
          staff={selectedStaff}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
};

export default ManageGuidesAndDrivers;
