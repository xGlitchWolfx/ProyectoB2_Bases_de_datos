import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, user } = res.data;

      localStorage.clear();
      localStorage.setItem("token", token);
      localStorage.setItem("rol", user.rol);
      localStorage.setItem("user_id", user.id_usuario);
      localStorage.setItem("client_id", user.id_cliente);

      if (user.rol === "Administrador") navigate("/admin");
      else if (user.rol === "Empleado") navigate("/ventas");
      else navigate("/cliente");

    } catch (err) {
      setError(err.response?.data?.error || "Credenciales incorrectas");
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />

      <main className="flex-grow-1 d-flex align-items-center justify-content-center bg-white">
        <div className="card shadow login-card p-4">
          <h3 className="text-center mb-4">Iniciar Sesión</h3>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input
                type="email"
                className="form-control"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <input
                type="password"
                className="form-control"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="d-grid gap-2">
              <button type="submit" className="btn btn-orange">
                Ingresar
              </button>
            </div>
          </form>

          <div className="text-center mt-3">
            <Link to="/registro" style={{ color: "#ff8c00", textDecoration: "none" }}>
              ¿No tienes cuenta? Regístrate
            </Link>
          </div>

          {error && (
            <div className="alert alert-danger mt-3 py-2 text-center">
              {error}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
