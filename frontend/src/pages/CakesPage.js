import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import cakeImg from "../assets/cake.jpg";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import api, { getImageUrl } from "../utils/api";
import { hasSession } from "../utils/session";
import "./cakes.css";

const CATEGORY_LABELS = {
  wedding: "Wedding Cake",
  birthday: "Birthday Cake",
  cupcake: "Cupcake",
  bento: "Bento Cake",
  pastry: "Pastry",
  dessert: "Dessert",
};

const normalizeSearchValue = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function CakesPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("/api/products/");
        setProducts((response.data || []).filter((product) => product.available));
      } catch (error) {
        console.error("Unable to load cakes", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const normalized = normalizeSearchValue(query);

    if (!normalized) {
      return products;
    }

    const queryTokens = normalized.split(" ").filter(Boolean);

    return products.filter((product) => {
      const searchableText = normalizeSearchValue([
        product.name,
        product.category,
        CATEGORY_LABELS[product.category],
        product.description,
        product.price,
      ].join(" "));

      return queryTokens.every((token) => searchableText.includes(token));
    });
  }, [products, query]);

  const handleAddToCart = async (productId) => {
    if (!hasSession()) {
      navigate("/login");
      return;
    }

    try {
      await api.post("/api/cart/", { product: productId, quantity: 1 });
      navigate("/cart");
    } catch (error) {
      console.error("Unable to add cake to cart", error);
      alert("Unable to add this cake right now.");
    }
  };

  return (
    <div className="cakes-page">
      <Navbar />

      <main className="cakes-shell">
        <section className="cakes-hero">
          <div>
            <p>Catalog</p>
            <h1>All Available Items</h1>
            <span>Browse the full cake collection and add any item directly to your cart.</span>
          </div>

          <label className="cakes-search">
            <span>Search Items</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, category, or flavor notes"
            />
          </label>
        </section>

        {loading ? (
          <section className="cakes-empty">Loading cakes...</section>
        ) : filteredProducts.length === 0 ? (
          <section className="cakes-empty">No cakes matched your search.</section>
        ) : (
          <section className="cakes-grid">
            {filteredProducts.map((product) => (
              <article className="cakes-card" key={product.id}>
                <img src={getImageUrl(product.image) || cakeImg} alt={product.name} />
                <div className="cakes-card-body">
                  <div className="cakes-card-copy">
                    <span>{CATEGORY_LABELS[product.category] || product.category}</span>
                    <h2>{product.name}</h2>
                    <p>{product.description}</p>
                  </div>

                  <div className="cakes-card-footer">
                    <strong>Rs. {product.price}</strong>
                    <button type="button" onClick={() => handleAddToCart(product.id)}>
                      Add to Cart
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default CakesPage;
