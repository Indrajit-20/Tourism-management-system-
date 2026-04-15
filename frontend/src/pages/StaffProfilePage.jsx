import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaUser, FaLock, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import StaffProfileCard from "../components/StaffProfileCard";
import "bootstrap/dist/css/bootstrap.min.css";

const API = "http://localhost:4000";

const StaffProfile = () => {
  const [staff, setStaff] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    contact_no: "",
    address: "",
    email: "",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch staff info on mount
  useEffect(() => {
    fetchStaffInfo();
  }, []);

  const fetchStaffInfo = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      const user = JSON.parse(sessionStorage.getItem("user"));

      // Fetch all staff and find the current user
      const res = await axios.get(`${API}/api/staff`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const currentStaff = res.data.find((s) => s.email === user.email);
      if (currentStaff) {
        setStaff(currentStaff);
        setFormData({
          name: currentStaff.name,
          contact_no: currentStaff.contact_no,
          address: currentStaff.address,
          email: currentStaff.email,
        });
      }
      setError(null);
    } catch (err) {
      setError("Failed to load profile information");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSuccess(null);
      const token = sessionStorage.getItem("token");
      await axios.put(`${API}/api/staff/update/${staff._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchStaffInfo();
      setEditMode(false);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match!");
      return;
    }

    try {
      setError(null);
      const token = sessionStorage.getItem("token");
      await axios.put(
        `${API}/api/staff/change-password/${staff._id}`,
        {
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setChangePasswordMode(false);
      setSuccess("Password changed successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-vh-100"
      style={{ backgroundColor: "#f8f9fa", paddingTop: "2rem" }}
    >
      <div className="container">
        {/* Header */}
        <div className="mb-5">
          <h1 className="mb-1">
            <FaUser className="me-3" />
            My Profile
          </h1>
          <p className="text-muted lead">View and manage your information</p>
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

        {/* Success Message */}
        {success && (
          <div
            className="alert alert-success alert-dismissible fade show"
            role="alert"
          >
            ✅ {success}
            <button
              type="button"
              className="btn-close"
              onClick={() => setSuccess(null)}
            ></button>
          </div>
        )}

        <div className="row g-4">
          {/* Profile Card */}
          <div className="col-lg-4">
            {staff && <StaffProfileCard staff={staff} />}
          </div>

          {/* Edit Profile / Password */}
          <div className="col-lg-8">
            {/* Edit Profile Card */}
            <div className="card shadow-lg border-0 mb-4">
              <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FaEdit className="me-2" />
                  Edit Profile
                </h5>
                <button
                  className="btn btn-sm btn-light"
                  onClick={() => setEditMode(!editMode)}
                >
                  {editMode ? (
                    <>
                      <FaTimes className="me-1" /> Cancel
                    </>
                  ) : (
                    <>
                      <FaEdit className="me-1" /> Edit
                    </>
                  )}
                </button>
              </div>
              <div className="card-body p-4">
                {!editMode ? (
                  <div className="row g-3">
                    <div className="col-md-12">
                      <div className="bg-light p-3 rounded">
                        <small className="text-muted d-block mb-1">
                          Full Name
                        </small>
                        <strong className="d-block">{staff?.name}</strong>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="bg-light p-3 rounded">
                        <small className="text-muted d-block mb-1">
                          Contact Number
                        </small>
                        <strong className="d-block">{staff?.contact_no}</strong>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="bg-light p-3 rounded">
                        <small className="text-muted d-block mb-1">Email</small>
                        <strong className="d-block text-break">
                          {staff?.email}
                        </strong>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="bg-light p-3 rounded">
                        <small className="text-muted d-block mb-1">
                          Address
                        </small>
                        <strong className="d-block">{staff?.address}</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateProfile}>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Full Name</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold">
                          Contact Number
                        </label>
                        <input
                          type="tel"
                          className="form-control form-control-lg"
                          value={formData.contact_no}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              contact_no: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold">Email</label>
                        <input
                          type="email"
                          className="form-control form-control-lg"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              email: e.target.value,
                            })
                          }
                          disabled
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-bold">Address</label>
                      <textarea
                        className="form-control form-control-lg"
                        rows="3"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address: e.target.value,
                          })
                        }
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary btn-lg w-100"
                    >
                      <FaSave className="me-2" />
                      Save Changes
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Change Password Card */}
            <div className="card shadow-lg border-0">
              <div className="card-header bg-warning text-dark d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FaLock className="me-2" />
                  Change Password
                </h5>
                <button
                  className="btn btn-sm btn-light"
                  onClick={() => setChangePasswordMode(!changePasswordMode)}
                >
                  {changePasswordMode ? (
                    <>
                      <FaTimes className="me-1" /> Cancel
                    </>
                  ) : (
                    <>
                      <FaLock className="me-1" /> Change
                    </>
                  )}
                </button>
              </div>
              <div className="card-body p-4">
                {!changePasswordMode ? (
                  <div className="alert alert-info mb-0">
                    <strong>Security Tip:</strong> Change your password
                    regularly to keep your account secure.
                  </div>
                ) : (
                  <form onSubmit={handleChangePassword}>
                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        Current Password
                      </label>
                      <input
                        type="password"
                        className="form-control form-control-lg"
                        value={passwordData.oldPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            oldPassword: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-bold">New Password</label>
                      <input
                        type="password"
                        className="form-control form-control-lg"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        className="form-control form-control-lg"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-warning btn-lg w-100"
                    >
                      <FaSave className="me-2" />
                      Change Password
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;
