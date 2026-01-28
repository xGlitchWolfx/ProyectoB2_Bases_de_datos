const express = require("express");
const pool = require("../config/db");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

const router = express.Router();

/* ===========================
   CREAR VENTA (EMPLEADO)
=========================== */
router.post("/", auth, role("Empleado"), async (req, res) => {
  const { id_cliente, productos } = req.body;
  const id_usuario = req.user.id_usuario;
  const idClienteFinal = id_cliente || 1;

  if (!productos || productos.length === 0) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  let total = 0;

  try {
    await pool.query("BEGIN");

    const venta = await pool.query(
      `INSERT INTO ventas (id_cliente, id_usuario)
       VALUES ($1, $2)
       RETURNING id_venta`,
      [idClienteFinal, id_usuario]
    );

    const id_venta = venta.rows[0].id_venta;

    for (const p of productos) {
      const { id_producto, cantidad } = p;

      const stockRes = await pool.query(
        "SELECT precio, stock FROM productos WHERE id_producto = $1",
        [id_producto]
      );

      if (stockRes.rows.length === 0) {
        throw new Error("Producto no existe");
      }

      if (stockRes.rows[0].stock < cantidad) {
        throw new Error("Stock insuficiente");
      }

      const precio = stockRes.rows[0].precio;
      total += cantidad * precio;

      await pool.query(
        `INSERT INTO detalle_venta
         (id_venta, id_producto, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4)`,
        [id_venta, id_producto, cantidad, precio]
      );

      await pool.query(
        "UPDATE productos SET stock = stock - $1 WHERE id_producto = $2",
        [cantidad, id_producto]
      );
    }

    await pool.query(
      "UPDATE ventas SET total = $1 WHERE id_venta = $2",
      [total, id_venta]
    );

    await pool.query("COMMIT");

    res.json({ message: "Venta registrada correctamente", id_venta, total });

  } catch (error) {
    await pool.query("ROLLBACK");
    res.status(500).json({ error: error.message });
  }
});

/* ===========================
   MIS COMPRAS (CLIENTE)
=========================== */
router.get("/mis-compras", auth, role("Cliente"), async (req, res) => {
  try {
    const id_cliente = req.user.id_cliente;

    if (!id_cliente) {
      return res.status(403).json({ error: "Usuario no es cliente" });
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


/* ===========================
   MIS VENTAS (EMPLEADO)
=========================== */
router.get("/mis-ventas", auth, role("Empleado"), async (req, res) => {
  const id_usuario = req.user.id_usuario;
  const { fecha } = req.query;

  let query = `
    SELECT v.id_venta, v.fecha, v.total,
           COALESCE(c.nombre, 'Consumidor Final') AS cliente
    FROM ventas v
    LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
    WHERE v.id_usuario = $1
  `;
  const params = [id_usuario];

  if (fecha) {
    query += " AND DATE(v.fecha) = $2";
    params.push(fecha);
  }

  query += " ORDER BY v.fecha DESC";

  const result = await pool.query(query, params);
  res.json(result.rows);
});

/* ===========================
   VENTAS POR DÍA (ADMIN)
=========================== */
router.get("/dia", auth, role("Administrador"), async (req, res) => {
  const { fecha } = req.query;

  if (!fecha) {
    return res.status(400).json({ error: "Fecha requerida" });
  }

  const result = await pool.query(
    `SELECT COUNT(*) AS cantidad_ventas,
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

/* ===========================
   VENTAS POR MES (ADMIN)
=========================== */
router.get("/mes", auth, role("Administrador"), async (req, res) => {
  const { mes } = req.query;

  if (!mes) {
    return res.status(400).json({ error: "Mes requerido (YYYY-MM)" });
  }

  const result = await pool.query(
    `SELECT COUNT(*) AS cantidad_ventas,
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

/* ===========================
   LISTAR TODAS LAS VENTAS
=========================== */
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

/* ===========================
   DETALLE DE VENTA
=========================== */
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

/* ===========================
   ELIMINAR VENTA (EMPLEADO)
=========================== */
router.delete("/:id", auth, role("Empleado"), async (req, res) => {
  const { id } = req.params;
  const id_usuario = req.user.id_usuario;

  try {
    await pool.query("BEGIN");

    const ventaRes = await pool.query(
      "SELECT id_venta FROM ventas WHERE id_venta = $1 AND id_usuario = $2",
      [id, id_usuario]
    );

    if (ventaRes.rows.length === 0) {
      throw new Error("No puedes eliminar esta venta");
    }

    const detalles = await pool.query(
      "SELECT id_producto, cantidad FROM detalle_venta WHERE id_venta = $1",
      [id]
    );

    for (const d of detalles.rows) {
      await pool.query(
        "UPDATE productos SET stock = stock + $1 WHERE id_producto = $2",
        [d.cantidad, d.id_producto]
      );
    }

    await pool.query("DELETE FROM detalle_venta WHERE id_venta = $1", [id]);
    await pool.query("DELETE FROM ventas WHERE id_venta = $1", [id]);

    await pool.query("COMMIT");

    res.json({ message: "Venta anulada y stock restaurado" });

  } catch (error) {
    await pool.query("ROLLBACK");
    res.status(403).json({ error: error.message });
  }
});

module.exports = router;
