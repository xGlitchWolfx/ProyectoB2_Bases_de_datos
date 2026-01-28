import { useEffect, useState } from "react";
import api from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Ventas() {
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [items, setItems] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [idCliente, setIdCliente] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [factura, setFactura] = useState(null);
  const [etapa, setEtapa] = useState(1); // 1: Selección, 2: Creación, 3: Venta
  const [misVentas, setMisVentas] = useState([]);
  const [fechaFiltro, setFechaFiltro] = useState("");
  const [cargandoVentas, setCargandoVentas] = useState(false);
  const [mostrarEditor, setMostrarEditor] = useState(false);

  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    email: "",
    telefono: "",
    password: ""
  });

  // cargar productos
  useEffect(() => {
    const cargar = async () => {
      try {
        const prod = await api.get("/productos");
        setProductos(prod.data);

        const cli = await api.get("/clientes");
        setClientes(cli.data);
      } catch {
        setMensaje("Error cargando datos");
      }
    };
    cargar();
  }, []);

  // Función independiente para crear cliente
  const crearCliente = async () => {
    try {
      if (!nuevoCliente.nombre) {
        setMensaje("El nombre es obligatorio para crear cliente");
        return;
      }

      // Si hay contraseña, usamos el registro de usuarios (crea usuario + cliente)
      // Si no, usamos el registro simple de clientes
      const endpoint = nuevoCliente.password ? "/auth/register-cliente" : "/clientes";
      
      await api.post(endpoint, nuevoCliente);
      
      const res = await api.get("/clientes"); // Recargar lista
      setClientes(res.data);
      setNuevoCliente({ nombre: "", email: "", telefono: "", password: "" });
      setMensaje("Cliente creado exitosamente");
      setEtapa(1); // Volver a la selección
    } catch (error) {
      setMensaje(error.response?.data?.error || "Error al crear cliente");
    }
  };

  // agregar producto
  const agregarItem = () => {
    if (!productoSeleccionado || cantidad <= 0) return;

    const producto = productos.find(
      p => p.id_producto === Number(productoSeleccionado)
    );

    if (!producto) return;

    if (producto.stock < cantidad) {
      setMensaje("Stock insuficiente");
      return;
    }

    setItems([
      ...items,
      {
        id_producto: producto.id_producto,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: Number(cantidad)
      }
    ]);

    setProductoSeleccionado("");
    setCantidad(1);
  };

  const total = items.reduce(
    (acc, i) => acc + i.precio * i.cantidad,
    0
  );

  // REGISTRAR VENTA (CON LÓGICA FINAL)
  const registrarVenta = async () => {
    if (items.length === 0) {
      setMensaje("Debe agregar productos");
      return;
    }

    try {
      // registrar venta
      const resVenta = await api.post("/ventas", {
        id_cliente: idCliente || null,
        productos: items.map(i => ({
          id_producto: i.id_producto,
          cantidad: i.cantidad
        }))
      });

      setFactura({
        cliente: idCliente
          ? clientes.find(c => c.id_cliente === Number(idCliente))?.nombre
          : "Consumidor Final",
        items,
        total: resVenta.data.total
      });

      setItems([]);
      setMensaje("Venta registrada correctamente");

    } catch (error) {
      console.error(error);
      setMensaje(error.response?.data?.error || "Error al registrar venta");
    }
  };

  // Cargar ventas del empleado
const cargarMisVentas = async () => {
  try {
    setCargandoVentas(true);
    const res = await api.get("/ventas/mis-ventas", {
      params: fechaFiltro ? { fecha: fechaFiltro } : {}
    });
    setMisVentas(res.data);
  } catch {
    setMensaje("Error al cargar ventas");
  } finally {
    setCargandoVentas(false);
  }
};

