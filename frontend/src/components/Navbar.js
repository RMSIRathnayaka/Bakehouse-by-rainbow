import React, { useEffect, useState } from "react";
import { FaBars, FaShoppingCart, FaTimes, FaUser } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { getUserRole } from "../utils/session";
import "./navbar.css";

const navItems = [
  { label: "Home", sectionId: "home" },
  { label: "Items", path: "/cakes" },
  { label: "About Us", sectionId: "about" },
  { label: "Contact", sectionId: "contact" },
];

const routeItems = [
  { label: "Custom Cake", path: "/custom" },
  { label: "My Orders", path: "/orders" },
];

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = getUserRole();
  const [activeSection, setActiveSection] = useState(location.hash.replace("#", "") || "home");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.body.classList.add("mobile-nav-open");
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("mobile-nav-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (location.pathname !== "/") {
      return undefined;
    }

    const sectionIds = navItems.filter((item) => item.sectionId).map((item) => item.sectionId);
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!sections.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleEntry) {
          setActiveSection(visibleEntry.target.id);
        }
      },
      {
        threshold: [0.25, 0.5, 0.7],
        rootMargin: "-20% 0px -45% 0px",
      }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname === "/") {
      setActiveSection(location.hash.replace("#", "") || "home");
    }
  }, [location.hash, location.pathname]);

  const goToSection = (sectionId) => {
    if (location.pathname !== "/") {
      navigate(`/#${sectionId}`);
      return;
    }

    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `/#${sectionId}`);
      setActiveSection(sectionId);
    }
  };

  const handleLogoKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      goToSection("home");
    }
  };

  const handleNavigate = (item) => {
    if (item.path) {
      navigate(item.path);
    } else {
      goToSection(item.sectionId);
    }
  };

  const renderNavLinks = (className = "") => (
    <ul className={`nav-links ${className}`}>
      {navItems.map((item) => {
        const isActive = item.path
          ? location.pathname === item.path
          : location.pathname === "/" && activeSection === item.sectionId;

        return (
          <li
            key={item.label}
            className={isActive ? "active" : ""}
            onClick={() => handleNavigate(item)}
          >
            {item.label}
          </li>
        );
      })}

      {routeItems.map((item) => (
        <li
          key={item.label}
          className={location.pathname === item.path ? "active" : ""}
          onClick={() => handleNavigate(item)}
        >
          {item.label}
        </li>
      ))}

      {role === "admin" && (
        <li
          className={location.pathname === "/admin-panel" ? "active" : ""}
          onClick={() => navigate("/admin-panel")}
        >
          Admin
        </li>
      )}
    </ul>
  );

  const renderNavActions = (className = "") => (
    <div className={`nav-icons ${className}`}>
      <button className="icon-button" aria-label="Profile" onClick={() => navigate("/profile")}>
        <FaUser />
      </button>
      <button className="icon-button" aria-label="Cart" onClick={() => navigate("/cart")}>
        <FaShoppingCart />
      </button>
    </div>
  );

  return (
    <div className="navbar">
      <div className="logo" onClick={() => goToSection("home")} onKeyDown={handleLogoKeyDown} role="button" tabIndex={0}>
        <h2>BakeHouse</h2>
        <p>By Rainbow</p>
      </div>

      {renderNavLinks("desktop-links")}
      {renderNavActions("desktop-actions")}

      <div className="mobile-actions" aria-label="Mobile quick actions">
        <button className="icon-button" aria-label="Profile" onClick={() => navigate("/profile")}>
          <FaUser />
        </button>
        <button className="icon-button" aria-label="Cart" onClick={() => navigate("/cart")}>
          <FaShoppingCart />
        </button>
        <button
          className="mobile-menu-toggle"
          type="button"
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-controls="mobile-navigation"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      <button
        className={`nav-backdrop ${isMenuOpen ? "is-open" : ""}`}
        type="button"
        aria-label="Close navigation menu"
        onClick={() => setIsMenuOpen(false)}
      />

      <div id="mobile-navigation" className={`mobile-nav-panel ${isMenuOpen ? "is-open" : ""}`}>
        {renderNavActions("mobile-search-actions")}
        {renderNavLinks("mobile-links")}
      </div>
    </div>
  );
}

export default Navbar;
