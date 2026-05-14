import React from "react";
import { FaFacebookF, FaWhatsapp } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/bakehouse-logo.svg";
import "./footer.css";

function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  const goToSection = (sectionId) => {
    if (location.pathname !== "/") {
      navigate(`/#${sectionId}`);
      return;
    }

    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `/#${sectionId}`);
    }
  };

  return (
    <footer className="footer" id="footer">
      <div className="footer-section footer-brand">
        <img src={logo} alt="Bake House by Rainbow" />
        <div>
          <h3>Bake House by Rainbow</h3>
          <p>Elegance in every bite. Custom celebration cakes, fresh bakes, and reliable ordering support.</p>
        </div>
      </div>

      <div className="footer-section">
        <h4>Quick Links</h4>
        <p onClick={() => goToSection("home")}>Home</p>
        <p onClick={() => navigate("/cakes")}>Items</p>
        <p onClick={() => navigate("/custom")}>Custom Cake</p>
        <p onClick={() => navigate("/cart")}>Cart</p>
      </div>

      <div className="footer-section">
        <h4>About</h4>
        <p onClick={() => goToSection("about")}>About Us</p>
        <p>Delivery Info</p>
        <p>Privacy Policy</p>
      </div>

      <div className="footer-section">
        <h4>Contact</h4>
        <a href="https://wa.me/94717100135" target="_blank" rel="noreferrer">
          <FaWhatsapp />
          <span>+94 71 710 0135</span>
        </a>
        <a href="https://www.facebook.com/share/18mQKyZCVV/" target="_blank" rel="noreferrer">
          <FaFacebookF />
          <span>Facebook</span>
        </a>
        <p>info@bakehouse.com</p>
      </div>
    </footer>
  );
}

export default Footer;
