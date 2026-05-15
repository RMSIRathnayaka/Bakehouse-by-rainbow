import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaBars,
  FaBoxOpen,
  FaClipboardList,
  FaEnvelope,
  FaHome,
  FaSignOutAlt,
  FaSyncAlt,
  FaTimes,
  FaUserShield,
  FaUsers,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api, { getImageUrl } from "../utils/api";
import { clearSession, getDisplayName } from "../utils/session";
import "./admin.css";

const tabs = [
  { id: "overview", label: "Overview", icon: FaHome },
  { id: "cakes", label: "Cake Catalog", icon: FaBoxOpen },
  { id: "orders", label: "Orders", icon: FaClipboardList },
  { id: "custom", label: "Custom Orders", icon: FaUserShield },
  { id: "users", label: "Users", icon: FaUsers },
  { id: "contacts", label: "Contacts", icon: FaEnvelope },
];

const orderStatuses = ["pending", "processing", "completed", "cancelled"];
const paymentStatuses = ["pending", "success", "failed", "refunded"];
const paymentMethodLabels = {
  cod: "Cash on delivery",
  pickup: "Pickup",
  online: "Online payment",
};

function AdminPanelPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboard, setDashboard] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customOrders, setCustomOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [previewImage, setPreviewImage] = useState("");
  const [error, setError] = useState("");
  const [editingProductId, setEditingProductId] = useState(null);
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(true);
  const [productForm, setProductForm] = useState({
    name: "",
    category: "birthday",
    description: "",
    price: "",
    available: true,
    image: null,
  });

  const displayName = getDisplayName();
  const activeTabMeta = tabs.find((tab) => tab.id === activeTab);
  const ActiveTabIcon = activeTabMeta?.icon || FaHome;
  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(new Date()),
    []
  );

  const statusLabel = (value) => (value || "pending").replaceAll("_", " ");
  const paymentMethodLabel = (value) => paymentMethodLabels[value] || statusLabel(value);

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm({
      name: "",
      category: "birthday",
      description: "",
      price: "",
      available: true,
      image: null,
    });
  };

  const fetchAdminData = useCallback(async () => {
    try {
      setError("");
      const [dashboardRes, productsRes, ordersRes, customOrdersRes, usersRes, contactsRes] = await Promise.all([
        api.get("/api/admin/dashboard/"),
        api.get("/api/products/"),
        api.get("/api/admin/orders/"),
        api.get("/api/admin/custom-cakes/"),
        api.get("/api/admin/users/"),
        api.get("/api/contacts/"),
      ]);
      setDashboard(dashboardRes.data);
      setProducts(productsRes.data || []);
      setOrders(ordersRes.data || []);
      setCustomOrders(customOrdersRes.data || []);
      setUsers(usersRes.data || []);
      setContacts(contactsRes.data || []);
    } catch (err) {
      console.error("Admin data load failed", err);
      setError("Unable to load admin data. Check your admin role and backend connection.");
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const metrics = useMemo(() => {
    if (!dashboard) return [];
    return [
      ["Products", dashboard.total_products],
      ["Orders", dashboard.total_orders],
      ["Pending Orders", dashboard.pending_orders],
      ["Paid Orders", dashboard.paid_orders],
      ["Custom Orders", dashboard.custom_orders],
      ["Contacts", dashboard.contact_messages],
      ["Customers", dashboard.customers],
    ];
  }, [dashboard]);

  const overviewBarData = useMemo(
    () => [
      { label: "Orders", value: orders.length },
      { label: "Custom", value: customOrders.length },
      { label: "Products", value: products.length },
      { label: "Users", value: users.length },
    ],
    [orders.length, customOrders.length, products.length, users.length]
  );

  const overviewPieData = useMemo(() => {
    const statusCounts = {
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
    };
    orders.forEach((order) => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    customOrders.forEach((order) => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    return [
      { label: "Pending", value: statusCounts.pending, color: "#c98b37" },
      { label: "Processing", value: statusCounts.processing, color: "#8f2f55" },
      { label: "Completed", value: statusCounts.completed, color: "#2f7a53" },
      { label: "Cancelled", value: statusCounts.cancelled, color: "#9b352d" },
    ];
  }, [orders, customOrders]);

  const getPieSegments = (data) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (!total) return [];

    let cumulative = 0;
    return data.map((item) => {
      const start = cumulative / total;
      cumulative += item.value;
      const end = cumulative / total;
      const largeArc = end - start > 0.5 ? 1 : 0;
      const x1 = 50 + 42 * Math.cos(2 * Math.PI * start - Math.PI / 2);
      const y1 = 50 + 42 * Math.sin(2 * Math.PI * start - Math.PI / 2);
      const x2 = 50 + 42 * Math.cos(2 * Math.PI * end - Math.PI / 2);
      const y2 = 50 + 42 * Math.sin(2 * Math.PI * end - Math.PI / 2);
      return {
        ...item,
        d: `M 50 50 L ${x1} ${y1} A 42 42 0 ${largeArc} 1 ${x2} ${y2} Z`,
      };
    });
  };

  const patchResource = async (url, payload) => {
    try {
      setError("");
      await api.patch(url, payload);
      fetchAdminData();
    } catch (err) {
      console.error("Admin update failed", err);
      alert(JSON.stringify(err.response?.data || { error: "Update failed" }));
    }
  };

  const deleteProduct = async (id) => {
    try {
      setError("");
      await api.delete(`/api/products/${id}/`);
      fetchAdminData();
      if (editingProductId === id) resetProductForm();
    } catch (err) {
      console.error("Product delete failed", err);
      alert("Unable to delete this cake.");
    }
  };

  const upsertProduct = async (event) => {
    event.preventDefault();
    const data = new FormData();
    data.append("name", productForm.name);
    data.append("category", productForm.category);
    data.append("description", productForm.description);
    data.append("price", productForm.price);
    data.append("available", String(productForm.available));
    if (productForm.image) {
      data.append("image", productForm.image);
    }

    try {
      setError("");
      const config = { headers: { "Content-Type": "multipart/form-data" } };

      if (editingProductId) {
        await api.patch(`/api/products/${editingProductId}/`, data, config);
      } else {
        if (!productForm.image) {
          alert("Please upload an image for this cake.");
          return;
        }
        await api.post("/api/products/", data, config);
      }

      resetProductForm();
      event.target.reset();
      fetchAdminData();
    } catch (err) {
      console.error("Product save failed", err);
      alert(JSON.stringify(err.response?.data || { error: "Cake save failed" }));
    }
  };

  const startEditProduct = (product) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name || "",
      category: product.category || "birthday",
      description: product.description || "",
      price: product.price || "",
      available: Boolean(product.available),
      image: null,
    });
  };

  const updateProductForm = (event) => {
    const { name, value, type, checked, files } = event.target;
    setProductForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : files ? files[0] : value,
    }));
  };

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  const EmptyState = ({ label }) => (
    <div className="admin-empty">
      <strong>No data found</strong>
      <span>{`There are no ${label} to display right now.`}</span>
    </div>
  );

  return (
    <div className={`admin-dashboard ${isMenuCollapsed ? "menu-collapsed" : ""}`}>
      <aside className={`admin-sidebar ${isMenuCollapsed ? "is-collapsed" : ""}`}>
        <div>
          <div className="admin-menu-head">
            <div className="admin-brand">
              <p>Back Office</p>
              <h1>BakeHouse</h1>
              <span>Catalog, orders, customers, payments, and enquiries.</span>
            </div>

            <button
              className="admin-menu-toggle"
              type="button"
              aria-label={isMenuCollapsed ? "Expand admin menu" : "Collapse admin menu"}
              aria-expanded={!isMenuCollapsed}
              onClick={() => setIsMenuCollapsed((prev) => !prev)}
            >
              {isMenuCollapsed ? <FaBars /> : <FaTimes />}
            </button>
          </div>

          <nav className="admin-nav">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={activeTab === tab.id ? "active" : ""}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                  title={tab.label}
                >
                  <Icon />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="admin-sidebar-footer">
          <button className="secondary danger" onClick={handleLogout} type="button" title="Logout">
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-title">
            <div className="admin-topbar-icon" aria-hidden="true">
              <ActiveTabIcon />
            </div>
            <div>
              <p>Operations Dashboard</p>
              <h2>{activeTabMeta?.label || "Overview"}</h2>
            </div>
          </div>

          <div className="admin-topbar-actions">
            <div className="admin-header-chips" aria-label="Dashboard status">
              <span>{todayLabel}</span>
              <span>{dashboard ? "Live data" : "Loading"}</span>
            </div>

            <button className="admin-refresh-button" type="button" onClick={fetchAdminData}>
              <FaSyncAlt />
              <span>Refresh</span>
            </button>

            <div className="admin-user-pill">
              <div className="admin-user-avatar" aria-hidden="true">
                {(displayName || "A").charAt(0).toUpperCase()}
              </div>
              <div className="admin-user-copy">
                <span>Admin</span>
                <strong>{displayName}</strong>
              </div>
            </div>
          </div>
        </header>

        <main className="admin-shell">
          {error && <div className="admin-error">{error}</div>}

          {activeTab === "overview" && (
            <section className="admin-overview">
              <div className="admin-grid">
                {metrics.map(([label, value]) => (
                  <article className="admin-metric" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </article>
                ))}
              </div>

              <div className="admin-insight-grid">
                <article className="admin-panel">
                  <div className="admin-panel-title">
                    <div>
                      <span>Volume</span>
                      <h3>Operational Load</h3>
                    </div>
                  </div>
                  <div className="admin-bar-chart">
                    {overviewBarData.map((item) => {
                      const max = Math.max(...overviewBarData.map((d) => d.value), 1);
                      const pct = (item.value / max) * 100;
                      return (
                        <div className="admin-bar-row" key={item.label}>
                          <span>{item.label}</span>
                          <div className="admin-bar-track">
                            <div className="admin-bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <strong>{item.value}</strong>
                        </div>
                      );
                    })}
                  </div>
                </article>

                <article className="admin-panel">
                  <div className="admin-panel-title">
                    <div>
                      <span>Status Split</span>
                      <h3>Orders + Custom</h3>
                    </div>
                  </div>
                  <div className="admin-pie-wrap">
                    <svg viewBox="0 0 100 100" className="admin-pie-chart" aria-label="Status pie chart">
                      {getPieSegments(overviewPieData).map((segment) => (
                        <path key={segment.label} d={segment.d} fill={segment.color} />
                      ))}
                      <circle cx="50" cy="50" r="20" fill="#fff" />
                    </svg>
                    <div className="admin-pie-legend">
                      {overviewPieData.map((item) => (
                        <div key={item.label} className="admin-legend-row">
                          <span className="admin-legend-dot" style={{ background: item.color }} />
                          <span>{item.label}</span>
                          <strong>{item.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              </div>
            </section>
          )}

          {activeTab === "cakes" && (
            <section className="admin-workspace admin-workspace-split">
              <form className="admin-form" onSubmit={upsertProduct}>
                <div className="admin-panel-title compact">
                  <div>
                    <span>Catalog</span>
                    <h3>{editingProductId ? "Edit Cake" : "Add Cake"}</h3>
                  </div>
                </div>
                <input name="name" placeholder="Cake name" value={productForm.name} onChange={updateProductForm} />
                <select name="category" onChange={updateProductForm} value={productForm.category}>
                  <option value="wedding">Wedding Cake</option>
                  <option value="birthday">Birthday Cake</option>
                  <option value="cupcake">Cupcake</option>
                  <option value="bento">Bento Cake</option>
                  <option value="pastry">Pastry</option>
                  <option value="dessert">Dessert</option>
                </select>
                <input name="price" placeholder="Price" value={productForm.price} onChange={updateProductForm} />
                <textarea name="description" placeholder="Description" value={productForm.description} onChange={updateProductForm} />
                <input name="image" type="file" accept="image/*" onChange={updateProductForm} />
                <label className="admin-check">
                  <input name="available" type="checkbox" checked={productForm.available} onChange={updateProductForm} />
                  Available in storefront
                </label>
                <button type="submit">{editingProductId ? "Update Cake" : "Create Cake"}</button>
                {editingProductId && (
                  <button className="secondary-line" type="button" onClick={resetProductForm}>
                    Cancel Edit
                  </button>
                )}
              </form>

              <div className="admin-panel">
                <div className="admin-panel-title">
                  <div>
                    <span>{products.length} records</span>
                    <h3>Cake Catalog</h3>
                  </div>
                </div>
                <div className="admin-table cakes-table">
                  <div className="admin-table-header">
                    <span>Cake</span>
                    <span>Category</span>
                    <span>Price</span>
                    <span>Visibility</span>
                    <span>Actions</span>
                  </div>
                  {products.map((product) => (
                    <div className="admin-table-row" key={product.id}>
                      <div className="admin-product-cell">
                        {product.image && (
                          <img src={getImageUrl(product.image)} alt={product.name} className="admin-thumb" />
                        )}
                        <div className="admin-stack">
                          <strong>{product.name}</strong>
                          <span>{product.description}</span>
                        </div>
                      </div>
                      <span>{product.category}</span>
                      <span>Rs. {product.price}</span>
                      <select
                        value={product.available ? "true" : "false"}
                        onChange={(event) => patchResource(`/api/products/${product.id}/`, {
                          available: event.target.value === "true",
                        })}
                      >
                        <option value="true">Available</option>
                        <option value="false">Hidden</option>
                      </select>
                      <div className="admin-action-group">
                        <button className="secondary-line" type="button" onClick={() => startEditProduct(product)}>
                          Edit
                        </button>
                        <button className="danger-button" onClick={() => deleteProduct(product.id)} type="button">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {!products.length && <EmptyState label="cakes" />}
              </div>
            </section>
          )}

          {activeTab === "orders" && (
            <section className="admin-panel">
              <div className="admin-panel-title">
                <div>
                  <span>{orders.length} records</span>
                  <h3>Order Management</h3>
                </div>
              </div>
              <div className="admin-table orders-table">
                <div className="admin-table-header">
                  <span>Order</span>
                  <span>Customer</span>
                  <span>Items</span>
                  <span>Summary</span>
                  <span>Status</span>
                  <span>Payment</span>
                </div>
                {orders.map((order) => (
                  <div className="admin-table-row" key={order.id}>
                    <div className="admin-stack">
                      <strong>#{order.id}</strong>
                      <span>Placed: {order.created_at?.slice(0, 10) || order.order_date}</span>
                      <span>Delivery: {order.delivery_date}</span>
                      <span>Method: {paymentMethodLabel(order.payment_method)}</span>
                    </div>
                    <div className="admin-stack">
                      <strong>{order.customer_name}</strong>
                      <span>{order.customer_email}</span>
                      <span>{order.customer_phone || "No phone"}</span>
                      <span>{order.customer_address || "No address"}</span>
                    </div>
                    <div className="admin-order-items">
                      {(order.items || []).map((item) => (
                        <div className="admin-inline-item" key={item.id}>
                          {item.product_image && (
                            <img src={getImageUrl(item.product_image)} alt={item.product_name} className="admin-mini-thumb" />
                          )}
                          <span>{item.product_name} x {item.quantity} (Rs. {item.line_total})</span>
                        </div>
                      ))}
                    </div>
                    <div className="admin-stack">
                      <strong>Rs. {order.total_amount}</strong>
                      <span>{order.total_items} item(s)</span>
                      <span>Notes: {order.notes || "None"}</span>
                    </div>
                    <select
                      value={order.status}
                      onChange={(event) => patchResource(`/api/admin/orders/${order.id}/`, {
                        status: event.target.value,
                      })}
                    >
                      {orderStatuses.map((status) => (
                        <option key={status} value={status}>{statusLabel(status)}</option>
                      ))}
                    </select>
                    <select
                      value={order.payment_status}
                      onChange={(event) => patchResource(`/api/admin/orders/${order.id}/`, {
                        payment_status: event.target.value,
                      })}
                    >
                      {paymentStatuses.map((status) => (
                        <option key={status} value={status}>{statusLabel(status)}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              {!orders.length && <EmptyState label="orders" />}
            </section>
          )}

          {activeTab === "custom" && (
            <section className="admin-panel">
              <div className="admin-panel-title">
                <div>
                  <span>{customOrders.length} records</span>
                  <h3>Custom Cake Requests</h3>
                </div>
              </div>
              <div className="admin-table custom-table">
                <div className="admin-table-header">
                  <span>Request</span>
                  <span>Customer</span>
                  <span>Image</span>
                  <span>Details</span>
                  <span>Status</span>
                  <span>Payment</span>
                </div>
                {customOrders.map((order) => (
                  <div className="admin-table-row" key={order.id}>
                    <div className="admin-stack">
                      <strong>#{order.id} {order.occasion}</strong>
                      <span>Placed: {order.created_at?.slice(0, 10) || "-"}</span>
                      <span>Delivery: {order.delivery_date}</span>
                      <span>{order.message || "No cake message"}</span>
                    </div>
                    <div className="admin-stack">
                      <strong>{order.customer_name || "Customer"}</strong>
                      <span>{order.customer_email}</span>
                      <span>{order.customer_phone || "No phone"}</span>
                      <span>{order.customer_address || "No address"}</span>
                    </div>
                    <div>
                      {order.image ? (
                        <img
                          src={getImageUrl(order.image)}
                          alt="Custom cake request"
                          className="admin-thumb admin-thumb-clickable"
                          onClick={() => setPreviewImage(getImageUrl(order.image))}
                        />
                      ) : (
                        <span>No image</span>
                      )}
                    </div>
                    <div className="admin-stack">
                      <span>Flavor: {order.flavor}</span>
                      <span>Size: {order.cake_size} | Qty: {order.quantity}</span>
                      <span>Color: {order.color} | Shape: {order.shape}</span>
                      <span>{order.special_instructions || "No special instructions"}</span>
                    </div>
                    <select
                      value={order.status}
                      onChange={(event) => patchResource(`/api/admin/custom-cakes/${order.id}/`, {
                        status: event.target.value,
                      })}
                    >
                      {orderStatuses.map((status) => (
                        <option key={status} value={status}>{statusLabel(status)}</option>
                      ))}
                    </select>
                    <select
                      value={order.payment_status}
                      onChange={(event) => patchResource(`/api/admin/custom-cakes/${order.id}/`, {
                        payment_status: event.target.value,
                      })}
                    >
                      {paymentStatuses.map((status) => (
                        <option key={status} value={status}>{statusLabel(status)}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              {!customOrders.length && <EmptyState label="custom orders" />}
            </section>
          )}

          {activeTab === "users" && (
            <section className="admin-panel">
              <div className="admin-panel-title">
                <div>
                  <span>{users.length} records</span>
                  <h3>Users</h3>
                </div>
              </div>
              <div className="admin-table users-table">
                <div className="admin-table-header">
                  <span>User</span>
                  <span>Email</span>
                  <span>Phone</span>
                  <span>Role</span>
                  <span>Access</span>
                </div>
                {users.map((user) => (
                  <div className="admin-table-row" key={user.id}>
                    <div className="admin-stack">
                      <strong>{user.display_name}</strong>
                      <span>Joined: {user.date_joined?.slice(0, 10)}</span>
                    </div>
                    <span>{user.email}</span>
                    <div className="admin-stack">
                      <span>{user.phone || "No phone"}</span>
                      <span>{user.address || "No address"}</span>
                    </div>
                    <span className={`status-pill ${user.role}`}>{statusLabel(user.role)}</span>
                    <select
                      value={user.is_active ? "true" : "false"}
                      onChange={(event) => patchResource(`/api/admin/users/${user.id}/`, {
                        is_active: event.target.value === "true",
                      })}
                    >
                      <option value="true">Active</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                ))}
              </div>
              {!users.length && <EmptyState label="users" />}
            </section>
          )}

          {activeTab === "contacts" && (
            <section className="admin-panel">
              <div className="admin-panel-title">
                <div>
                  <span>{contacts.length} records</span>
                  <h3>Contact Messages</h3>
                </div>
              </div>
              <div className="admin-table contacts-table">
                <div className="admin-table-header">
                  <span>Subject</span>
                  <span>Customer</span>
                  <span>Message</span>
                  <span>Status</span>
                </div>
                {contacts.map((contact) => (
                  <div className="admin-table-row" key={contact.id}>
                    <div className="admin-stack">
                      <strong>{contact.subject}</strong>
                      <span>{contact.created_at?.slice(0, 10)}</span>
                    </div>
                    <div className="admin-stack">
                      <strong>{contact.name}</strong>
                      <span>{contact.email}</span>
                      <span>{contact.phone || "No phone"}</span>
                    </div>
                    <span>{contact.message}</span>
                    <select
                      value={contact.status}
                      onChange={(event) => patchResource(`/api/contacts/${contact.id}/`, {
                        status: event.target.value,
                      })}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                ))}
              </div>
              {!contacts.length && <EmptyState label="messages" />}
            </section>
          )}
        </main>
      </section>
      {previewImage && (
        <div className="admin-image-modal" onClick={() => setPreviewImage("")}>
          <div className="admin-image-modal-content" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="admin-image-close" onClick={() => setPreviewImage("")}>
              Close
            </button>
            <img src={previewImage} alt="Custom order preview" />
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanelPage;
