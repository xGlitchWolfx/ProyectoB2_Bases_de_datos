import { useEffect, useState } from "react";
import api from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Cliente() {
  const [productos, setProductos] = useState([]);
  const [compras, setCompras] = useState([]);
  const [mensaje, setMensaje] = useState("");

  const ORANGE = "#f3bd0cff";

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Productos disponibles
        const prod = await api.get("/productos");
        setProductos(prod.data);

        // Mis compras (desde JWT)
        const comprasRes = await api.get("/ventas/mis-compras");
        setCompras(comprasRes.data);

      } catch (error) {
        console.error(error.response?.data || error.message);
        setMensaje("Error cargando datos");
      }
    };

    cargarDatos();
  }, []);

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header title="Bienvenido a la Tienda" />

      <main className="flex-grow-1 container py-4">
        {mensaje && (
          <div className="alert alert-danger text-center mb-4">
            {mensaje}
          </div>
        )}

        <div className="row">
          {/* COLUMNA IZQUIERDA */}
          <div className="col-lg-8 mb-4">

            {/* PRODUCTOS */}
            <div
              className="card shadow mb-5 border-3"
              style={{ borderColor: ORANGE }}
            >
              <div
                className="card-header fw-bold"
                style={{ backgroundColor: "#ffffffff", color: ORANGE }}
              >
                Productos Disponibles
              </div>

              <div className="card-body p-0">
                <div
                  className="table-responsive"
                  style={{ maxHeight: "300px", overflowY: "auto" }}
                >
                  <table className="table table-striped table-hover mb-0">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th>Producto</th>
                        <th>Precio</th>
                        <th>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productos.map(p => (
                        <tr key={p.id_producto}>
                          <td>{p.nombre}</td>
                          <td>${p.precio}</td>
                          <td>{p.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* HISTORIAL DE COMPRAS */}
            <h4 className="mb-3" style={{ color: "black" }}>
              Mis Compras
            </h4>

            {compras.length === 0 ? (
              <div className="alert alert-info">
                No tienes compras registradas
              </div>
            ) : (
              <div
                className="d-flex flex-column gap-3"
                style={{
                  maxHeight: "400px",
                  overflowY: "auto",
                  paddingRight: "10px"
                }}
              >
                {compras.map(compra => (
                  <div
                    key={compra.id_venta}
                    className="card shadow-sm"
                    style={{ borderLeft: `5px solid ${ORANGE}` }}
                  >
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6
                          className="mb-0 fw-bold"
                          style={{ color: "black" }}
                        >
                          Fecha:{" "}
                          {new Date(compra.fecha).toLocaleDateString()}
                        </h6>

                        <span
                          className="badge fs-6"
                          style={{
                            backgroundColor: ORANGE,
                            color: "#ffffffff"
                          }}
                        >
                          Total: ${compra.total}
                        </span>
                      </div>

                      {compra.items && compra.items.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-sm table-borderless mb-0">
                            <thead className="text-muted small border-bottom">
                              <tr>
                                <th>Producto</th>
                                <th className="text-center">Cant.</th>
                                <th className="text-end">P. Unit</th>
                                <th className="text-end">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {compra.items.map((item, idx) => (
                                <tr key={idx}>
                                  <td>{item.producto}</td>
                                  <td className="text-center">
                                    {item.cantidad}
                                  </td>
                                  <td className="text-end">
                                    ${item.precio}
                                  </td>
                                  <td className="text-end fw-bold">
                                    ${item.cantidad * item.precio}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-muted fst-italic">
                          Detalle no disponible
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA */}
          <div className="col-lg-4">
            <div
              className="card shadow sticky-top border-3"
              style={{ top: "20px", zIndex: 1, borderColor: ORANGE }}
            >
              <div
                className="card-header fw-bold"
                style={{ backgroundColor: ORANGE, color: "white" }}
              >
                Nos ubicamos en:
              </div>
              <div className="card-body p-0">
                <iframe
                  title="Mapa"
                  src="https://www.google.com/maps?q=Centro%20Comercial%20El%20Recreo%20Quito%20Ecuador&output=embed"
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
