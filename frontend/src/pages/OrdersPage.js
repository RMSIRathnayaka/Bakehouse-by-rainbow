import React, { useEffect, useState } from "react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import api, { getImageUrl } from "../utils/api";
import "./orders.css";

const PAYMENT_LABELS = {
  cod: "Cash on delivery",
  pickup: "Pickup",
  online: "Online payment",
};

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [customOrders, setCustomOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const [ordersRes, customRes] = await Promise.all([
          api.get("/api/orders/"),
          api.get("/api/custom-cakes/"),
        ]);

        setOrders(ordersRes.data || []);
        setCustomOrders(customRes.data || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
  }, []);

  const statusLabel = (value) => (value || "pending").replaceAll("_", " ");
  const paymentLabel = (value) => PAYMENT_LABELS[value] || statusLabel(value);
  const hasAnyOrder = orders.length > 0 || customOrders.length > 0;

  return (
    <>
      <Navbar />

      <main className="orders-page">
        <header className="orders-header">
          <p>Order history</p>
          <h1>My Orders</h1>
        </header>

        {!hasAnyOrder ? (
          <section className="empty-state">
            <h2>No orders yet</h2>
            <p>Your submitted item orders and custom requests will appear here.</p>
          </section>
        ) : (
          <>
            <section className="orders-section">
              <h2>Standard Orders</h2>
              {orders.length === 0 ? (
                <p className="section-empty">No standard checkout orders yet.</p>
              ) : (
                <div className="orders-grid">
                  {orders.map((order) => (
                    <article className="order-card" key={`std-${order.id}`}>
                      <div className="order-header">
                        <div>
                          <span>Order</span>
                          <h3>#{order.id}</h3>
                        </div>
                        <span className={`status ${order.status}`}>{statusLabel(order.status)}</span>
                      </div>

                      <div className="order-info">
                        <p><strong>Placed:</strong> {order.created_at?.slice(0, 10) || order.order_date}</p>
                        <p className="delivery"><strong>Delivery:</strong> {order.delivery_date}</p>
                        <p><strong>Contact:</strong> {order.customer_name}</p>
                        <p><strong>Telephone:</strong> {order.customer_phone}</p>
                        <p><strong>Address:</strong> {order.customer_address}</p>
                        <p><strong>Email:</strong> {order.customer_email}</p>
                        <p><strong>Payment:</strong> {paymentLabel(order.payment_method)}</p>
                        <p><strong>Payment Status:</strong> {statusLabel(order.payment_status)}</p>
                        <p><strong>Total:</strong> Rs. {order.total_amount || 0}</p>
                        <p><strong>Notes:</strong> {order.notes || "None"}</p>
                      </div>

                      <div className="items">
                        {order.items?.length ? (
                          order.items.map((item) => (
                            <div className="item" key={item.id}>
                              <span>{item.product_name || item.product_detail?.name || "Cake"} x{item.quantity}</span>
                              <span className="qty">Rs. {item.line_total || item.unit_price || 0}</span>
                            </div>
                          ))
                        ) : (
                          <p>No items found</p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="orders-section">
              <h2>Custom Cake Orders</h2>
              {customOrders.length === 0 ? (
                <p className="section-empty">No custom cake requests yet.</p>
              ) : (
                <div className="orders-grid">
                  {customOrders.map((order) => (
                    <article className="order-card" key={`custom-${order.id}`}>
                      <div className="order-header">
                        <div>
                          <span>Custom Request</span>
                          <h3>#{order.id}</h3>
                        </div>
                        <span className={`status ${order.status}`}>{statusLabel(order.status)}</span>
                      </div>

                      {order.image && (
                        <img className="custom-order-image" src={getImageUrl(order.image)} alt="Custom cake" />
                      )}

                      <div className="order-info">
                        <p><strong>Placed:</strong> {order.created_at?.slice(0, 10) || "-"}</p>
                        <p><strong>Occasion:</strong> {order.occasion}</p>
                        <p><strong>Flavor:</strong> {order.flavor}</p>
                        <p><strong>Size:</strong> {order.cake_size}</p>
                        <p><strong>Quantity:</strong> {order.quantity}</p>
                        <p className="delivery"><strong>Delivery:</strong> {order.delivery_date}</p>
                        <p><strong>Contact:</strong> {order.customer_name}</p>
                        <p><strong>Telephone:</strong> {order.customer_phone}</p>
                        <p><strong>Address:</strong> {order.customer_address}</p>
                        <p><strong>Email:</strong> {order.customer_email}</p>
                        <p><strong>Payment Status:</strong> {statusLabel(order.payment_status)}</p>
                      </div>

                      <div className="items">
                        <p><strong>Design:</strong> {order.color} | {order.shape}</p>
                        <p><strong>Message:</strong> {order.message || "None"}</p>
                        <p><strong>Special Instructions:</strong> {order.special_instructions || "None"}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <Footer />
    </>
  );
}

export default OrdersPage;
