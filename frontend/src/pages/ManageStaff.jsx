import React, { useState, useEffect } from "react";
import axios from "axios";

const ManageStaff = () => {
  const [staffList, setStaffList] = useState([]);
  const [form, setForm] = useState({
    name: "",
    designation: "Driver", // Default to Driver for convenience
    contact_no: "",
    email_id: "",
    dob: "",
    address: "",
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem("token");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post("http://localhost:4000/api/staff/add", form, {
        headers,
      });
      alert("Staff added successfully!");
      setForm({
        name: "",
        designation: "Driver",
        contact_no: "",
        email_id: "",
        dob: "",
        address: "",
      });
      fetchStaff();
    } catch (error) {
      console.error("Error adding staff", error);
      alert("Error adding staff");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      try {
        const token = localStorage.getItem("token");
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

  return (
    <div className="container mt-4">
      <h2>Manage Staff (Drivers & guide)</h2>

      {/* --- ADD STAFF FORM --- */}
      <div className="card p-3 mb-4 shadow-sm">
        <h4>Add New Staff Member</h4>
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-4 mb-3">
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
            <div className="col-md-4 mb-3">
              <label>Designation</label>
              <select
                name="designation"
                value={form.designation}
                className="form-control"
                onChange={handleChange}
              >
                <option value="Driver">Driver</option>
                <option value="Conductor">Tour guide</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="col-md-4 mb-3">
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
            <div className="col-md-4 mb-3">
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
            <div className="col-md-4 mb-3">
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
            <div className="col-md-4 mb-3">
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
          <button className="btn btn-primary">Add Staff</button>
        </form>
      </div>

      {/* --- STAFF LIST TABLE --- */}
      <div className="table-responsive">
        <table className="table table-bordered table-striped">
          <thead className="table-dark">
            <tr>
              <th>Name</th>
              <th>Designation</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map((staff) => (
              <tr key={staff._id}>
                <td>{staff.name}</td>
                <td>{staff.designation}</td>
                <td>{staff.contact_no}</td>
                <td>{staff.email_id}</td>
                <td>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(staff._id)}
                  >
                    Delete
                  </button>
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
