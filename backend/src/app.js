require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Importar rutas
const usuariosRoutes = require("./routes/usuarios.routes");
const backupRoutes = require("./routes/backup.routes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta raíz (health check)
app.get("/", (req, res) => {
  res.send("🚀 API funcionando correctamente");
});

// Rutas de la API
app.use("/auth", require("./routes/auth.routes"));
app.use("/productos", require("./routes/productos.routes"));
app.use("/ventas", require("./routes/ventas.routes"));
app.use("/clientes", require("./routes/clientes.routes"));
app.use("/usuarios", usuariosRoutes);
app.use("/backup", backupRoutes);
app.use("/api/backup", backupRoutes);

module.exports = app;
