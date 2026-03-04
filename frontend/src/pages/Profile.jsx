import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Profile = () => {
  const navigate = useNavigate();

  // State variables
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get(
        "http://localhost:4000/api/cust/profile/me",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const userProfile = response.data.user;
      setProfile(userProfile);
      setFirstName(userProfile.first_name || "");
      setLastName(userProfile.last_name || "");
      setEmail(userProfile.email || "");
      setPhoneNo(userProfile.phone_no || "");
      setDateOfBirth(userProfile.dob ? userProfile.dob.split("T")[0] : "");
      setGender(userProfile.gender || "");
      setAddress(userProfile.address || "");

      setLoading(false);
    } catch (error) {
      setErrorMessage("Failed to load profile. Please login again.");
      setLoading(false);
      if (error.response?.status === 401) {
        setTimeout(() => navigate("/login"), 2000);
      }
    }
  };

  const updateProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        "http://localhost:4000/api/cust/profile/update",
        {
          first_name: firstName,
          last_name: lastName,
          dob: dateOfBirth,
          gender: gender,
          address: address,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setProfile(response.data.user);
      setIsEditing(false);
      setSuccessMessage("Profile updated successfully!");
      setErrorMessage("");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage("Failed to update profile. Please try again.");
    }
  };

  const cancelEditing = () => {
    setFirstName(profile.first_name || "");
    setLastName(profile.last_name || "");
    setDateOfBirth(profile.dob ? profile.dob.split("T")[0] : "");
    setGender(profile.gender || "");
    setAddress(profile.address || "");
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-grow text-primary" role="status"></div>
        <span className="ms-3 fw-bold">Loading Profile...</span>
      </div>
    );
  }

  return (
    <div className="profile-bg min-vh-100 py-5">
      <div className="container">
        {/* Top Navigation Row */}
        <div className="row justify-content-center mb-4">
          <div className="col-lg-8 d-flex justify-content-between align-items-center">
            <button className="btn btn-primary" onClick={() => navigate("/")}>
              <i className="bi bi-house-door me-2"></i> ← Back to Home
            </button>
            <h2 className="fw-bold mb-0 text-dark">Profile</h2>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-8 col-md-10">
            {/* Status Messages */}
            {errorMessage && (
              <div className="alert alert-danger shadow-sm border-0 mb-4">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="alert alert-success shadow-sm border-0 mb-4">
                {successMessage}
              </div>
            )}

            <div className="card border-0 shadow-lg overflow-hidden">
              <div className="row g-0">
                {/* Profile Sidebar Decor */}
                <div className="col-md-4 bg-primary text-white d-flex flex-column align-items-center justify-content-center p-4 text-center">
                  <div
                    className="rounded-circle bg-white text-primary d-flex align-items-center justify-content-center mb-3 shadow"
                    style={{
                      width: "100px",
                      height: "100px",
                      fontSize: "40px",
                    }}
                  >
                    {firstName.charAt(0)}
                    {lastName.charAt(0)}
                  </div>
                  <h4 className="mb-1">
                    {firstName} {lastName}
                  </h4>
                  <p className="small opacity-75">{email}</p>
                  {!isEditing && (
                    <button
                      className="btn btn-light btn-sm mt-3 px-4 rounded-pill fw-bold"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Profile
                    </button>
                  )}
                </div>

                <div className="col-md-8 bg-white p-4">
                  {!isEditing ? (
                    /* VIEW MODE */
                    <div className="row g-3">
                      <ProfileField label="First Name" value={firstName} />
                      <ProfileField label="Last Name" value={lastName} />
                      <ProfileField label="Email" value={email} />
                      <ProfileField label="Phone" value={phoneNo} />
                      <ProfileField
                        label="Birth Date"
                        value={dateOfBirth || "Not set"}
                      />
                      <ProfileField
                        label="Gender"
                        value={gender || "Not set"}
                      />
                      <div className="col-12 mt-4">
                        <label className="text-muted small text-uppercase fw-bold">
                          Address
                        </label>
                        <p className="border-bottom pb-2">
                          {address || "No address provided"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* EDIT MODE */
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-bold">
                          First Name
                        </label>
                        <input
                          type="text"
                          className="form-control bg-light border-0"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold">
                          Last Name
                        </label>
                        <input
                          type="text"
                          className="form-control bg-light border-0"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          className="form-control bg-light border-0"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold">
                          Gender
                        </label>
                        <select
                          className="form-select bg-light border-0"
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                        >
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-bold">
                          Address
                        </label>
                        <textarea
                          className="form-control bg-light border-0"
                          rows="2"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        ></textarea>
                      </div>
                      <div className="col-12 mt-4 d-flex gap-2">
                        <button
                          className="btn btn-success px-4"
                          onClick={updateProfile}
                        >
                          Save Changes
                        </button>
                        <button
                          className="btn btn-outline-secondary px-4"
                          onClick={cancelEditing}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Component for cleaner code
const ProfileField = ({ label, value }) => (
  <div className="col-md-6 mb-3">
    <label className="text-muted small text-uppercase fw-bold d-block mb-1">
      {label}
    </label>
    <p className="fw-normal border-bottom pb-1">{value}</p>
  </div>
);

export default Profile;
