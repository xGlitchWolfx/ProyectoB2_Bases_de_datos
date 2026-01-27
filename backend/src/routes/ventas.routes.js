const express = require("express");
const pool = require("../config/db");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

const router = express.Router();

// CREAR VENTA (SOLO EMPLEADO)
router.post("/", auth, role("Empleado"), async (req, res) => {
  const { id_cliente, productos } = req.body;
  const id_usuario = req.user.id_usuario;

  const idClienteFinal = id_cliente || 1; // Usar ID 1 (Consumidor Final) si no hay cliente

  if (!productos || productos.length === 0) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  let total = 0;

  try {
    await pool.query("BEGIN");

    // Crear venta
    const venta = await pool.query(
      `INSERT INTO ventas (id_cliente, id_usuario)
       VALUES ($1, $2)
       RETURNING id_venta`,
      [idClienteFinal, id_usuario]
    );

    const id_venta = venta.rows[0].id_venta;

    // Recorrer productos
    for (const p of productos) {
      const { id_producto, cantidad } = p;

      const stock = await pool.query(
        "SELECT precio, stock FROM productos WHERE id_producto = $1",
        [id_producto]
      );

      if (stock.rows.length === 0) {
        throw new Error("Producto no existe");
      }

      if (stock.rows[0].stock < cantidad) {
        throw new Error("Stock insuficiente");
      }

      const precio = stock.rows[0].precio;
      total += cantidad * precio;

      // Detalle de venta
      await pool.query(
        `INSERT INTO detalle_venta
         (id_venta, id_producto, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4)`,
        [id_venta, id_producto, cantidad, precio]
      );

      // Actualizar stock
      await pool.query(
        "UPDATE productos SET stock = stock - $1 WHERE id_producto = $2",
        [cantidad, id_producto]
      );
    }

    // Guardar total
    await pool.query(
      "UPDATE ventas SET total = $1 WHERE id_venta = $2",
      [total, id_venta]
    );

    await pool.query("COMMIT");

    res.json({
      message: "Venta registrada correctamente",
      id_venta,
      total
    });

  } catch (error) {
    await pool.query("ROLLBACK");
    res.status(500).json({ error: error.message });
  }
});

// MIS COMPRAS (CLIENTE LOGUEADO)
router.get("/mis-compras", auth, role("Cliente"), async (req, res) => {
  try {
    const id_cliente = req.user.id_cliente;

    if (!id_cliente) {
      return res.status(403).json({ error: "Usuario no es un cliente válido" });
    }

    // 1. Obtener todas las ventas del cliente
    const ventasRes = await pool.query(
      `SELECT id_venta, fecha, total 
       FROM ventas 
       WHERE id_cliente = $1 
       ORDER BY fecha DESC`,
      [id_cliente]
    );

    const compras = ventasRes.rows;

    // 2. Para cada venta, obtener sus detalles
    for (const compra of compras) {
      const detalleRes = await pool.query(
        `SELECT p.nombre AS producto, dv.cantidad, dv.precio_unitario AS precio
         FROM detalle_venta dv
         JOIN productos p ON dv.id_producto = p.id_producto
         WHERE dv.id_venta = $1`,
        [compra.id_venta]
      );
      compra.items = detalleRes.rows;
    }

    res.json(compras);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener historial de compras" });
  }
});

// VENTAS POR DÍA (ADMIN)
router.get("/dia", auth, role("Administrador"), async (req, res) => {
  const { fecha } = req.query;

  if (!fecha) {
    return res.status(400).json({ error: "Fecha requerida" });
  }

  const result = await pool.query(
    `SELECT 
       COUNT(*) AS cantidad_ventas,
       COALESCE(SUM(total), 0) AS total_vendido
     FROM ventas
     WHERE DATE(fecha) = $1`,
    [fecha]
  );

  res.json({
    fecha,
    cantidad_ventas: result.rows[0].cantidad_ventas,
    total_vendido: result.rows[0].total_vendido
  });
});


// VENTAS POR MES (ADMIN)
router.get("/mes", auth, role("Administrador"), async (req, res) => {
  const { mes } = req.query;

  if (!mes) {
    return res.status(400).json({ error: "Mes requerido (YYYY-MM)" });
  }

  const result = await pool.query(
    `SELECT 
       COUNT(*) AS cantidad_ventas,
       COALESCE(SUM(total), 0) AS total_vendido
     FROM ventas
     WHERE TO_CHAR(fecha, 'YYYY-MM') = $1`,
    [mes]
  );

  res.json({
    mes,
    cantidad_ventas: result.rows[0].cantidad_ventas,
    total_vendido: result.rows[0].total_vendido
  });
});


// LISTAR VENTAS
router.get("/", auth, async (req, res) => {
  const result = await pool.query(
    `SELECT v.id_venta, v.fecha, v.total,
            COALESCE(c.nombre, 'Consumidor Final') AS cliente,
            u.nombre AS vendedor
     FROM ventas v
     LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
     JOIN usuarios u ON v.id_usuario = u.id_usuario
     ORDER BY v.fecha DESC`
  );

  res.json(result.rows);
});

// DETALLE DE UNA VENTA
router.get("/:id", auth, async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    `SELECT p.nombre, dv.cantidad, dv.precio_unitario,
            (dv.cantidad * dv.precio_unitario) AS total
     FROM detalle_venta dv
     JOIN productos p ON dv.id_producto = p.id_producto
     WHERE dv.id_venta = $1`,
    [id]
  );

  res.json(result.rows);
});

// MIS COMPRAS (CLIENTE)
router.get("/mis-compras", auth, role("Cliente"), async (req, res) => {
  try {
    const id_cliente = req.user.id_cliente;

    if (!id_cliente) {
      return res.status(403).json({ error: "Usuario no es cliente válido" });
    }

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
    `, [id_cliente]);

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener compras" });
  }
});



module.exports = router;
