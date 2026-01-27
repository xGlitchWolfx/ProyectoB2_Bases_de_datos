const express = require("express");
const pool = require("../config/db");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const bcrypt = require("bcrypt");

const router = express.Router();

// LISTAR EMPLEADOS (SOLO ADMIN)
router.get("/", auth, role("Administrador"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id_usuario, u.nombre, u.email 
       FROM usuarios u
       JOIN roles r ON u.id_rol = r.id_rol
       WHERE r.nombre = 'Empleado'`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener empleados" });
  }
});

// CREAR EMPLEADO (SOLO ADMIN)
router.post("/", auth, role("Administrador"), async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    // Verificar si existe
    const exists = await pool.query("SELECT 1 FROM usuarios WHERE email = $1", [email]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: "El email ya está registrado" });
    }

    // Obtener ID rol Empleado
    const rolRes = await pool.query("SELECT id_rol FROM roles WHERE nombre = 'Empleado'");
    const idRol = rolRes.rows[0].id_rol;

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    await pool.query("INSERT INTO usuarios (nombre, email, password, id_rol) VALUES ($1, $2, $3, $4)", [nombre, email, hash, idRol]);

    res.status(201).json({ message: "Empleado registrado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al registrar empleado" });
  }
});

// ELIMINAR EMPLEADO (SOLO ADMIN)
router.delete("/:id", auth, role("Administrador"), async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM usuarios WHERE id_usuario = $1", [id]);
    res.json({ message: "Empleado eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar empleado" });
  }
});

module.exports = router;