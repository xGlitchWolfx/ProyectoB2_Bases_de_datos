const express = require("express");
const pool = require("../config/db");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM productos ORDER BY nombre"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

router.post("/", auth, role("Administrador"), async (req, res) => {
  try {
    const { nombre, precio, stock } = req.body;

    if (!nombre || precio == null || stock == null) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const result = await pool.query(
      "INSERT INTO productos (nombre, precio, stock) VALUES ($1,$2,$3) RETURNING *",
      [nombre, precio, stock]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error al crear producto" });
  }
});

router.put("/:id", auth, role("Administrador"), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, precio, stock } = req.body;

    await pool.query(
      "UPDATE productos SET nombre=$1, precio=$2, stock=$3 WHERE id_producto=$4",
      [nombre, precio, stock, id]
    );

    res.json({ message: "Producto actualizado" });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar producto" });
  }
});


router.delete("/:id", auth, role("Administrador"), async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM productos WHERE id_producto=$1",
      [id]
    );

    res.json({ message: "Producto eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar producto" });
  }
});

module.exports = router;
