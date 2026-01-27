require("dotenv").config();
const express = require("express");
const cors = require("cors");
const usuariosRoutes = require("./routes/usuarios.routes");
const backupRoutes = require("./routes/backup.routes");

const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use("/auth", require("./routes/auth.routes"));
app.use("/productos", require("./routes/productos.routes"));
app.use("/ventas", require("./routes/ventas.routes"));
app.use("/clientes", require("./routes/clientes.routes"));
app.use("/usuarios", usuariosRoutes);
app.use("/backup", backupRoutes);
app.use("/api/backup", backupRoutes);



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend funcionando en: http://localhost:${PORT}`);
});
