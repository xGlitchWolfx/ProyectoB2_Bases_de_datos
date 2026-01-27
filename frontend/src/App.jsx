import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Ventas from "./pages/ventas";
import Admin from "./pages/admin";
import Cliente from "./pages/cliente";
import ProtectedRoute from "./components/ProtectedRoute";
import RegisterCliente from "./pages/RegisterCliente";
import Backups from "./pages/Backups";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN */}
        <Route path="/" element={<Login />} />

        {/* REGISTRO CLIENTE */}
        <Route path="/registro" element={<RegisterCliente />} />

        {/* Backup */}
        <Route path="/backups" element={<ProtectedRoute rol="Administrador">
        <Backups />
        </ProtectedRoute>
        }
        />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute rol="Administrador">
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* EMPLEADO */}
        <Route
          path="/ventas"
          element={
            <ProtectedRoute rol="Empleado">
              <Ventas />
            </ProtectedRoute>
          }
        />

        {/* CLIENTE */}
        <Route
          path="/cliente"
          element={
            <ProtectedRoute rol="Cliente">
              <Cliente />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
