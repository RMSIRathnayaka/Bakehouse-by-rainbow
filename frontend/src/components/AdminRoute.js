import React from "react";
import { Navigate } from "react-router-dom";
import { getUserRole, hasSession } from "../utils/session";

function AdminRoute({ children }) {
  if (!hasSession()) {
    return <Navigate to="/login" replace />;
  }

  if (getUserRole() !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminRoute;
