import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const [formdata, setformdata] = useState({
    first_name: "",
    last_name: "",
    email: "",
    dob: "",
    phone_no: "",
    password: "",
    confirm_password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setformdata({ ...formdata, [e.target.name]: e.target.value });
    setError(""); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formdata.password !== formdata.confirm_password) {
      setError("❌ Passwords do not match!");
      return;
    }

    if (formdata.password.length < 6) {
      setError("❌ Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        first_name: formdata.first_name,
        last_name: formdata.last_name,
        email: formdata.email,
        dob: formdata.dob,
        phone_no: formdata.phone_no,
        password: formdata.password,
      };

      const response = await axios.post(
        "http://localhost:4000/api/auth/register",
        payload
      );

      if (response.status === 201 || response.status === 200) {
        setSuccess("✅ Registration successful! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      console.log(
        "Error during registration:",
        err.response || err.message || err
      );

      // Display specific error message from backend
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.details ||
        err.message ||
        "Registration failed. Please try again";

      setError(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm border-0 bg-light p-4">
            <h2 className="text-center mb-4 text-primary">Register Now</h2>

            {error && (
              <div
                className="alert alert-danger alert-dismissible fade show"
                role="alert"
              >
                {error}
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setError("")}
                  aria-label="Close"
                ></button>
              </div>
            )}

            {success && (
              <div
                className="alert alert-success alert-dismissible fade show"
                role="alert"
              >
                {success}
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSuccess("")}
                  aria-label="Close"
                ></button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">First Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter first name"
                    name="first_name"
                    required
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6 mt-3 mt-md-0">
                  <label className="form-label fw-bold">Last Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter last name"
                    name="last_name"
                    required
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="name@example.com"
                  name="email"
                  required
                  onChange={handleChange}
                />
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Date Of Birth</label>
                  <input
                    type="date"
                    className="form-control"
                    name="dob"
                    required
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6 mt-3 mt-md-0">
                  <label className="form-label fw-bold">Mobile No</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="10-digit number"
                    pattern="[0-9]{10}"
                    name="phone_no"
                    required
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Min 6 characters"
                    minLength={6}
                    name="password"
                    required
                    autoComplete="new-password"
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6 mt-3 mt-md-0">
                  <label className="form-label fw-bold">Confirm Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Min 6 characters"
                    minLength={6}
                    name="confirm_password"
                    required
                    autoComplete="new-password"
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 py-2 mb-3 fw-bold"
                disabled={loading}
              >
                {loading ? "Registering..." : "Register Now"}
              </button>

              <div className="text-center">
                <span className="text-muted small">Already a member? </span>
                <Link to="/login" className="text-decoration-none fw-bold">
                  Login here
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
