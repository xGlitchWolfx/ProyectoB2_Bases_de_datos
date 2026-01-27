const pool = require("../db");

const crearCliente = async (req, res) => {
  try {
    const { nombre, correo, telefono } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    const result = await pool.query(
      `INSERT INTO clientes (nombre, correo, telefono)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [nombre, correo || null, telefono || null]
    );

    res.status(201).json({
      message: "Cliente creado correctamente",
      cliente: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear cliente" });
  }
};

module.exports = {
  crearCliente,
};
