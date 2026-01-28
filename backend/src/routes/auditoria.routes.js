const express = require("express");
const pool = require("../config/db");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

const router = express.Router();

/* ===========================
   VER AUDITORÍA (ADMIN)
=========================== */
router.get("/", auth, role("Administrador"), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id_auditoria,
        tabla_afectada,
        operacion,
        usuario,
        fecha_evento,
        datos_anteriores,
        datos_nuevos
      FROM auditoria
      ORDER BY fecha_evento DESC
      LIMIT 500
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener auditoría" });
  }
});

module.exports = router;
