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

/* ===================== RESTAURAR BACKUP JSON ===================== */
router.post("/restore-json/:file", auth, role("Administrador"), async (req, res) => {
  const filePath = path.join(BACKUP_DIR, req.params.file);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Backup no encontrado" });
  }

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);

    await pool.query("BEGIN");

    await pool.query(`
      TRUNCATE
        detalle_venta,
        ventas,
        productos,
        clientes,
        usuarios,
        roles
      RESTART IDENTITY CASCADE
    `);

    /* ================= RESTAURAR ROLES ================= */
    for (const r of data.roles || []) {
      await pool.query(
        `INSERT INTO roles (id_rol, nombre)
         VALUES ($1,$2)`,
        [r.id_rol, r.nombre]
      );
    }

    /* ================= RESTAURAR USUARIOS ================= */
    for (const u of data.usuarios || []) {
      await pool.query(
        `INSERT INTO usuarios (id_usuario, nombre, email, password, id_rol)
         VALUES ($1,$2,$3,$4,$5)`,
        [u.id_usuario, u.nombre, u.email, u.password, u.id_rol]
      );
    }

    /* ================= RESTAURAR CLIENTES ================= */
    for (const c of data.clientes || []) {
      await pool.query(
        `INSERT INTO clientes (id_cliente, nombre, telefono, email)
         VALUES ($1,$2,$3,$4)`,
        [c.id_cliente, c.nombre, c.telefono, c.email]
      );
    }

    /* ================= RESTAURAR PRODUCTOS ================= */
    for (const p of data.productos || []) {
      await pool.query(
        `INSERT INTO productos (id_producto, nombre, descripcion, precio, stock)
         VALUES ($1,$2,$3,$4,$5)`,
        [p.id_producto, p.nombre, p.descripcion, p.precio, p.stock]
      );
    }

    /* ================= RESTAURAR VENTAS ================= */
    for (const v of data.ventas || []) {
      await pool.query(
        `INSERT INTO ventas (id_venta, id_cliente, id_usuario, total, fecha)
         VALUES ($1,$2,$3,$4,$5)`,
        [v.id_venta, v.id_cliente, v.id_usuario, v.total, v.fecha]
      );
    }

    /* ================= RESTAURAR DETALLE ================= */
    for (const d of data.detalle_venta || []) {
      await pool.query(
        `INSERT INTO detalle_venta (id_detalle, id_venta, id_producto, cantidad, precio_unitario)
         VALUES ($1,$2,$3,$4,$5)`,
        [d.id_detalle, d.id_venta, d.id_producto, d.cantidad, d.precio_unitario]
      );
    }

    await pool.query("COMMIT");

    res.json({ message: "✅ Backup restaurado correctamente" });

  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("RESTORE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
