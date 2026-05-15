import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import api, { getImageUrl } from "../utils/api";
import "./checkout.css";

const DEFAULT_FORM = {
  contact_name: "",
  contact_phone: "",
  contact_address: "",
  delivery_date: "",
  payment_method: "cod",
  notes: "",
};

const PAYMENT_OPTIONS = [
  { value: "cod", label: "Cash on delivery" },
  { value: "pickup", label: "Pickup" },
];

function CheckoutPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cartResponse, profileResponse] = await Promise.all([
          api.get("/api/cart/"),
          api.get("/api/profile/"),
        ]);

        setCart(cartResponse.data);
        setForm((prev) => ({
          ...prev,
          contact_name: profileResponse.data?.full_name || "",
          contact_phone: profileResponse.data?.phone || "",
          contact_address: profileResponse.data?.address || "",
        }));
      } catch (error) {
        console.error("Unable to load checkout data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const total = useMemo(() => {
    if (!cart?.items?.length) {
      return 0;
    }

    return cart.items.reduce((sum, item) => {
      const unitPrice = Number(item.product_detail?.price || 0);
      return sum + (unitPrice * item.quantity);
    }, 0);
  }, [cart]);

  const totalItems = useMemo(
    () => (cart?.items || []).reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.contact_name || !form.contact_phone || !form.contact_address || !form.delivery_date) {
      alert("Please fill contact details and delivery date.");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/api/orders/checkout/", form);
      navigate("/orders");
    } catch (error) {
      console.error("Checkout failed", error);
      alert(JSON.stringify(error.response?.data || { error: "Unable to place order" }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-page">
      <Navbar />

      <main className="checkout-shell">
        <header className="checkout-header">
          <p>Checkout</p>
          <h1>Place Your Order</h1>
        </header>

        {loading ? (
          <section className="checkout-empty">Loading checkout details...</section>
        ) : !cart?.items?.length ? (
          <section className="checkout-empty">
            <h2>Your cart is empty</h2>
            <p>Add cakes first, then return here to place the order.</p>
            <button type="button" onClick={() => navigate("/cakes")}>
              Browse Cakes
            </button>
          </section>
        ) : (
          <div className="checkout-layout">
            <section className="checkout-panel">
              <div className="checkout-panel-title">
                <div>
                  <span>Delivery Details</span>
                  <h2>Contact Information</h2>
                </div>
                <button type="button" className="secondary-line" onClick={() => navigate("/cart")}>
                  Back to Cart
                </button>
              </div>

              <form className="checkout-form-page" onSubmit={handleSubmit}>
                <div className="checkout-grid">
                  <label>
                    <span>Full Name</span>
                    <input name="contact_name" value={form.contact_name} onChange={handleChange} />
                  </label>

                  <label>
                    <span>Telephone</span>
                    <input name="contact_phone" value={form.contact_phone} onChange={handleChange} />
                  </label>

                  <label className="field-wide">
                    <span>Address</span>
                    <textarea name="contact_address" value={form.contact_address} onChange={handleChange} />
                  </label>

                  <label>
                    <span>Delivery Date</span>
                    <input
                      type="date"
                      name="delivery_date"
                      value={form.delivery_date}
                      min={new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                      onChange={handleChange}
                    />
                  </label>

                  <label>
                    <span>Payment Method</span>
                    <select name="payment_method" value={form.payment_method} onChange={handleChange}>
                      {PAYMENT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="field-wide">
                    <span>Order Notes</span>
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      placeholder="Delivery note, landmark, or extra instructions"
                    />
                  </label>
                </div>

                <button className="checkout-submit" disabled={submitting} type="submit">
                  {submitting ? "Placing Order..." : "Place Order"}
                </button>
              </form>
            </section>

            <aside className="checkout-summary">
              <div className="checkout-panel-title">
                <div>
                  <span>Summary</span>
                  <h2>{totalItems} Item(s)</h2>
                </div>
              </div>

              <div className="checkout-summary-items">
                {cart.items.map((item) => (
                  <article className="checkout-item" key={item.id}>
                    <img src={getImageUrl(item.product_detail?.image)} alt={item.product_detail?.name || "Cake"} />
                    <div>
                      <strong>{item.product_detail?.name}</strong>
                      <span>Qty {item.quantity}</span>
                    </div>
                    <strong>Rs. {(Number(item.product_detail?.price || 0) * item.quantity).toFixed(2)}</strong>
                  </article>
                ))}
              </div>

              <div className="checkout-total">
                <span>Total</span>
                <strong>Rs. {total.toFixed(2)}</strong>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default CheckoutPage;
