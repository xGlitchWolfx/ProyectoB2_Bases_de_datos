import { useEffect, useState } from "react";
import api from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Auditoria() {
  const [logs, setLogs] = useState([]);
  const [mensaje, setMensaje] = useState("");

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

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header title="Auditoría del Sistema" />

      <main className="container py-4">
        {mensaje && <div className="alert alert-danger">{mensaje}</div>}

        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead className="table-dark">
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
              {logs.map(log => (
                <tr key={log.id_auditoria}>
                  <td>{new Date(log.fecha_evento).toLocaleString()}</td>
                  <td>{log.tabla_afectada}</td>
                  <td>{log.operacion}</td>
                  <td>{log.usuario}</td>
                  <td>
                    <pre style={{ maxWidth: "300px", whiteSpace: "pre-wrap" }}>
                      {JSON.stringify(log.datos_anteriores, null, 2)}
                    </pre>
                  </td>
                  <td>
                    <pre style={{ maxWidth: "300px", whiteSpace: "pre-wrap" }}>
                      {JSON.stringify(log.datos_nuevos, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <Footer />
    </div>
  );
}
