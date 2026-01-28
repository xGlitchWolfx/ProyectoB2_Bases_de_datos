import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Auditoria() {
  const [logs, setLogs] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroOperacion, setFiltroOperacion] = useState("");

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get("/auditoria");
        setLogs(res.data);
      } catch (error) {
        setMensaje("No autorizado o error al cargar auditoría");
      }
    };
    cargar();
  }, []);

  // Filtrado local de registros
  const logsFiltrados = logs.filter(log => {
    let fechaMatch = true;
    if (filtroFecha) {
      // Compara si la fecha ISO comienza con el string YYYY-MM-DD seleccionado
      fechaMatch = log.fecha_evento && log.fecha_evento.startsWith(filtroFecha);
    }
    
    let opMatch = true;
    if (filtroOperacion) {
      opMatch = log.operacion === filtroOperacion;
    }

    return fechaMatch && opMatch;
  });

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header title="Auditoría del Sistema" />

      <main className="flex-grow-1 container py-4">
        {mensaje && <div className="alert alert-danger">{mensaje}</div>}

        <div className="card shadow">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <h4 className="mb-0">📜 Registro de Eventos</h4>
            <Link to="/admin" className="btn btn-secondary btn-sm">
              Volver al Panel
            </Link>
          </div>
          <div className="card-body">
            {/* FILTROS */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="form-label fw-bold">Filtrar por Fecha:</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Tipo de Operación:</label>
                <select 
                  className="form-select"
                  value={filtroOperacion}
                  onChange={(e) => setFiltroOperacion(e.target.value)}
                >
                  <option value="">-- Todas --</option>
                  <option value="INSERT">INSERT</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div className="col-md-4 d-flex align-items-end">
                <button 
                  className="btn btn-secondary w-100"
                  onClick={() => { setFiltroFecha(""); setFiltroOperacion(""); }}
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>

            {/* TABLA CON SCROLL */}
            <div className="table-responsive" style={{ maxHeight: "600px", overflowY: "auto" }}>
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-dark sticky-top">
                  <tr>
                    <th>Fecha</th>
                    <th>Tabla</th>
                    <th>Operación</th>
                    <th>Usuario DB</th>
                    <th>Antes</th>
                    <th>Después</th>
                  </tr>
                </thead>
                <tbody>
                  {logsFiltrados.length === 0 ? (
                    <tr><td colSpan="6" className="text-center text-muted">No se encontraron resultados</td></tr>
                  ) : (
                    logsFiltrados.map(log => (
                      <tr key={log.id_auditoria}>
                        <td style={{ minWidth: "150px" }}>{new Date(log.fecha_evento).toLocaleString()}</td>
                        <td className="fw-bold text-primary">{log.tabla_afectada}</td>
                        <td>
                          <span className={`badge ${
                            log.operacion === 'INSERT' ? 'bg-success' :
                            log.operacion === 'DELETE' ? 'bg-danger' :
                            'bg-warning text-dark'
                          }`}>
                            {log.operacion}
                          </span>
                        </td>
                        <td>{log.usuario}</td>
                        <td>
                          {log.datos_anteriores ? (
                            <pre className="bg-light p-2 border rounded" style={{ maxWidth: "250px", maxHeight: "150px", overflow: "auto", fontSize: "0.85rem" }}>
                              {JSON.stringify(log.datos_anteriores, null, 2)}
                            </pre>
                          ) : <span className="text-muted">-</span>}
                        </td>
                        <td>
                          {log.datos_nuevos ? (
                            <pre className="bg-light p-2 border rounded" style={{ maxWidth: "250px", maxHeight: "150px", overflow: "auto", fontSize: "0.85rem" }}>
                              {JSON.stringify(log.datos_nuevos, null, 2)}
                            </pre>
                          ) : <span className="text-muted">-</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
