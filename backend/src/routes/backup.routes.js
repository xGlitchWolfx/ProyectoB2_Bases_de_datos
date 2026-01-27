const express = require("express");
const { exec } = require("child_process");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const fs = require("fs");
require("dotenv").config();

const router = express.Router();
const BACKUP_DIR = "backups";

/* ===================== LISTAR BACKUPS ===================== */
router.get("/", auth, role("Administrador"), (req, res) => {
  if (!fs.existsSync(BACKUP_DIR)) return res.json([]);

  const files = fs.readdirSync(BACKUP_DIR);
  res.json(files);
});

/* ===================== CREAR BACKUP ===================== */
router.post("/backup", auth, role("Administrador"), (req, res) => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
  }

  const fecha = new Date().toISOString().replace(/[:.]/g, "-");
  const file = `${BACKUP_DIR}/backup_${fecha}.backup`;

  const cmd = `"${process.env.PG_DUMP_PATH}" -U ${process.env.DB_USER} -h ${process.env.DB_HOST} -p ${process.env.DB_PORT} -F c -b -f "${file}" ${process.env.DB_NAME}`;

  exec(
    cmd,
    { env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD } },
    (error, stdout, stderr) => {
      if (error) {
        console.error(stderr);
        return res.status(500).json({ error: "Error creando backup" });
      }
      res.json({ message: "Backup creado", file });
    }
  );
});

/* ===================== DESCARGAR BACKUP ===================== */
router.get("/download/:file", auth, role("Administrador"), (req, res) => {
  const filePath = `${BACKUP_DIR}/${req.params.file}`;

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Backup no encontrado" });
  }

  res.download(filePath);
});

/* ===================== RESTAURAR BACKUP ===================== */
router.post("/restore/:file", auth, role("Administrador"), (req, res) => {
  const { file } = req.params;
  const filePath = `${BACKUP_DIR}/${file}`;

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Backup no encontrado" });
  }

  const restoreCmd = `
    "${process.env.PG_RESTORE_PATH}"
    -U ${process.env.DB_USER}
    -h ${process.env.DB_HOST}
    -p ${process.env.DB_PORT}
    -d ${process.env.DB_NAME}
    -c --if-exists
    "${filePath}"
  `;

  exec(
    restoreCmd,
    { env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD } },
    (restoreErr, stdout, restoreStderr) => {
      if (restoreErr) {
        console.error("Restore error:", restoreStderr);
        return res.status(500).json({
          error: "Error restaurando backup",
          detalle: restoreStderr
        });
      }

      res.json({ message: "Backup restaurado correctamente (Base de datos limpiada y restaurada)" });
    }
  );
});



/* ===================== ELIMINAR BACKUP ===================== */
router.delete("/:file", auth, role("Administrador"), (req, res) => {
  const filePath = `${BACKUP_DIR}/${req.params.file}`;

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Backup no encontrado" });
  }

  fs.unlinkSync(filePath);
  res.json({ message: "Backup eliminado" });
});
const multer = require("multer");

const storage = multer.diskStorage({
  destination: "backups/",
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({
  fileFilter: (req, file, cb) => {
    if (!file.originalname.endsWith(".backup")) {
      return cb(new Error("Solo se permiten archivos .backup"));
    }
    cb(null, true);
  },
  storage
});

router.post(
  "/upload",
  auth,
  role("Administrador"),
  upload.single("backup"),
  (req, res) => {
    res.json({ message: "Backup subido correctamente" });
  }
);

module.exports = router;
