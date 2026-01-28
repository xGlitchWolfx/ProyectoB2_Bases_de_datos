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
  const [etapa, setEtapa] = useState(1);

  // NUEVO
  const [misVentas, setMisVentas] = useState([]);
  const [fechaFiltro, setFechaFiltro] = useState("");
  const [cargandoVentas, setCargandoVentas] = useState(false);

  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    email: "",
    telefono: ""
  });

  /* ===========================
     CARGA INICIAL
  =========================== */
  useEffect(() => {
    const cargar = async () => {
      try {
        const prod = await api.get("/productos");
        setProductos(prod.data);

        const cli = await api.get("/clientes");
        setClientes(cli.data);

        cargarMisVentas();
      } catch {
        setMensaje("Error cargando datos");
      }
    };
    cargar();
  }, []);

  /* ===========================
     CLIENTES
  =========================== */
  const crearCliente = async () => {
    try {
      if (!nuevoCliente.nombre) {
        setMensaje("El nombre es obligatorio");
        return;
      }
      await api.post("/clientes", nuevoCliente);
      const res = await api.get("/clientes");
      setClientes(res.data);
      setNuevoCliente({ nombre: "", email: "", telefono: "" });
      setMensaje("Cliente creado correctamente");
      setEtapa(1);
    } catch (error) {
      setMensaje(error.response?.data?.error || "Error al crear cliente");
    }
  };

  /* ===========================
     VENTA
  =========================== */
  const agregarItem = () => {
    if (!productoSeleccionado || cantidad <= 0) return;

    const producto = productos.find(
      p => p.id_producto === Number(productoSeleccionado)
    );

    if (!producto || producto.stock < cantidad) {
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

  const registrarVenta = async () => {
    if (items.length === 0) {
      setMensaje("Debe agregar productos");
      return;
    }

    try {
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
      cargarMisVentas();
    } catch (error) {
      setMensaje(error.response?.data?.error || "Error al registrar venta");
    }
  };

  /* ===========================
     MIS VENTAS
  =========================== */
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

  const anularVenta = async (id) => {
    if (!window.confirm("¿Seguro? Se devolverá el stock.")) return;
    try {
      await api.delete(`/ventas/${id}`);
      setMensaje("Venta anulada correctamente");
      cargarMisVentas();
    } catch (error) {
      setMensaje(error.response?.data?.error || "Error al anular venta");
    }
  };

  /* ===========================
     RENDER
  =========================== */
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header title="Registro de Ventas" />

      <main className="flex-grow-1 container py-4">
        {mensaje && (
          <div className={`alert ${mensaje.toLowerCase().includes("error") ? "alert-danger" : "alert-success"} text-center`}>
            {mensaje}
          </div>
        )}

        {/* ======================
            CREAR VENTA
        ====================== */}
        {!factura && etapa === 3 && (
          <div className="card shadow p-4 mb-5">
            <h4 className="mb-3">Agregar Productos</h4>

            <div className="row g-2 mb-3">
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

            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i, idx) => (
                  <tr key={idx}>
                    <td>{i.nombre}</td>
                    <td>{i.cantidad}</td>
                    <td>${i.precio}</td>
                    <td>${i.precio * i.cantidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="d-flex justify-content-between">
              <h4>Total: ${total}</h4>
              <button className="btn btn-success" onClick={registrarVenta}>
                Registrar Venta
              </button>
            </div>
          </div>
        )}

        {/* ======================
            EDITAR / ANULAR
        ====================== */}
        <div className="card shadow p-4">
          <h3 className="mb-4">🧾 Editar / Anular Ventas</h3>

          <div className="row mb-3">
            <div className="col-md-4">
              <input
                type="date"
                className="form-control"
                value={fechaFiltro}
                onChange={e => setFechaFiltro(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <button className="btn btn-secondary w-100" onClick={cargarMisVentas}>
                Filtrar
              </button>
            </div>
          </div>

          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {cargandoVentas ? (
                <tr><td colSpan="5" className="text-center">Cargando...</td></tr>
              ) : misVentas.length === 0 ? (
                <tr><td colSpan="5" className="text-center">Sin ventas</td></tr>
              ) : (
                misVentas.map(v => (
                  <tr key={v.id_venta}>
                    <td>{v.id_venta}</td>
                    <td>{new Date(v.fecha).toLocaleDateString()}</td>
                    <td>{v.cliente}</td>
                    <td>${v.total}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => anularVenta(v.id_venta)}>
                        Anular
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      <Footer />
    </div>
  );
}
