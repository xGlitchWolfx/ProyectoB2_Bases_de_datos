import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Ventas from "./pages/ventas";
import Admin from "./pages/admin";
import Cliente from "./pages/cliente";
import Auditoria from "./pages/auditoria";
import ProtectedRoute from "./components/ProtectedRoute";
import RegisterCliente from "./pages/RegisterCliente";
import Backups from "./pages/backups";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<RegisterCliente />} />

        <Route
          path="/backups"
          element={
            <ProtectedRoute rol="Administrador">
              <Backups />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute rol="Administrador">
              <Admin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/auditoria"
          element={
            <ProtectedRoute rol="Administrador">
              <Auditoria />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ventas"
          element={
            <ProtectedRoute rol="Empleado">
              <Ventas />
            </ProtectedRoute>
          }
        />

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
