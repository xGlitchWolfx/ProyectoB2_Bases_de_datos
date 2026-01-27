const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

// REGISTER
exports.register = async (req, res) => {
  try {
    const { nombre, email, password, id_rol } = req.body;

    if (!email.includes("@")) {
      return res.status(400).json({ error: "Email inválido" });
    }

    const exists = await pool.query(
      "SELECT 1 FROM usuarios WHERE email = $1",
      [email]
    );

    if (exists.rows.length > 0) {
      return res.status(409).json({ error: "El email ya está registrado" });
    }

    const hash = await bcrypt.hash(password, 10);

    let id_cliente = null;

    //Si el rol es CLIENTE, creamos cliente automáticamente
    const rol = await pool.query(
      "SELECT nombre FROM roles WHERE id_rol = $1",
      [id_rol]
    );

    if (rol.rows[0]?.nombre === "Cliente") {
      const cliente = await pool.query(
        `INSERT INTO clientes (nombre, email, telefono)
         VALUES ($1,$2,'N/A')
         RETURNING id_cliente`,
        [nombre, email]
      );
      id_cliente = cliente.rows[0].id_cliente;
    }

    await pool.query(
      `INSERT INTO usuarios (nombre, email, password, id_rol, id_cliente)
       VALUES ($1,$2,$3,$4,$5)`,
      [nombre, email, hash, id_rol, id_cliente]
    );

    res.json({ message: "Usuario registrado correctamente" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en registro" });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      `SELECT u.id_usuario, u.nombre, u.password, u.id_cliente,
              r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON u.id_rol = r.id_rol
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Usuario no existe" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ error: "Password incorrecta" });
    }

    const token = jwt.sign(
      {
        id_usuario: user.id_usuario,
        rol: user.rol,
        id_cliente: user.id_cliente
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      token,
      user: {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        rol: user.rol,
        id_cliente: user.id_cliente
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en login" });
  }
};

exports.registerCliente = async (req, res) => {
  try {
    const { nombre, email, password, telefono } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    if (!email.includes("@")) {
      return res.status(400).json({ error: "Email inválido" });
    }

    const exists = await pool.query(
      "SELECT 1 FROM usuarios WHERE email = $1",
      [email]
    );

    if (exists.rows.length > 0) {
      return res.status(409).json({ error: "Email ya registrado" });
    }

    // obtener ID del rol Cliente
    const rol = await pool.query(
      "SELECT id_rol FROM roles WHERE nombre = 'Cliente'"
    );

    const id_rol = rol.rows[0].id_rol;

    // crear cliente
    const cliente = await pool.query(
      `INSERT INTO clientes (nombre, email, telefono)
       VALUES ($1,$2,$3)
       RETURNING id_cliente`,
      [nombre, email, telefono || "N/A"]
    );

    const hash = await bcrypt.hash(password, 10);

    // crear usuario
    await pool.query(
      `INSERT INTO usuarios (nombre, email, password, id_rol, id_cliente)
       VALUES ($1,$2,$3,$4,$5)`,
      [nombre, email, hash, id_rol, cliente.rows[0].id_cliente]
    );

    res.status(201).json({
      message: "Cliente registrado correctamente"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar cliente" });
  }
};
