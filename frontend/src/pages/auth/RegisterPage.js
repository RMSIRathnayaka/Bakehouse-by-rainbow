import React, { useState } from "react";
import axios from "axios";
import "./register.css";
import cakeImg from "../../assets/cake.jpg";
import { useNavigate } from "react-router-dom";

function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔥 VALIDATION
    if (form.password !== form.confirm_password) {
      alert("Passwords do not match");
      return;
    }

    try {
      await axios.post("http://127.0.0.1:8000/api/register/", {
        username: form.username,
        email: form.email,
        password: form.password,
        phone: form.phone, // optional if backend supports
      });

      alert("Registered successfully!");

      // 🔥 REDIRECT TO LOGIN
      navigate("/login");

    } catch (error) {
      console.error(error);
      alert("Registration failed");
    }
  };

  return (
    <div className="container">

      {/* LEFT SIDE */}
      <div className="left">
        <div className="form-box">
          <h1>Sign Up</h1>

          <form onSubmit={handleSubmit}>

            <div className="input-group">
              <input
                type="text"
                name="username"
                placeholder="User Name"
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <input
                type="email"
                name="email"
                placeholder="Email"
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <input
                type="text"
                name="phone"
                placeholder="Phone Number"
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                name="password"
                placeholder="Password"
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                name="confirm_password"
                placeholder="Confirm Password"
                onChange={handleChange}
              />
            </div>

            <button className="btn">Register</button>

          </form>

          <p className="bottom-text">
            Already have an account?{" "}
            <span onClick={() => navigate("/login")}>
              Login
            </span>
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="right">
        <img src={cakeImg} alt="cake" />
      </div>

    </div>
  );
}

export default RegisterPage;