import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// ✅ IMPORT YOUR PAGES
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/auth/RegisterPage";
import LoginPage from "./pages/auth/LoginPage";
import CustomCakePage from "./pages/CustomCakePage";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import OrdersPage from "./pages/OrdersPage";

function App() {
  return (
    <Router>
      <Routes>

        {/* PUBLIC ROUTES */}
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/orders" element={<OrdersPage />} />

        {/* 🔒 PROTECTED ROUTES */}
        <Route
          path="/custom"
          element={
            <ProtectedRoute>
              <CustomCakePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

      </Routes>
    </Router>
  );
}

export default App;