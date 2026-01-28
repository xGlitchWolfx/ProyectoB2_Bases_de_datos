import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Backups() {
  const [backups, setBackups] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= CARGAR BACKUPS ================= */
  const cargarBackups = async () => {
    try {
      const res = await api.get("/backup");
      setBackups(res.data);
    } catch {
      setMsg("❌ Error al cargar backups");
    }
  };

  /* ================= CREAR BACKUP ================= */
  const crearBackup = async () => {
    setLoading(true);
    setMsg("");
    try {
      await api.post("/backup");
      await cargarBackups();
      setMsg("✅ Backup creado correctamente");
    } catch {
      setMsg("❌ Error al crear backup");
    }
    setLoading(false);
  };

  /* ================= DESCARGAR BACKUP ================= */
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

  /* ================= ELIMINAR BACKUP ================= */
  const eliminarBackup = async (file) => {
    if (!window.confirm("¿Seguro que deseas eliminar este backup?")) return;

    setLoading(true);
    try {
      await api.delete(`/backup/${file}`);
      await cargarBackups();
      setMsg("🗑️ Backup eliminado correctamente");
    } catch {
      setMsg("❌ Error al eliminar backup");
    }
    setLoading(false);
  };

  /* ================= RESTAURAR BACKUP ================= */
  const restaurarBackup = async (file) => {
    const confirmar = window.confirm(
      "⚠️ ATENCIÓN ⚠️\n\n" +
      "Si restauras este backup:\n" +
      "- Se BORRARÁ toda la base de datos actual\n" +
      "- Los datos actuales se perderán\n\n" +
      "👉 ¿Deseas continuar?\n" +
      "💡 Recomendación: crea un backup antes de restaurar."
    );

    if (!confirmar) return;

    setLoading(true);
    setMsg("");

    try {
      await api.post(`/backup/restore-json/${file}`);
      setMsg("♻️ Backup restaurado correctamente");
      await cargarBackups();
    } catch {
      setMsg("❌ Error al restaurar backup");
    } finally {
      setLoading(false);
    }
  };

  /* ================= SUBIR BACKUP ================= */
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Confirmación extra antes de subir
    const confirmar = window.confirm(
      "⚠️ ADVERTENCIA ⚠️\n\n" +
      "Si cargas este backup:\n" +
      "- El contenido podría restaurarse luego\n" +
      "- Podrías sobrescribir datos actuales\n\n" +
      "👉 ¿Deseas continuar?\n" +
      "💡 Recuerda crear otro backup por si las moscas 🐱‍👤"
    );

    if (!confirmar) {
      e.target.value = "";
      return;
    }

    if (!file.name.endsWith(".json")) {
      setMsg("❌ Solo se permiten archivos .json");
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
      setMsg("📂 Backup subido correctamente");
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
          <div
            className={`alert ${
              msg.includes("❌") ? "alert-danger" : "alert-success"
            } text-center mb-4`}
          >
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
                Crea, descarga, restaura o elimina respaldos del sistema.
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
                    backups.map((b) => (
                      <tr key={b}>
                        <td className="fw-medium">{b}</td>
                        <td className="text-end">
                          <div className="d-flex gap-2 justify-content-end">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              title="Descargar"
                              onClick={() => descargarBackup(b)}
                              disabled={loading}
                            >
                              ⬇️
                            </button>

                            <button
                              className="btn btn-sm btn-outline-warning"
                              title="Restaurar"
                              onClick={() => restaurarBackup(b)}
                              disabled={loading}
                            >
                              ♻️
                            </button>

                            <button
                              className="btn btn-sm btn-outline-danger"
                              title="Eliminar"
                              onClick={() => eliminarBackup(b)}
                              disabled={loading}
                            >
                              🗑️
                            </button>
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
                  Solo archivos <b>.json</b>
                </small>
              </div>

              <div>
                <input
                  type="file"
                  id="uploadBackup"
                  hidden
                  accept=".json"
                  onChange={handleUpload}
                />
                <button
                  className="btn btn-success"
                  onClick={() =>
                    document.getElementById("uploadBackup").click()
                  }
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
