import axios from "axios";
import React, { useEffect, useState } from "react";

const ManageCustmer = () => {
  const [custmer, setcustmer] = useState([]);

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

  const fetchCustmer = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get("http://localhost:4000/api/cust", {
        headers,
      });
      console.log(res);
      setcustmer(res.data);
    } catch (err) {
      console.error("Error fetching customers", err);
    }
  };

  useEffect(() => {
    fetchCustmer();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        await axios.delete(`http://localhost:4000/api/cust/delete/${id}`, {
          headers,
        });
        alert("Customer deleted successfully");
        fetchCustmer();
      } catch (err) {
        console.error("Error deleting customer", err);
        alert("Error deleting customer");
      }
    }
  };

  return (
    <>
      <div className="card p-5 mb-5 ">
        <h3 className=" mb-4">Custmer List </h3>
        <div className="card">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>email</th>
                <th>Mobile No</th>
                <th>Gender</th>
                <th>dob</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {custmer.map((cust) => (
                <tr key={cust._id}>
                  <td>{cust.first_name}</td>
                  <td>{cust.last_name}</td>
                  <td>{cust.email}</td>
                  <td>{cust.phone_no}</td>
                  <td>{cust.gender}</td>
                  <td>{formatIndianDate(cust.dob)}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(cust._id)}
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
    </>
  );
};

export default ManageCustmer;
