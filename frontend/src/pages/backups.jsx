import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Backups() {
  const [backups, setBackups] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const cargarBackups = async () => {
    const res = await api.get("/backup");
    setBackups(res.data);
  };

  const crearBackup = async () => {
    setLoading(true);
    setMsg("");
    try {
      await api.post("/backup/backup");
      await cargarBackups();
      setMsg("✅ Backup creado correctamente");
    } catch {
      setMsg("❌ Error al crear backup");
    }
    setLoading(false);
  };

  const eliminarBackup = async (file) => {
    if (!window.confirm("¿Eliminar backup?")) return;
    await api.delete(`/backup/${file}`);
    cargarBackups();
  };

const restaurarBackup = async (file) => {
  const confirmar = window.confirm(
    "⚠️ Esto sobrescribirá TODA la base de datos.\n¿Deseas continuar?"
  );
  if (!confirmar) return;

  setLoading(true);
  setMsg("");

  try {
    const res = await api.post(`/backup/restore/${file}`);
    setMsg("✅ Backup restaurado correctamente");
    await cargarBackups();
  } catch (error) {
    console.error(error);
    setMsg(
      error.response?.data?.error ||
      "❌ Error al restaurar el backup"
    );
  } finally {
    setLoading(false);
  }
};


  const descargarBackup = async (file) => {
    try {
      const res = await api.get(`/backup/download/${file}`, {
        responseType: "blob"
      });

      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = file;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setMsg("❌ Error al descargar backup");
    }
  };

  /* ================= SUBIR BACKUP ================= */
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // ✅ Validaciones importantes
    if (!file.name.endsWith(".backup")) {
      setMsg("❌ Solo se permiten archivos .backup");
      e.target.value = "";
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB
      setMsg("❌ El archivo es demasiado grande");
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("backup", file);

    setLoading(true);
    setMsg("");

    try {
      await api.post("/backup/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      await cargarBackups();
      setMsg("✅ Backup subido correctamente");
    } catch {
      setMsg("❌ Error al subir backup");
    }

    setLoading(false);
    e.target.value = "";
  };

  useEffect(() => {
    cargarBackups();
  }, []);

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header title="Gestión de Backups 💾" />

      <main className="flex-grow-1 container py-4">
        {msg && (
          <div className={`alert ${msg.includes("❌") ? "alert-danger" : "alert-success"} text-center mb-4`}>
            {msg}
          </div>
        )}

        <div className="card shadow">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold">Copias de Seguridad</h5>
            <Link to="/admin" className="btn btn-secondary btn-sm">
              Volver al Panel
            </Link>
          </div>

          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <p className="text-muted mb-0">
                Gestiona y restaura tus copias de seguridad.
              </p>
              <button
                className="btn btn-primary"
                onClick={crearBackup}
                disabled={loading}
              >
                {loading ? "Generando..." : "Generar Nuevo Backup"}
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Archivo</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.length === 0 ? (
                    <tr>
                      <td colSpan="2" className="text-center text-muted py-3">
                        No hay backups disponibles
                      </td>
                    </tr>
                  ) : (
                    backups.map(b => (
                      <tr key={b}>
                        <td className="fw-medium">{b}</td>
                        <td className="text-end">
                          <div className="d-flex gap-2 justify-content-end">
                            <button className="btn btn-sm btn-outline-primary" onClick={() => descargarBackup(b)}>⬇️</button>
                            <button className="btn btn-sm btn-outline-warning" onClick={() => restaurarBackup(b)}>♻️</button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => eliminarBackup(b)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-3 border-top d-flex justify-content-between align-items-center">
              <div>
                <h6 className="fw-bold mb-1">Subir Respaldo Externo</h6>
                <small className="text-muted">
                  Solo archivos <b>.backup</b>
                </small>
              </div>

              <div>
                <input
                  type="file"
                  id="uploadBackup"
                  hidden
                  accept=".backup"
                  onChange={handleUpload}
                />
                <button
                  className="btn btn-success"
                  onClick={() => document.getElementById("uploadBackup").click()}
                  disabled={loading}
                >
                  📂 Cargar Archivo
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
