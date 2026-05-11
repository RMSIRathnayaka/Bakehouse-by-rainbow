import React from "react";
import { FaSearch, FaUser, FaShoppingCart } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./navbar.css";

function Navbar() {
  const navigate = useNavigate();

  return (
    <div className="navbar">
      <div className="logo">
        <h2>BakeHouse</h2>
        <p>Make Every Moment Sweeter</p>
      </div>

      <ul className="nav-links">
        <li className="active" onClick={() => navigate("/")}>Home</li>
        <li>Cakes</li>
        <li onClick={() => navigate("/custom")}>Custom Cake</li>
        <li onClick={() => navigate("/orders")}>My Orders</li>
        <li>About Us</li>
        <li>Contact</li>
      </ul>

      <div className="nav-icons">
        <div className="search-box">
          <input placeholder="Search your Item" />
          <FaSearch />
        </div>

        <FaUser className="icon" onClick={() => navigate("/profile")} />
        <FaShoppingCart className="icon" onClick={() => navigate("/orders")} />
      </div>
    </div>
  );
}

export default Navbar;