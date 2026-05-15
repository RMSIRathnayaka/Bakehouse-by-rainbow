import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import api from "../utils/api";
import { clearSession, getDisplayName } from "../utils/session";
import "./profile.css";

function ProfilePage() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const displayName = getDisplayName();

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/api/profile/");
        setUser(res.data);
      } catch (error) {
        console.error("Error fetching profile", error);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="profile-page">
      <Navbar />

      <div className="profile-top-bar">
        <div>
          <span>Signed in as</span>
          <h3>{displayName}</h3>
        </div>

        <button onClick={handleLogout}>Logout</button>
      </div>

      <main className="profile-container">
        <section className="profile-card">
          {!user ? (
            <p className="profile-loading">Loading...</p>
          ) : (
            <>
              <div className="profile-avatar">
                {(user.display_name || user.email).charAt(0).toUpperCase()}
              </div>

              <div className="profile-name">
                {user.display_name}
              </div>

              <div className="profile-info">
                <p><strong>Full Name:</strong> {user.full_name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Phone:</strong> {user.phone || "Not added"}</p>
                <p><strong>Address:</strong> {user.address || "Not added"}</p>
                <p><strong>Role:</strong> {user.role}</p>
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default ProfilePage;
