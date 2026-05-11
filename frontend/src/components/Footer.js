import React from "react";
import { useNavigate } from "react-router-dom";
import "./footer.css";

function Footer() {
  const navigate = useNavigate();

  return (
    <div className="footer">

      <div className="footer-section">
        <h3>BakeHouse</h3>
        <p>We create delicious cakes for every celebration.</p>
      </div>

      <div className="footer-section">
        <h4>Quick Links</h4>
        <p onClick={() => navigate("/")}>Home</p>
        <p>Cakes</p>
        <p onClick={() => navigate("/custom")}>Custom Cake</p>
        <p onClick={() => navigate("/orders")}>My Orders</p>
      </div>

      <div className="footer-section">
        <h4>Customer Service</h4>
        <p>FAQ</p>
        <p>Delivery Info</p>
        <p>Privacy Policy</p>
      </div>

      <div className="footer-section">
        <h4>Contact</h4>
        <p>+94 123 456 789</p>
        <p>info@bakehouse.com</p>
      </div>

    </div>
  );
}

export default Footer;