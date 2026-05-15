import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import api, { getImageUrl } from "../utils/api";
import "./cart.css";

function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCart = useCallback(async () => {
    try {
      const res = await api.get("/api/cart/");
      setCart(res.data);
    } catch (error) {
      console.error("Error fetching cart", error);
      alert("Unable to load the cart right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const cartTotal = useMemo(() => {
    if (!cart?.items) {
      return 0;
    }

    return cart.items.reduce((total, item) => {
      const price = Number(item.product_detail?.price || 0);
      return total + (price * item.quantity);
    }, 0);
  }, [cart]);

  const handleRemove = async (itemId) => {
    try {
      await api.delete(`/api/cart/${itemId}/`);
      fetchCart();
    } catch (error) {
      console.error("Error removing cart item", error);
      alert("Unable to remove this item from the cart.");
    }
  };

  return (
    <div className="cart-page">
      <Navbar />

      <main className="cart-layout">
        <header className="cart-header">
          <p>Cart</p>
          <h1>Review Your Items</h1>
        </header>

        {loading ? (
          <section className="cart-empty">Loading cart...</section>
        ) : !cart?.items?.length ? (
          <section className="cart-empty">
            <h2>Your cart is empty</h2>
            <p>Add a Item from the items page to continue.</p>
          </section>
        ) : (
          <div className="cart-content">
            <section className="cart-items">
              {cart.items.map((item) => (
                <article className="cart-item" key={item.id}>
                  <div className="cart-item-media">
                    {item.product_detail?.image ? (
                      <img
                        src={getImageUrl(item.product_detail.image)}
                        alt={item.product_detail?.name || "Cake"}
                      />
                    ) : (
                      <div className="cart-item-placeholder">Cake</div>
                    )}
                  </div>

                  <div className="cart-item-body">
                    <h3>{item.product_detail?.name || "Cake"}</h3>
                    <p>{item.product_detail?.description}</p>
                    <div className="cart-item-meta">
                      <span>Qty {item.quantity}</span>
                      <strong>Rs. {(Number(item.product_detail?.price || 0) * item.quantity).toFixed(2)}</strong>
                    </div>
                  </div>

                  <button className="cart-remove" onClick={() => handleRemove(item.id)}>
                    Remove
                  </button>
                </article>
              ))}
            </section>

            <aside className="cart-summary">
              <h2>Before Checkout</h2>
              <p className="cart-summary-copy">
                Review the cart, then continue to the checkout page to confirm contact details,
                address, delivery date, and place the order.
              </p>

              <div className="cart-total">
                <span>Total</span>
                <strong>Rs. {cartTotal.toFixed(2)}</strong>
              </div>

              <button className="checkout-button" onClick={() => navigate("/checkout")}>
                Proceed to Checkout
              </button>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default CartPage;
