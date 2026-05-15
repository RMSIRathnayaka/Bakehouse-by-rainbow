import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import bannerImg from "../assets/banner.jpg";
import cakeImg from "../assets/cake.jpg";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import api, { getImageUrl } from "../utils/api";
import { hasSession } from "../utils/session";
import "./home.css";

function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [contactSent, setContactSent] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/api/products/");
        setProducts((res.data || []).filter((product) => product.available));
      } catch (error) {
        console.error("Error fetching products", error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (!location.hash) {
      return undefined;
    }

    const sectionId = location.hash.replace("#", "");
    const timer = window.setTimeout(() => {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 80);

    return () => window.clearTimeout(timer);
  }, [location.hash]);

  const popularProducts = products.slice(0, 4);

  const handleAddToCart = async (productId) => {
    if (!hasSession()) {
      alert("Please login to add items to your cart.");
      navigate("/login");
      return;
    }

    try {
      await api.post("/api/cart/", { product: productId, quantity: 1 });
      navigate("/cart");
    } catch (error) {
      console.error("Error adding item to cart", error);
      alert("Unable to add this cake to the cart right now.");
    }
  };

  const handleContactChange = (event) => {
    const { name, value } = event.target;
    setContactForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();

    try {
      await api.post("/api/contacts/", contactForm);
      setContactSent(true);
      setContactForm({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("Contact submit failed", error);
      alert("Unable to send your message right now.");
    }
  };

  return (
    <div className="home">
      <Navbar />

      <section className="hero" id="home" style={{ backgroundImage: `url(${bannerImg})` }}>
        <div className="hero-text">
          <p className="tag">CELEBRATE LIFE'S SPECIAL MOMENTS</p>

          <div className="hero-overlay">
            <h1>BakeHouse Cakes</h1>
            <h2>Made with craft, delivered with care</h2>
          </div>

          <p>
            Signature celebration cakes, custom designs, and fresh bakes for the
            moments that matter.
          </p>

          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => navigate("/cakes")}>
              Order Cakes
            </button>

            <button className="btn-outline" onClick={() => navigate("/custom")}>
              Customize Your Cake
            </button>
          </div>
        </div>
      </section>

      <section className="features">
        <div>
          <span>Fresh</span>
          <strong>Premium ingredients</strong>
        </div>
        <div>
          <span>Reliable</span>
          <strong>On-time delivery</strong>
        </div>
        <div>
          <span>Custom</span>
          <strong>Made to order</strong>
        </div>
        <div>
          <span>Quality</span>
          <strong>Finished by hand</strong>
        </div>
      </section>

      <section className="products" id="cakes">
        <div className="section-heading">
          <p>Customer favourites</p>
          <h2>Popular Items</h2>
        </div>

        {loadingProducts ? (
          <div className="products-empty">Loading products...</div>
        ) : popularProducts.length === 0 ? (
          <div className="products-empty">No cakes are available yet.</div>
        ) : (
          <>
            <div className="product-grid">
              {popularProducts.map((item) => (
                <article className="product-card" key={item.id}>
                  <img src={getImageUrl(item.image) || cakeImg} alt={`${item.name} cake`} />
                  <div className="product-card-body">
                    <h4>{item.name}</h4>
                    <p>{item.description}</p>
                    <strong>Rs. {item.price}</strong>
                  </div>

                  <button onClick={() => handleAddToCart(item.id)}>Add to Cart</button>
                </article>
              ))}
            </div>

            <div className="products-action">
              <button className="btn-outline" onClick={() => navigate("/cakes")}>
                View All Items
              </button>
            </div>
          </>
        )}
      </section>

      <section className="about-section" id="about">
        <div className="about-copy">
          <p>About BakeHouse</p>
          <h2>Designed for celebrations, built around consistency.</h2>
          <p className="about-text">
            We focus on clean flavors, dependable finishing, and custom work that
            translates well from idea to delivered cake. Every order is prepared
            with a balance of presentation, timing, and practical service.
          </p>
        </div>
        <div className="about-metrics">
          <div>
            <strong>Custom-first</strong>
            <span>Structured for bespoke orders and event cakes.</span>
          </div>
          <div>
            <strong>Reliable workflow</strong>
            <span>Capacity-aware ordering keeps delivery dates manageable.</span>
          </div>
          <div>
            <strong>Clear service</strong>
            <span>Profiles, orders, and cart flows are built for repeat customers.</span>
          </div>
        </div>
      </section>

      <section className="cta">
        <div>
          <h2>Create Your Dream Cake</h2>
          <p>Choose flavor, size and design exactly how you want</p>

          <button onClick={() => navigate("/custom")}>Customize Now</button>
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="contact-panel">
          <p>Contact</p>
          <h2>Talk to the bakery team</h2>
          <div className="contact-grid">
            <div>
              <strong>Phone</strong>
              <span>+94 71 710 0135</span>
            </div>
            <div>
              <strong>Email</strong>
              <span>info@bakehouse.com</span>
            </div>
            <div>
              <strong>Location</strong>
              <span>Circular Road, Badulla, Sri Lanka</span>
            </div>
          </div>
        </div>
        <form className="contact-form" onSubmit={handleContactSubmit}>
          {contactSent && <div className="contact-success">Message received. We will review it soon.</div>}
          <input name="name" placeholder="Your name" value={contactForm.name} onChange={handleContactChange} required />
          <input name="email" type="email" placeholder="Email address" value={contactForm.email} onChange={handleContactChange} required />
          <input name="phone" placeholder="Phone number" value={contactForm.phone} onChange={handleContactChange} />
          <input name="subject" placeholder="Subject" value={contactForm.subject} onChange={handleContactChange} required />
          <textarea name="message" placeholder="Message" value={contactForm.message} onChange={handleContactChange} required />
          <button>Send Message</button>
        </form>
      </section>

      <Footer />
    </div>
  );
}

export default HomePage;
