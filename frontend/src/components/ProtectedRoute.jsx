import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ rol, children }) {
  const token = localStorage.getItem("token");
  const userRol = localStorage.getItem("rol");

  if (!token) return <Navigate to="/" />;

  if (rol && userRol !== rol) {
    return <Navigate to="/" />;
  }

  return children;
}
