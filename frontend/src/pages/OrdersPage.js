import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./orders.css";
import { useNavigate } from "react-router-dom";

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access");

    if (!token) {
      alert("Please login first");
      navigate("/login");
      return;
    }

    // 🔥 MOVED INSIDE useEffect (fixes warning)
    const fetchOrders = async () => {
      try {
        const res = await axios.get(
          "http://127.0.0.1:8000/api/orders/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Orders response:", res.data);

        setOrders(res.data);

      } catch (err) {
        console.error("Error fetching orders:", err);

        if (err.response) {
          console.log("Backend error:", err.response.data);

          if (err.response.status === 401) {
            alert("Session expired. Please login again.");
            navigate("/login");
          }
        }
      }
    };

    fetchOrders();

  }, [navigate]);

  return (
    <>
      <Navbar />

      <div className="orders-page">
        <h2 className="title">My Orders</h2>

        {orders.length === 0 ? (
          <p className="empty">No orders yet 😔</p>
        ) : (
          <div className="orders-grid">

            {orders.map((order) => (
              <div className="order-card" key={order.id}>

                {/* HEADER */}
                <div className="order-header">
                  <h3>Order #{order.id}</h3>
                  <span className="status pending">Pending</span>
                </div>

                {/* DATES */}
                <div className="order-info">
                  <p><strong>Order Date:</strong> {order.order_date}</p>

                  {order.delivery_date && (
                    <p className="delivery">
                      <strong>Delivery:</strong> {order.delivery_date}
                    </p>
                  )}

                  <p><strong>Payment:</strong> {order.payment_method}</p>
                </div>

                {/* ITEMS */}
                <div className="items">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, i) => (
                      <div className="item" key={i}>
                        <span>{item.product?.name || "Cake"}</span>
                        <span className="qty">x{item.quantity}</span>
                      </div>
                    ))
                  ) : (
                    <p>No items found</p>
                  )}
                </div>

              </div>
            ))}

          </div>
        )}
      </div>

      <Footer />
    </>
  );
}

export default OrdersPage;