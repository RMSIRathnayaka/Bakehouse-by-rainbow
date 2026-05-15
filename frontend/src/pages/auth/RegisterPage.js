import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import cakeImg from "../../assets/cake.jpg";
import api from "../../utils/api";
import "./register.css";

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirm_password: "",
  });

  const handleChange = (event) => {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.password !== form.confirm_password) {
      alert("Passwords do not match");
      return;
    }

    try {
      await api.post("/api/register/", {
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        password: form.password,
      });

      navigate("/login");
    } catch (error) {
      console.error(error);
      alert(JSON.stringify(error.response?.data || { error: "Registration failed" }));
    }
  };

  return (
    <main className="auth-page register-page">
      <section className="auth-panel">
        <div className="auth-card">
          <p className="auth-kicker">Create account</p>
          <h1>Sign Up</h1>
          <p className="auth-copy">Register once to place custom cake requests and track orders.</p>

          <form onSubmit={handleSubmit}>
            <label className="auth-field">
              <span>Full Name</span>
              <input
                type="text"
                name="full_name"
                placeholder="Enter your full name"
                value={form.full_name}
                onChange={handleChange}
              />
            </label>

            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
              />
            </label>

            <label className="auth-field">
              <span>Phone Number</span>
              <input
                type="text"
                name="phone"
                placeholder="Contact number"
                value={form.phone}
                onChange={handleChange}
              />
            </label>

            <label className="auth-field auth-field-wide">
              <span>Address</span>
              <textarea
                name="address"
                placeholder="Delivery address"
                value={form.address}
                onChange={handleChange}
              />
            </label>

            <label className="auth-field">
              <span>Password</span>
              <input
                type="password"
                name="password"
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={handleChange}
              />
            </label>

            <label className="auth-field">
              <span>Confirm Password</span>
              <input
                type="password"
                name="confirm_password"
                placeholder="Repeat password"
                value={form.confirm_password}
                onChange={handleChange}
              />
            </label>

            <button className="auth-submit">Register</button>
          </form>

          <p className="auth-bottom-text">
            Already have an account?{" "}
            <span onClick={() => navigate("/login")}>Login</span>
          </p>
        </div>
      </section>

      <section className="auth-media">
        <img src={cakeImg} alt="Decorated cake" />
      </section>
    </main>
  );
}

export default RegisterPage;