// Anular venta
const anularVenta = async (id_venta) => {
  if (!window.confirm("¿Seguro que deseas anular esta venta? Se devolverá el stock.")) return;

  try {
    await api.delete(`/ventas/${id_venta}`);
    setMensaje("Venta anulada correctamente");
    cargarMisVentas();
  } catch (error) {
    setMensaje(error.response?.data?.error || "Error al anular venta");
  }
};

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header title="Registro de Ventas" />

      <main className="flex-grow-1 container py-4">
        {mensaje && (
          <div className={`alert ${mensaje.toLowerCase().includes("error") || mensaje.toLowerCase().includes("insuficiente") || mensaje.toLowerCase().includes("obligatorio") ? "alert-danger" : "alert-success"} text-center`}>
            {mensaje}
          </div>
        )}

        {/* ETAPA 1: SELECCIÓN DE CLIENTE */}
        {etapa === 1 && !factura && (
          <div className="card shadow p-4 mx-auto" style={{ maxWidth: "600px" }}>
            <h3 className="text-center mb-4">Paso 1: Seleccionar Cliente</h3>
            
            <div className="d-grid gap-2 mb-4">
              <button className="btn btn-primary btn-lg" onClick={() => { setIdCliente(""); setEtapa(3); }}>
                ⚡ Venta Rápida (Consumidor Final)
              </button>
            </div>

            <div className="mb-3">
              <label className="form-label">Cliente Registrado:</label>
              <div className="input-group">
                <select className="form-select" value={idCliente} onChange={e => setIdCliente(e.target.value)}>
                  <option value="">-- Seleccionar --</option>
                  {clientes.map(c => (
                    <option key={c.id_cliente} value={c.id_cliente}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
                <button className="btn btn-primary" onClick={() => {
                  if (idCliente) setEtapa(3);
                  else setMensaje("Seleccione un cliente o use Venta Rápida");
                }}>
                  Continuar
                </button>
              </div>
            </div>

            <div className="text-center mt-3">
              <button className="btn btn-link" onClick={() => setEtapa(2)}>Crear Nuevo Cliente</button>
            </div>
          </div>
        )}

        {/* ETAPA 2: CREAR CLIENTE */}
        {etapa === 2 && !factura && (
          <div className="card shadow p-4 mx-auto" style={{ maxWidth: "600px" }}>
            <h3 className="text-center mb-4">Crear Nuevo Cliente</h3>
            <div className="mb-3">
              <input type="text" className="form-control" placeholder="Nombre" value={nuevoCliente.nombre} onChange={e => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} />
            </div>
            <div className="mb-3">
              <input type="email" className="form-control" placeholder="Email" value={nuevoCliente.email} onChange={e => setNuevoCliente({ ...nuevoCliente, email: e.target.value })} />
            </div>
            <div className="mb-3">
              <input type="text" className="form-control" placeholder="Teléfono" value={nuevoCliente.telefono} onChange={e => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })} />
            </div>
            <div className="mb-3">
              <input type="password" className="form-control" placeholder="Contraseña (Opcional para acceso web)" value={nuevoCliente.password} onChange={e => setNuevoCliente({ ...nuevoCliente, password: e.target.value })} />
            </div>
            
            <div className="d-flex gap-2 justify-content-center">
              <button className="btn btn-primary" onClick={crearCliente}>Guardar y Volver</button>
              <button className="btn btn-danger" onClick={() => setEtapa(1)}>Cancelar</button>
            </div>
          </div>
        )}

        {/* ETAPA 3: VENTA */}
        {etapa === 3 && !factura && (
          <div className="card shadow p-4">
            <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded mb-4 border">
              <h4 className="mb-0">
                Cliente: <span className="text-primary">{idCliente ? clientes.find(c => c.id_cliente === Number(idCliente))?.nombre : "Consumidor Final"}</span>
              </h4>
              <button className="btn btn-danger btn-sm" onClick={() => setEtapa(1)}>Cambiar Cliente</button>
            </div>

            <h5 className="mb-3">Agregar Productos</h5>
            <div className="row g-2 mb-4 align-items-end">
              <div className="col-md-8">
                <select className="form-select" value={productoSeleccionado} onChange={e => setProductoSeleccionado(e.target.value)}>
                  <option value="">Seleccione producto</option>
                  {productos.map(p => (
                    <option key={p.id_producto} value={p.id_producto}>
                      {p.nombre} | ${p.precio} | Stock: {p.stock}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <input type="number" className="form-control" min="1" value={cantidad} onChange={e => setCantidad(Number(e.target.value))} />
              </div>
              <div className="col-md-2">
                <button className="btn btn-primary w-100" onClick={agregarItem}>Agregar</button>
              </div>
            </div>

            <h5 className="mb-3">Detalle de Venta</h5>
            <div className="table-responsive mb-4">
              <table className="table table-bordered table-striped">
                <thead className="table-light">
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan="4" className="text-center">No hay productos agregados</td></tr>
                  ) : (
                    items.map((i, idx) => (
                      <tr key={idx}>
                        <td>{i.nombre}</td>
                        <td>{i.cantidad}</td>
                        <td>${i.precio}</td>
                        <td>${i.precio * i.cantidad}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-between align-items-center border-top pt-3">
              <h3>Total: ${total}</h3>
              <button className="btn btn-primary btn-lg" onClick={registrarVenta}>Registrar Venta</button>
            </div>
          </div>
        )}

        {/* FACTURA */}
        {factura && (
          <div className="card shadow p-5 mx-auto text-center" style={{ maxWidth: "600px" }}>
            <div className="mb-4 text-success">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" className="bi bi-check-circle-fill" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
              </svg>
            </div>
            <h2 className="mb-3">¡Venta Exitosa!</h2>
            <div className="text-start bg-light p-3 rounded mb-4 border">
              <p className="mb-2"><strong>Cliente:</strong> {factura.cliente}</p>
              <ul className="list-group list-group-flush mb-3">
                {factura.items.map((i, idx) => (
                  <li key={idx} className="list-group-item bg-transparent d-flex justify-content-between">
                    <span>{i.nombre} x {i.cantidad}</span>
                    <span>${i.precio * i.cantidad}</span>
                  </li>
                ))}
              </ul>
              <h4 className="text-end">Total Pagado: ${factura.total}</h4>
            </div>
            <button className="btn btn-primary w-100" onClick={() => {
              setFactura(null);
              setEtapa(1);
              setIdCliente("");
              setMensaje("");
            }}>Nueva Venta</button>
          </div>
        )}

        <div className="text-center mt-5">
          <button className="btn btn-secondary" onClick={() => setMostrarEditor(!mostrarEditor)}>
            Editor de Ventas
          </button>
        </div>
      </main>
      {/* ===========================
    EDITAR / ANULAR VENTAS
=========================== */}
      {mostrarEditor && (
<div className="card shadow p-4 mt-5">
  <h3 className="mb-4">🧾 Editar / Anular Ventas</h3>

  {/* Filtro */}
  <div className="row mb-3">
    <div className="col-md-4">
      <label className="form-label">Filtrar por fecha</label>
      <input
        type="date"
        className="form-control"
        value={fechaFiltro}
        onChange={e => setFechaFiltro(e.target.value)}
      />
    </div>
    <div className="col-md-3 d-flex align-items-end">
      <button
        className="btn btn-secondary w-100"
        onClick={cargarMisVentas}
      >
        Buscar
      </button>
    </div>
  </div>

  {/* Tabla */}
  <div className="table-responsive">
    <table className="table table-bordered table-hover">
      <thead className="table-light">
        <tr>
          <th>#</th>
          <th>Fecha</th>
          <th>Cliente</th>
          <th>Total</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {cargandoVentas ? (
          <tr>
            <td colSpan="5" className="text-center">Cargando...</td>
          </tr>
        ) : misVentas.length === 0 ? (
          <tr>
            <td colSpan="5" className="text-center">No hay ventas</td>
          </tr>
        ) : (
          misVentas.map(v => (
            <tr key={v.id_venta}>
              <td>{v.id_venta}</td>
              <td>{new Date(v.fecha).toLocaleDateString()}</td>
              <td>{v.cliente}</td>
              <td>${v.total}</td>
              <td>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => anularVenta(v.id_venta)}
                >
                  Anular
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
</div>
      )}

      <Footer />
    </div>
  );
}
