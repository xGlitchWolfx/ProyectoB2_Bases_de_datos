const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const pool = require("../config/db");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

const router = express.Router();
const BACKUP_DIR = path.join(__dirname, "../backups");

/* Crear carpeta si no existe */
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR);
}

/* ===================== LISTAR BACKUPS ===================== */
router.get("/", auth, role("Administrador"), (req, res) => {
  const files = fs.readdirSync(BACKUP_DIR);
  res.json(files);
});

/* ===================== CREAR BACKUP (JSON) ===================== */
router.post("/", auth, role("Administrador"), async (req, res) => {
  try {
    const tablas = [
      "roles",
      "usuarios",
      "clientes",
      "productos",
      "ventas",
      "detalle_venta"
    ];

    const backup = {};

    for (const tabla of tablas) {
      const result = await pool.query(`SELECT * FROM ${tabla}`);
      backup[tabla] = result.rows;
    }

    const fecha = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup_${fecha}.json`;
    const filepath = path.join(BACKUP_DIR, filename);

    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

    res.json({ message: "Backup creado", file: filename });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear backup" });
  }
});

/* ===================== DESCARGAR BACKUP ===================== */
router.get("/download/:file", auth, role("Administrador"), (req, res) => {
  const filePath = path.join(BACKUP_DIR, req.params.file);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Backup no encontrado" });
  }

  res.download(filePath);
});

/* ===================== ELIMINAR BACKUP ===================== */
router.delete("/:file", auth, role("Administrador"), (req, res) => {
  const filePath = path.join(BACKUP_DIR, req.params.file);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Backup no encontrado" });
  }

  fs.unlinkSync(filePath);
  res.json({ message: "Backup eliminado" });
});

/* ===================== SUBIR BACKUP ===================== */
const storage = multer.diskStorage({
  destination: BACKUP_DIR,
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.originalname.endsWith(".json")) {
      return cb(new Error("Solo se permiten backups .json"));
    }
    cb(null, true);
  }
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
