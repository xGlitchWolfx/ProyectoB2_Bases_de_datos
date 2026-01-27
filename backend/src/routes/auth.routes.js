const express = require("express");
const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const router = express.Router();

/* ===================== LOGIN ===================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      `
      SELECT 
        u.id_usuario,
        u.nombre,
        u.email,
        u.password,
        r.nombre AS rol,
        c.id_cliente
      FROM usuarios u
      JOIN roles r ON u.id_rol = r.id_rol
      LEFT JOIN clientes c ON c.email = u.email
      WHERE u.email = $1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const token = jwt.sign(
      {
        id_usuario: user.id_usuario,
        rol: user.rol,
        id_cliente: user.id_cliente || null
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        id_cliente: user.id_cliente || null
      }
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

/* ===================== REGISTRO CLIENTE ===================== */
router.post("/register-cliente", async (req, res) => {
  const { nombre, email, password, telefono } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const exists = await client.query(
      "SELECT 1 FROM usuarios WHERE email = $1",
      [email]
    );

    if (exists.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "El correo ya está registrado" });
    }

    const hash = await bcrypt.hash(password, 10);

    const rolRes = await client.query(
      "SELECT id_rol FROM roles WHERE nombre = 'Cliente'"
    );
    const idRol = rolRes.rows[0].id_rol;

    await client.query(
      `
      INSERT INTO usuarios (nombre, email, password, id_rol)
      VALUES ($1,$2,$3,$4)
      `,
      [nombre, email, hash, idRol]
    );

    await client.query(
      `
      INSERT INTO clientes (nombre, email, telefono)
      VALUES ($1,$2,$3)
      `,
      [nombre, email, telefono || "N/A"]
    );

    await client.query("COMMIT");

    res.status(201).json({ message: "Registro exitoso" });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Error al registrar cliente" });
  } finally {
    client.release();
  }
});

module.exports = router;
