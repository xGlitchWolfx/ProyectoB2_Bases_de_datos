import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function RegisterCliente() {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    telefono: ""
  });

  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      await api.post("/auth/register-cliente", form);
      setMsg("Registro exitoso, ahora puedes iniciar sesión");
    } catch (err) {
      setMsg(err.response?.data?.error || "Error al registrarse");
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />

      <main className="flex-grow-1 d-flex align-items-center justify-content-center bg-white">
        <div className="card shadow login-card p-4">
          <h3 className="text-center mb-4">Registro de Cliente</h3>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input
                className="form-control"
                placeholder="Nombre"
                required
                onChange={e => setForm({ ...form, nombre: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <input
                type="email"
                className="form-control"
                placeholder="Email"
                required
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <input
                type="password"
                className="form-control"
                placeholder="Contraseña"
                required
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <input
                className="form-control"
                placeholder="Teléfono (opcional)"
                onChange={e => setForm({ ...form, telefono: e.target.value })}
              />
            </div>

            <div className="d-grid gap-2">
              <button type="submit" className="btn btn-orange">Registrarse</button>
            </div>
          </form>

          <div className="text-center mt-3">
            <Link to="/" style={{ color: "#ff8c00", textDecoration: "none" }}>
              ¿Ya tienes cuenta? Inicia Sesión
            </Link>
          </div>

          {msg && (
            <div className={`alert ${msg.includes("exitoso") ? "alert-success" : "alert-danger"} mt-3 py-2 text-center`}>
              {msg}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
