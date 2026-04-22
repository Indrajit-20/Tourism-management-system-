import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const navigate = useNavigate();
  const [formdata, setformdata] = useState({ email: "", password: "" });

  const handleonchange = (e) => {
    setformdata({ ...formdata, [e.target.name]: e.target.value });
  };

  const handleonsubmit = async (e) => {
    e.preventDefault();

    try {
      const { data } = await axios.post(
        "http://localhost:4000/api/auth/login",
        formdata
      );

      // Save to sessionStorage for tab isolation
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("role", data.role);
      sessionStorage.setItem("username", data.name || formdata.email);

      // Trigger custom event so Header component updates
      window.dispatchEvent(
        new CustomEvent("userLogin", {
          detail: {
            username: data.name || formdata.email,
            role: data.role,
            token: data.token,
          },
        })
      );

      alert("Login successful");

      if (data.role === "admin") {
        navigate("/admin");
      } else if (data.role === "driver" || data.role === "guide") {
        navigate("/staff-dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      alert(`Login failed: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        {/* 5. Combined a few divs here to reduce HTML clutter */}
        <div className="col-md-4 card p-4 shadow">
          <h3 className="text-center mb-4 text-primary">Login Now</h3>

          <form onSubmit={handleonsubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="Enter your email"
                onChange={handleonchange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                className="form-control"
                placeholder="Enter password"
                onChange={handleonchange}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100">
              Login Now
            </button>

            <div className="text-center mt-3">
              <span>First time visit? </span>
              <Link to="/register">Register</Link>
            </div>

            <div className="text-center mt-2">
              <Link to="/forgot-password">Forgot Password?</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
