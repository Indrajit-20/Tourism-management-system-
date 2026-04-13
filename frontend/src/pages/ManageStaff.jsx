import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/manageStaff.css";

const ManageStaff = () => {
  const [staffList, setStaffList] = useState([]);
  const [designationFilter, setDesignationFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    designation: "driver",
    contact_no: "",
    email_id: "",
    password: "",
    dob: "",
    address: "",
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get("http://localhost:4000/api/staff", {
        headers,
      });
      setStaffList(res.data);
    } catch (error) {
      console.error("Error fetching staff", error);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setEditingStaffId(null);
    setForm({
      name: "",
      designation: "driver",
      contact_no: "",
      email_id: "",
      password: "",
      dob: "",
      address: "",
    });
  };

  const toInputDate = (value) => {
    if (!value) return "";
    if (/^\d{2}-\d{2}-\d{4}$/.test(String(value))) {
      const [dd, mm, yyyy] = String(value).split("-");
      return `${yyyy}-${mm}-${dd}`;
    }
    if (String(value).includes("/")) {
      const parts = String(value).split("/");
      if (parts.length === 3) {
        const [dd, mm, yyyy] = parts;
        return `${yyyy}-${mm}-${dd}`;
      }
    }
    return String(value).split("T")[0];
  };

  const formatIndianDate = (value) => {
    if (!value) return "-";
    const text = String(value).trim();
    if (/^\d{2}-\d{2}-\d{4}$/.test(text)) return text;
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      const [yyyy, mm, dd] = text.split("-");
      return `${dd}-${mm}-${yyyy}`;
    }
    return "-";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (editingStaffId) {
        const payload = { ...form };
        if (!payload.password) {
          delete payload.password;
        }

        await axios.put(
          `http://localhost:4000/api/staff/update/${editingStaffId}`,
          payload,
          { headers },
        );
        alert("Staff updated successfully!");
      } else {
        await axios.post("http://localhost:4000/api/staff/add", form, {
          headers,
        });
        alert("Staff added successfully!");
      }

      resetForm();
      fetchStaff();
    } catch (error) {
      console.error("Error saving staff", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Error saving staff";
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleEdit = (staff) => {
    setEditingStaffId(staff._id);
    setForm({
      name: staff.name || "",
      designation: staff.designation || "driver",
      contact_no: staff.contact_no || "",
      email_id: staff.email_id || "",
      password: "",
      dob: toInputDate(staff.dob),
      address: staff.address || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      try {
        const token = sessionStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        await axios.delete(`http://localhost:4000/api/staff/delete/${id}`, {
          headers,
        });
        alert("Staff deleted successfully");
        fetchStaff();
      } catch (error) {
        console.error("Error deleting staff", error);
        alert("Error deleting staff");
      }
    }
  };

  const filteredStaff = staffList.filter((staff) => {
    const byDesignation =
      designationFilter === "all" || staff.designation === designationFilter;
    const bySearch =
      !searchText.trim() ||
      String(staff.name || "")
        .toLowerCase()
        .includes(searchText.toLowerCase()) ||
      String(staff.email_id || "")
        .toLowerCase()
        .includes(searchText.toLowerCase()) ||
      String(staff.contact_no || "")
        .toLowerCase()
        .includes(searchText.toLowerCase());
    return byDesignation && bySearch;
  });

  const totalStaff = staffList.length;
  const totalDrivers = staffList.filter(
    (staff) => staff.designation === "driver",
  ).length;
  const totalGuides = staffList.filter(
    (staff) => staff.designation === "guide",
  ).length;

  return (
    <div className="container mt-4 manage-staff-page">
      <h2 className="manage-staff-title">Manage Staff (Drivers & guide)</h2>

      {/* --- ADD STAFF FORM --- */}
      <div className="card p-3 mb-4 shadow-sm manage-staff-card">
        <h4>{editingStaffId ? "Edit Staff Member" : "Add New Staff Member"}</h4>
        <form onSubmit={handleSubmit}>
          <div className="row g-2">
            <div className="col-md-4 mb-3 manage-staff-field">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-4 mb-3 manage-staff-field">
              <label>Designation</label>
              <select
                name="designation"
                value={form.designation}
                className="form-control"
                onChange={handleChange}
              >
                <option value="driver">Driver</option>
                <option value="guide">Tour Guide</option>
              </select>
            </div>
            <div className="col-md-4 mb-3 manage-staff-field">
              <label>Contact No</label>
              <input
                type="text"
                name="contact_no"
                value={form.contact_no} // updated to match backend
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-4 mb-3 manage-staff-field">
              <label>Email ID</label>
              <input
                type="email"
                name="email_id"
                value={form.email_id}
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-4 mb-3 manage-staff-field">
              <label>🔐 Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                className="form-control"
                onChange={handleChange}
                placeholder={
                  editingStaffId
                    ? "Leave blank to keep current password"
                    : "Enter password"
                }
                required={!editingStaffId}
              />
            </div>
            <div className="col-md-4 mb-3 manage-staff-field">
              <label>Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={form.dob}
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-4 mb-3 manage-staff-field">
              <label>Address</label>
              <input
                type="text"
                name="address"
                value={form.address}
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-primary" type="submit">
              {editingStaffId ? "Update Staff" : "Add Staff"}
            </button>
            {editingStaffId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card p-3 mb-3 shadow-sm manage-staff-card">
        <div className="manage-staff-counts mb-3">
          <div className="manage-staff-count-item">
            <span>Total Staff</span>
            <strong>{totalStaff}</strong>
          </div>
          <div className="manage-staff-count-item">
            <span>Total Drivers</span>
            <strong>{totalDrivers}</strong>
          </div>
          <div className="manage-staff-count-item">
            <span>Total Guides</span>
            <strong>{totalGuides}</strong>
          </div>
        </div>

        <div className="row g-3 align-items-end manage-staff-filter-row">
          <div className="col-md-6">
            <label className="form-label">Search Staff</label>
            <input
              className="form-control manage-staff-control"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by name, email, or contact"
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Filter by Designation</label>
            <select
              className="form-control manage-staff-control"
              value={designationFilter}
              onChange={(e) => setDesignationFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="driver">Drivers</option>
              <option value="guide">Guide</option>
            </select>
          </div>
        </div>
        <small className="text-muted d-block mt-2">
          Showing {filteredStaff.length} of {totalStaff} staff
        </small>
      </div>

      {/* --- STAFF LIST TABLE --- */}
      <div className="table-responsive manage-staff-table-wrap">
        <table className="table table-bordered table-striped table-sm align-middle manage-staff-table">
          <thead className="table-dark">
            <tr>
              <th>SNo</th>
              <th>Name</th>
              <th>Designation</th>
              <th>Contact</th>
              <th>Email</th>
              <th>DOB</th>
              <th>Address</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((staff, index) => (
              <tr key={staff._id}>
                <td>{index + 1}</td>
                <td>{staff.name}</td>
                <td>{staff.designation}</td>
                <td>{staff.contact_no}</td>
                <td>{staff.email_id}</td>
                <td>{formatIndianDate(staff.dob)}</td>
                <td>{staff.address || "-"}</td>
                <td className="text-center">
                  <div className="d-flex justify-content-center gap-2">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleEdit(staff)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(staff._id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageStaff;
