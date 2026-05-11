import React from "react";
import "./home.css";
import { useNavigate } from "react-router-dom";
import bannerImg from "../assets/banner.jpg";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home">

      <Navbar />

      {/* HERO */}
      <div className="hero"
           style={{ backgroundImage: `url(${bannerImg})` }}
      >
        <div className="hero-text">
          <p className="tag">CELEBRATE LIFE'S SPECIAL MOMENTS</p>

          <div className="hero-overlay">
            <h1>Delicious Cakes</h1>
            <h2>Made With Love ❤</h2>
          </div>

          <p>
            From classic flavors to your unique creations, <br />
            we bake happiness in every bite.
          </p>

          <div className="hero-buttons">

            {/* 🔥 CONNECTED */}
            <button
              className="btn-primary"
              onClick={() => navigate("/custom")}
            >
              Order Now
            </button>

            <button
              className="btn-outline"
              onClick={() => navigate("/custom")}
            >
              Customize Your Cake
            </button>

          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="features">
        <div>🍰 Fresh & Premium</div>
        <div>🚚 On-Time Delivery</div>
        <div>👨‍🍳 Custom Made</div>
        <div>✅ 100% Quality</div>
      </div>

      {/* PRODUCTS */}
      <div className="products">
        <h2>Popular Cakes</h2>

        <div className="product-grid">

          {["Chocolate", "Red Velvet", "Blueberry", "Fruit"].map((item, i) => (
            <div className="card" key={i}>
              <img src="/cake.png" alt="cake" />
              <h4>{item}</h4>
              <p>Rs. 1500</p>

              <button
                onClick={() => navigate("/orders")}
              >
                Add to Cart
              </button>
            </div>
          ))}

        </div>
      </div>

      {/* CTA */}
      <div className="cta">
        <div>
          <h2>Create Your Dream Cake</h2>
          <p>Choose flavor, size and design exactly how you want</p>

          <button onClick={() => navigate("/custom")}>
            Customize Now
          </button>
        </div>
      </div>

      <Footer />

    </div>
  );
}

export default HomePage;