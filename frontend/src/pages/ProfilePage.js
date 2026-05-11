import React, { useEffect, useState } from "react";
import axios from "axios";
import "./profile.css";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function ProfilePage() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const username = localStorage.getItem("username");

  // 🔴 Logout
  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("username");

    navigate("/login");
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(
          "http://127.0.0.1:8000/api/profile/",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access")}`,
            },
          }
        );

        setUser(res.data);
      } catch (error) {
        console.error("Error fetching profile", error);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div>
      <Navbar />

      {/* 🔥 SIMPLE HEADER */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "15px 25px",
        background: "#f8e6ef"
      }}>
        <h3>Welcome, {username} 👋</h3>

        <button
          onClick={handleLogout}
          style={{
            padding: "8px 15px",
            background: "#7a1f57",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          Logout
        </button>
      </div>

      {/* PROFILE UI */}
      <div className="profile-container">
        <div className="profile-card">

          {!user ? (
            <p>Loading...</p>
          ) : (
            <>
              <div className="profile-avatar">
                {user.username.charAt(0).toUpperCase()}
              </div>

              <div className="profile-name">
                {user.username}
              </div>

              <div className="profile-info">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Phone:</strong> {user.phone}</p>
              </div>
            </>
          )}

        </div>
      </div>
      <Footer />

    </div>
  );
}

export default ProfilePage;