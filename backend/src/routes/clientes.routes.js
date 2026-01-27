const express = require("express");
const pool = require("../config/db");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

const router = express.Router();

router.post("/", auth, async (req, res) => {
  try {
    let { nombre, email, telefono } = req.body;

    nombre = nombre || "Consumidor Final";
    email = email || "N/A";
    telefono = telefono || "N/A";

    const result = await pool.query(
      `INSERT INTO clientes (nombre, email, telefono)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [nombre, email, telefono]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear cliente" });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM clientes ORDER BY nombre"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al listar clientes" });
  }
});

router.get("/:id/ventas", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id_venta, fecha, total
       FROM ventas
       WHERE id_cliente = $1
       ORDER BY fecha DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener ventas" });
  }
});

// HISTORIAL DE COMPRAS DEL CLIENTE
router.get("/:id/compras", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        v.id_venta,
        v.fecha,
        v.total,
        json_agg(
          json_build_object(
            'producto', p.nombre,
            'cantidad', dv.cantidad,
            'precio', dv.precio_unitario
          )
        ) AS items
      FROM ventas v
      JOIN detalle_venta dv ON v.id_venta = dv.id_venta
      JOIN productos p ON dv.id_producto = p.id_producto
      WHERE v.id_cliente = $1
      GROUP BY v.id_venta
      ORDER BY v.fecha DESC
    `, [id]);

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener compras" });
  }
});

module.exports = router;
