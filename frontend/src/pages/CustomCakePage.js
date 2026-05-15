import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import api from "../utils/api";
import { clearSession, getDisplayName } from "../utils/session";
import "./datepicker.css";
import "./customcake.css";

const DEFAULT_FORM = {
  contact_name: "",
  contact_phone: "",
  contact_address: "",
  occasion: "",
  cake_size: "",
  flavor: "",
  color: "",
  shape: "",
  quantity: "",
  message: "",
  special_instructions: "",
  delivery_date: "",
};

const OCCASION_OPTIONS = ["Birthday", "Anniversary", "Other"];
const SIZE_OPTIONS = ["500g", "1kg", "2kg", "3kg"];
const FLAVOR_OPTIONS = ["Butter cake", "Chocolate", "Coffee", "Red velvet"];
const SHAPE_OPTIONS = ["Round", "Square", "Heart shape", "Rectangle", "Other"];

function CustomCakePage() {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [success, setSuccess] = useState(false);
  const [bookedDates, setBookedDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const displayName = getDisplayName();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        const [datesResponse, profileResponse] = await Promise.all([
          api.get("/api/custom-cakes/booked_dates/"),
          api.get("/api/profile/"),
        ]);

        setBookedDates((datesResponse.data || []).map((value) => new Date(value)));
        setFormData((prev) => ({
          ...prev,
          contact_name: profileResponse.data?.full_name || "",
          contact_phone: profileResponse.data?.phone || "",
          contact_address: profileResponse.data?.address || "",
        }));
      } catch (error) {
        console.error("Unable to load custom cake form data", error);
      }
    };

    fetchPageData();
  }, []);

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  const handleDateChange = (value) => {
    const formattedDate = value ? value.toISOString().split("T")[0] : "";
    setFormData((prev) => ({
      ...prev,
      delivery_date: formattedDate,
    }));
  };

  const isBooked = (value) =>
    bookedDates.some((dateValue) => dateValue.toDateString() === value.toDateString());

  const handleChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    setImageFile(file || null);

    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !formData.contact_name ||
      !formData.contact_phone ||
      !formData.contact_address ||
      !formData.occasion ||
      !formData.flavor ||
      !formData.delivery_date
    ) {
      alert("Please fill the required fields.");
      return;
    }

    setLoading(true);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));

    if (imageFile) {
      data.append("image", imageFile);
    }

    try {
      await api.post("/api/custom-cakes/", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess(true);
      setFormData((prev) => ({
        ...DEFAULT_FORM,
        contact_name: prev.contact_name,
        contact_phone: prev.contact_phone,
        contact_address: prev.contact_address,
      }));
      setImageFile(null);
      setPreview(null);
    } catch (error) {
      console.error("Custom cake submit failed", error);
      alert(JSON.stringify(error.response?.data || { error: "Unable to submit custom order" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="custom-page">
      <Navbar />

      <div className="custom-top-bar">
        <div>
          <span>Signed in as</span>
          <h3>{displayName}</h3>
        </div>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <header className="custom-header">
        <p>Custom order studio</p>
        <h1>Customize your cake</h1>
      </header>

      <main className="custom-wrapper">
        <section className="custom-card">
          {success && (
            <div className="success-message">
              Order placed successfully.
            </div>
          )}

          <div className="custom-layout">
            <aside className="upload-panel">
              <h3>Upload your design</h3>
              <p>Attach a reference image for colors, shape, or decoration details.</p>
              <label className="upload-control">
                Choose image
                <input type="file" onChange={handleImageChange} />
              </label>

              {preview ? (
                <img src={preview} alt="Cake design preview" />
              ) : (
                <div className="upload-placeholder">Preview will appear here</div>
              )}
            </aside>

            <section className="form-area">
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <label className="field">
                    <span>Contact Name</span>
                    <input name="contact_name" value={formData.contact_name} onChange={handleChange} />
                  </label>

                  <label className="field">
                    <span>Telephone</span>
                    <input name="contact_phone" value={formData.contact_phone} onChange={handleChange} />
                  </label>

                  <label className="field field-wide">
                    <span>Address</span>
                    <textarea name="contact_address" value={formData.contact_address} onChange={handleChange} />
                  </label>

                  <label className="field">
                    <span>Occasion</span>
                    <select name="occasion" value={formData.occasion} onChange={handleChange}>
                      <option value="">Select occasion</option>
                      {OCCASION_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>Cake Size</span>
                    <select name="cake_size" value={formData.cake_size} onChange={handleChange}>
                      <option value="">Select size</option>
                      {SIZE_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>Flavor</span>
                    <select name="flavor" value={formData.flavor} onChange={handleChange}>
                      <option value="">Select flavor</option>
                      {FLAVOR_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>Color</span>
                    <input name="color" value={formData.color} onChange={handleChange} />
                  </label>

                  <label className="field">
                    <span>Shape</span>
                    <select name="shape" value={formData.shape} onChange={handleChange}>
                      <option value="">Select shape</option>
                      {SHAPE_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>Quantity</span>
                    <input name="quantity" value={formData.quantity} onChange={handleChange} />
                  </label>

                  <label className="field field-wide">
                    <span>Message on cake</span>
                    <textarea name="message" value={formData.message} onChange={handleChange} />
                  </label>

                  <label className="field field-wide">
                    <span>Special Instructions</span>
                    <textarea name="special_instructions" value={formData.special_instructions} onChange={handleChange} />
                  </label>

                  <div className="delivery-highlight field-wide">
                    We deliver around Badulla town only.
                  </div>

                  <div className="field">
                    <span>Delivery Date</span>
                    <DatePicker
                      selected={formData.delivery_date ? new Date(formData.delivery_date) : null}
                      onChange={handleDateChange}
                      excludeDates={bookedDates}
                      minDate={new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)}
                      dayClassName={(value) => (isBooked(value) ? "booked-date" : "")}
                      renderDayContents={(day, value) =>
                        isBooked(value) ? <span title="Already booked">{day}</span> : <span>{day}</span>
                      }
                      placeholderText="Select date"
                    />

                    <p className="date-note">
                      Minimum 2 days advance booking required.
                    </p>
                  </div>
                </div>

                <button className="submit-btn" disabled={loading}>
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </form>
            </section>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default CustomCakePage;
