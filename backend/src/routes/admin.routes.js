const express = require("express");
const { exec } = require("child_process");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

const router = express.Router();

router.post("/backup", auth, role("Administrador"), (req, res) => {
  const comando = `pg_dump -U postgres tienda_db > backups/backup_tienda.sql`;

  exec(comando, (error) => {
    if (error) {
      return res.status(500).json({
        error: "Error al generar el respaldo"
      });
    }

    res.json({
      message: "Backup generado correctamente"
    });
  });
});

module.exports = router;
