import React, { useState } from "react";
import axios from "axios";
import "./login.css";
import { useNavigate } from "react-router-dom";
import cakeImg from "../../assets/cake.jpg";

function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
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

    // simple validation
    if (!form.username || !form.password) {
      alert("Please enter username and password");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/token/",
        {
          username: form.username,
          password: form.password,
        }
      );

      // ✅ SAVE TOKENS (VERY IMPORTANT)
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      // optional
      localStorage.setItem("username", form.username);

      alert("Login successful!");

      // 🔥 REDIRECT TO HOME (BETTER UX)
      navigate("/");

    } catch (error) {
      console.error(error);
      alert("Invalid username or password");
    }

    setLoading(false);
  };

  return (
    <div className="container">

      {/* LEFT SIDE */}
      <div className="left">
        <div className="form-box">

          <h1>Sign In</h1>

          <form onSubmit={handleSubmit}>

            <div className="input-group">
              <input
                type="text"
                name="username"
                placeholder="User Name"
                value={form.username}
                onChange={handleChange}
              />
              <span>👤</span>
            </div>

            <div className="input-group">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
              />
              <span>🔒</span>
            </div>

            <button className="btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

          </form>

          <p className="bottom-text">
            Don't have an account?{" "}
            <span onClick={() => navigate("/register")}>
              Go to register
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

export default LoginPage;