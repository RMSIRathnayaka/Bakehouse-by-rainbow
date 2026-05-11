import axios from "axios";
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./datepicker.css";
import "./customcake.css";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function CustomCakePage() {
  const [formData, setFormData] = useState({
    occasion: "",
    cake_size: "",
    flavor: "",
    color: "",
    shape: "",
    quantity: "",
    message: "",
    special_instructions: "",
    delivery_date: "",
  });

  const username = localStorage.getItem("username");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [success, setSuccess] = useState(false);
  const [bookedDates, setBookedDates] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // 🔥 PROTECT PAGE (IMPORTANT)
  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // 📅 Handle date
  const handleDateChange = (date) => {
    const formattedDate = date.toISOString().split("T")[0];
    setFormData((prev) => ({
      ...prev,
      delivery_date: formattedDate,
    }));
  };

  // 📡 Fetch booked dates
  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/custom-cakes/booked_dates/")
      .then((res) => {
        setBookedDates(res.data.map((d) => new Date(d)));
      })
      .catch((err) => console.error(err));
  }, []);

  // 🔴 Check booked
  const isBooked = (date) =>
    bookedDates.some(
      (d) => d.toDateString() === date.toDateString()
    );

  // 📝 Input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // 🖼 Image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);

    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  // 🚀 SUBMIT (FIXED)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.occasion || !formData.flavor || !formData.delivery_date) {
      alert("Please fill required fields");
      return;
    }

    setLoading(true);

    const data = new FormData();
    Object.keys(formData).forEach((key) =>
      data.append(key, formData[key])
    );

    if (imageFile) {
      data.append("image", imageFile);
    }

    try {
      await axios.post(
        "http://127.0.0.1:8000/api/custom-cakes/",
        data,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`, // 🔥 REQUIRED
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSuccess(true);

      setFormData({
        occasion: "",
        cake_size: "",
        flavor: "",
        color: "",
        shape: "",
        quantity: "",
        message: "",
        special_instructions: "",
        delivery_date: "",
      });

      setImageFile(null);
      setPreview(null);

    } catch (error) {
      console.error("ERROR:", error);

      // 🔥 SHOW REAL BACKEND ERROR
      if (error.response) {
        alert(JSON.stringify(error.response.data));
      } else {
        alert("Network error. Check backend.");
      }
    }

    setLoading(false);
  };

  return (
    <div>
      <Navbar />

      {/* HEADER */}
      <div className="top-bar">
        <h3>Welcome, {username} 👋</h3>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <div className="header">Customize your order</div>

      <div className="wrapper">
        <div className="card">

          {success && (
            <h3 style={{ color: "green" }}>
              Order placed successfully 🎉
            </h3>
          )}

          <div className="main-container">

            {/* LEFT */}
            <div className="left-box">
              <h3>Upload your design</h3>
              <input type="file" onChange={handleImageChange} />

              {preview && (
                <img src={preview} alt="preview" />
              )}
            </div>

            {/* RIGHT */}
            <div className="form-area">
              <form onSubmit={handleSubmit}>

                <div className="form-grid">

                  <div className="field">
                    <label>Occasion</label>
                    <input name="occasion" value={formData.occasion} onChange={handleChange} />
                  </div>

                  <div className="field">
                    <label>Cake Size</label>
                    <select name="cake_size" value={formData.cake_size} onChange={handleChange}>
                      <option value="">Select size</option>
                      <option value="1kg">1kg</option>
                      <option value="2kg">2kg</option>
                    </select>
                  </div>

                  <div className="field">
                    <label>Flavor</label>
                    <input name="flavor" value={formData.flavor} onChange={handleChange} />
                  </div>

                  <div className="field">
                    <label>Color</label>
                    <input name="color" value={formData.color} onChange={handleChange} />
                  </div>

                  <div className="field">
                    <label>Shape</label>
                    <input name="shape" value={formData.shape} onChange={handleChange} />
                  </div>

                  <div className="field">
                    <label>Quantity</label>
                    <input name="quantity" value={formData.quantity} onChange={handleChange} />
                  </div>

                  <div className="field">
                    <label>Message on cake</label>
                    <textarea name="message" value={formData.message} onChange={handleChange} />
                  </div>

                  <div className="field">
                    <label>Special Instructions</label>
                    <textarea name="special_instructions" value={formData.special_instructions} onChange={handleChange} />
                  </div>

                  <div className="field">
                    <label>Delivery Date</label>
                    <DatePicker
                      selected={formData.delivery_date ? new Date(formData.delivery_date) : null}
                      onChange={handleDateChange}
                      excludeDates={bookedDates}
                      minDate={new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)}
                      dayClassName={(date) => isBooked(date) ? "booked-date" : ""}
                      renderDayContents={(day, date) =>
                        isBooked(date)
                          ? <span title="Already booked">{day}</span>
                          : <span>{day}</span>
                      }
                      placeholderText="Select date"
                    />

                    <p style={{ color: "red" }}>
                      Minimum 2 days advance booking required
                    </p>
                  </div>

                </div>

                <button className="submit-btn" disabled={loading}>
                  {loading ? "Submitting..." : "Submit"}
                </button>

              </form>
            </div>

          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}

export default CustomCakePage;