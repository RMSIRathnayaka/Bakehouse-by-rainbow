import React, { useState } from "react";
import "./login.css";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock } from "react-icons/fa";
import cakeImg from "../../assets/cake.jpg";
import api from "../../utils/api";
import { saveSession } from "../../utils/session";

function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      alert("Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/api/token/", {
        email: form.email,
        password: form.password,
      });

      saveSession({
        access: res.data.access,
        refresh: res.data.refresh,
        email: res.data.email || form.email,
        display_name: res.data.display_name || res.data.email || form.email,
        role: res.data.role || "customer",
      });

      const userRole = res.data.role || "customer";
      navigate(userRole === "admin" ? "/admin-panel" : "/");

    } catch (error) {
      console.error(error);
      alert("Invalid email or password");
    }

    setLoading(false);
  };

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-card">
          <p className="auth-kicker">Welcome back</p>
          <h1>Sign In</h1>
          <p className="auth-copy">Access your orders, profile, and custom cake requests.</p>

          <form onSubmit={handleSubmit}>
            <label className="auth-field">
              <span>Email</span>
              <div className="auth-input">
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                />
                <FaEnvelope />
              </div>
            </label>

            <label className="auth-field">
              <span>Password</span>
              <div className="auth-input">
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                />
                <FaLock />
              </div>
            </label>

            <button className="auth-submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="auth-bottom-text">
            Don't have an account?{" "}
            <span onClick={() => navigate("/register")}>Go to register</span>
          </p>
        </div>
      </section>

      <section className="auth-media">
        <img src={cakeImg} alt="Decorated cake" />
      </section>
    </main>
  );
}

export default LoginPage;
