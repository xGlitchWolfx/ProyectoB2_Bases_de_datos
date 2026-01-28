import { useEffect, useState } from "react";
import api from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Admin() {
  const [empleados, setEmpleados] = useState([]);
  const [productos, setProductos] = useState([]);
  const [reporteDia, setReporteDia] = useState(null);
  const [reporteMes, setReporteMes] = useState(null);
  const [mensaje, setMensaje] = useState("");

  // BACKUP
  const [backupMsg, setBackupMsg] = useState("");
  const [backupLoading, setBackupLoading] = useState(false);

  // Formularios
  const [empleadoForm, setEmpleadoForm] = useState({
    nombre: "",
    email: "",
    password: ""
  });

  const [productoForm, setProductoForm] = useState({
    id: null,
    nombre: "",
    precio: "",
    stock: ""
  });

  const hoy = new Date().toISOString().slice(0, 10);
  const mes = hoy.slice(0, 7);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const emp = await api.get("/usuarios");
      setEmpleados(emp.data);

      const prod = await api.get("/productos");
      setProductos(prod.data);

      const dia = await api.get(`/ventas/dia?fecha=${hoy}`);
      setReporteDia(dia.data);

      const mesRes = await api.get(`/ventas/mes?mes=${mes}`);
      setReporteMes(mesRes.data);
    } catch {
      setMensaje("Error cargando datos del administrador");
    }
  };

  /* ================== BACKUP ================== */
  const crearBackup = async () => {
    setBackupMsg("");
    setBackupLoading(true);
    try {
      const res = await api.post("/backup/backup");
      setBackupMsg(`✅ Backup creado correctamente: ${res.data.file}`);
    } catch {
      setBackupMsg("❌ Error al crear el backup");
    } finally {
      setBackupLoading(false);
    }
  };

  /* ================== EMPLEADOS ================== */
  const registrarEmpleado = async (e) => {
    e.preventDefault();
    try {
      await api.post("/usuarios", empleadoForm);
      setMensaje("Empleado registrado correctamente");
      setEmpleadoForm({ nombre: "", email: "", password: "" });
      cargarDatos();
    } catch (error) {
      setMensaje(error.response?.data?.error || "Error al registrar empleado");
    }
  };

  const despedirEmpleado = async (id) => {
    if (!window.confirm("¿Seguro que deseas despedir al empleado?")) return;
    await api.delete(`/usuarios/${id}`);
    cargarDatos();
  };

  /* ================== PRODUCTOS ================== */
  const guardarProducto = async (e) => {
    e.preventDefault();
    try {
      if (productoForm.id) {
        await api.put(`/productos/${productoForm.id}`, productoForm);
        setMensaje("Producto actualizado");
      } else {
        await api.post("/productos", productoForm);
        setMensaje("Producto creado");
      }
      setProductoForm({ id: null, nombre: "", precio: "", stock: "" });
      cargarDatos();
    } catch {
      setMensaje("Error al guardar producto");
    }
  };

  const editarProducto = (p) => {
    setProductoForm({
      id: p.id_producto,
      nombre: p.nombre,
      precio: p.precio,
      stock: p.stock
    });
  };

  const eliminarProducto = async (id) => {
    if (!window.confirm("¿Eliminar producto?")) return;
    await api.delete(`/productos/${id}`);
    cargarDatos();
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header title="Panel de Administración 🧠" />

      <main className="flex-grow-1 container py-4">
        {mensaje && (
          <div className="alert alert-info text-center mb-4">{mensaje}</div>
        )}

        {/* REPORTES */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card shadow border-primary border-start border-5">
              <div className="card-body">
                <h5 className="text-primary">Ventas Hoy</h5>
                <h2>${reporteDia?.total_vendido || 0}</h2>
                <p>{reporteDia?.cantidad_ventas || 0} ventas</p>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card shadow border-success border-start border-5">
              <div className="card-body">
                <h5 className="text-success">Ventas del Mes</h5>
                <h2>${reporteMes?.total_vendido || 0}</h2>
                <p>{reporteMes?.cantidad_ventas || 0} ventas</p>
              </div>
            </div>
          </div>
        </div>
    
        <div className="row">
          {/* EMPLEADOS */}
          <div className="col-lg-5 mb-4">
            <div className="card shadow h-100">
              <div className="card-header fw-bold">👥 Empleados</div>
              <div className="card-body">
                <form onSubmit={registrarEmpleado} className="mb-3">
                  <input className="form-control mb-2" placeholder="Nombre" value={empleadoForm.nombre} onChange={e => setEmpleadoForm({ ...empleadoForm, nombre: e.target.value })} required />
                  <input className="form-control mb-2" placeholder="Email" value={empleadoForm.email} onChange={e => setEmpleadoForm({ ...empleadoForm, email: e.target.value })} required />
                  <input type="password" className="form-control mb-2" placeholder="Contraseña" value={empleadoForm.password} onChange={e => setEmpleadoForm({ ...empleadoForm, password: e.target.value })} required />
                  <button className="btn btn-primary w-100">Registrar</button>
                </form>

                <table className="table table-sm">
                  <tbody>
                    {empleados.map(e => (
                      <tr key={e.id_usuario}>
                        <td>{e.nombre}<br /><small>{e.email}</small></td>
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => despedirEmpleado(e.id_usuario)}>
                            Despedir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

              </div>
            </div>
          </div>

          {/* PRODUCTOS */}
          <div className="col-lg-7 mb-4">
            <div className="card shadow h-100">
              <div className="card-header fw-bold">📦 Productos</div>
              <div className="card-body">
                <form onSubmit={guardarProducto} className="d-flex gap-2 mb-3">
                  <input className="form-control" placeholder="Nombre" value={productoForm.nombre} onChange={e => setProductoForm({ ...productoForm, nombre: e.target.value })} required />
                  <input type="number" className="form-control" placeholder="Precio" value={productoForm.precio} onChange={e => setProductoForm({ ...productoForm, precio: e.target.value })} required />
                  <input type="number" className="form-control" placeholder="Stock" value={productoForm.stock} onChange={e => setProductoForm({ ...productoForm, stock: e.target.value })} required />
                  <button className="btn btn-success">
                    {productoForm.id ? "Actualizar" : "Agregar"}
                  </button>
                </form>

                <table className="table table-sm table-striped">
                  <tbody>
                    {productos.map(p => (
                      <tr key={p.id_producto}>
                        <td>{p.nombre}</td>
                        <td>${p.precio}</td>
                        <td>{p.stock}</td>
                        <td>
                          <button className="btn btn-outline-primary btn-sm me-1" onClick={() => editarProducto(p)}>✏️</button>
                          <button className="btn btn-outline-danger btn-sm" onClick={() => eliminarProducto(p.id_producto)}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

              </div>
            </div>
          </div>
        </div>
      </main>
<div
  style={{
    position: "fixed",
    bottom: "25px",
    right: "25px",
    zIndex: 999,
    display: "flex",
    gap: "10px"
  }}
>
  {/* BOTÓN AUDITORÍA */}
  <button
    className="btn btn-dark shadow-lg"
    onClick={() => window.location.href = "/auditoria"}
    style={{
      borderRadius: "50px",
      padding: "12px 18px",
      fontWeight: "bold"
    }}
  >
    🧾 Auditoría
  </button>

  {/* BOTÓN BACKUPS */}
  <button
    className="btn btn-warning shadow-lg"
    onClick={() => window.location.href = "/backups"}
    style={{
      borderRadius: "50px",
      padding: "12px 18px",
      fontWeight: "bold"
    }}
  >
    💾 Backups
  </button>
</div>
      <Footer />
    </div>
  );
}
