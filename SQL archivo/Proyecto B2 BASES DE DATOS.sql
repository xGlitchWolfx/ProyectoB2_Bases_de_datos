CREATE TABLE roles (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    id_rol INT NOT NULL,
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);

CREATE TABLE clientes (
    id_cliente SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100)
);

CREATE TABLE productos (
    id_producto SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL CHECK (precio > 0),
    stock INT NOT NULL CHECK (stock >= 0)
);

CREATE TABLE ventas (
    id_venta SERIAL PRIMARY KEY,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_cliente INT NOT NULL,
    id_usuario INT NOT NULL,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE detalle_venta (
    id_detalle SERIAL PRIMARY KEY,
    id_venta INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario > 0),
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

INSERT INTO roles (nombre) VALUES ('Administrador'), ('Empleado');

INSERT INTO usuarios (nombre, email, password, id_rol)
VALUES ('Juan Perez', 'juan@email.com', 'hash_fake', 1);

INSERT INTO clientes (nombre, telefono, email)
VALUES ('Pedrio Alcachofa', '0911224455', 'Pealca@email.com');

INSERT INTO productos (nombre, descripcion, precio, stock)
VALUES ('Teclado', 'Teclado mecanico RGB 60fps', 49.99, 10);

SELECT u.nombre, r.nombre AS rol
FROM usuarios u
JOIN roles r ON u.id_rol = r.id_rol;

-- CREANDO LA TABLA DE AUDITORIA --
CREATE TABLE auditoria (
    id_auditoria SERIAL PRIMARY KEY,
    tabla_afectada VARCHAR(50) NOT NULL,
    operacion VARCHAR(10) NOT NULL,
    usuario VARCHAR(50) NOT NULL,
    fecha_evento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    datos_anteriores JSONB,
    datos_nuevos JSONB
);

-- FUNCION DE AUDITORIA --
CREATE OR REPLACE FUNCTION fn_auditoria()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO auditoria (
            tabla_afectada,
            operacion,
            usuario,
            datos_anteriores
        )
        VALUES (
            TG_TABLE_NAME,
            TG_OP,
            current_user,
            row_to_json(OLD)
        );
        RETURN OLD;

    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO auditoria (
            tabla_afectada,
            operacion,
            usuario,
            datos_anteriores,
            datos_nuevos
        )
        VALUES (
            TG_TABLE_NAME,
            TG_OP,
            current_user,
            row_to_json(OLD),
            row_to_json(NEW)
        );
        RETURN NEW;

    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO auditoria (
            tabla_afectada,
            operacion,
            usuario,
            datos_nuevos
        )
        VALUES (
            TG_TABLE_NAME,
            TG_OP,
            current_user,
            row_to_json(NEW)
        );
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_test
AFTER INSERT ON usuarios
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria();

CREATE TRIGGER trg_auditoria_usuarios
AFTER INSERT OR UPDATE OR DELETE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria();

CREATE TRIGGER trg_auditoria_productos
AFTER INSERT OR UPDATE OR DELETE ON productos
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria();

CREATE TRIGGER trg_auditoria_ventas
AFTER INSERT OR UPDATE OR DELETE ON ventas
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria();

CREATE TRIGGER trg_auditoria_detalle_venta
AFTER INSERT OR UPDATE OR DELETE ON detalle_venta
FOR EACH ROW
EXECUTE FUNCTION fn_auditoria();

-- CREAR UNA VISTA --
CREATE VIEW vw_ventas_detalladas AS
SELECT v.id_venta,
       v.fecha,
       c.nombre AS cliente,
       u.nombre AS usuario,
       p.nombre AS producto,
       dv.cantidad,
       dv.precio_unitario,
       (dv.cantidad * dv.precio_unitario) AS total
FROM ventas v
JOIN clientes c ON v.id_cliente = c.id_cliente
JOIN usuarios u ON v.id_usuario = u.id_usuario
JOIN detalle_venta dv ON v.id_venta = dv.id_venta
JOIN productos p ON dv.id_producto = p.id_producto;

-- consultas con JOIN --
SELECT c.nombre, COUNT(v.id_venta) AS total_ventas
FROM clientes c
LEFT JOIN ventas v ON c.id_cliente = v.id_cliente
GROUP BY c.nombre;

-- Consultas con JOIN --
SELECT p.nombre, SUM(dv.cantidad) AS unidades_vendidas
FROM productos p
JOIN detalle_venta dv ON p.id_producto = dv.id_producto
GROUP BY p.nombre
ORDER BY unidades_vendidas DESC;

-- Creacion de INDEX --
CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE INDEX idx_ventas_cliente ON ventas(id_cliente);
CREATE INDEX idx_detalle_producto ON detalle_venta(id_producto);

