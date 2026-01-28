# Proyecto Final B2 – Bases de Datos  
## PostgreSQL + Frontend

**Escuela Politécnica Nacional**  
**Escuela de Formación de Tecnólogos (ESFOT)**  

**Asignatura:** Bases de Datos  
**Docente:** Ing. Yadira Franco  
**Período académico:** 2025-B  

**Estudiante:** Kevin Javier Chacón  

---

## Descripción del Proyecto

Este proyecto corresponde al **Proyecto Final del Segundo Bimestre** de la asignatura Bases de Datos.  
Consiste en el diseño, implementación y documentación de una **base de datos relacional en PostgreSQL**, acompañada de un **frontend web** que permite visualizar y gestionar la información del sistema.

El caso práctico simula una **tienda online**, orientada a pequeñas y medianas empresas, que necesitan controlar usuarios, clientes, productos, ventas e inventario de forma segura y centralizada.

---

## Objetivo General

Diseñar, implementar y administrar una base de datos relacional utilizando PostgreSQL, aplicando principios de modelado, normalización y seguridad para resolver un caso práctico realista de gestión de información.

---

## Objetivos Específicos

- Analizar los requerimientos del sistema para identificar entidades y relaciones.
- Construir un modelo entidad–relación normalizado hasta la **Tercera Forma Normal (3FN)**.
- Implementar la base de datos en PostgreSQL con claves primarias, foráneas y restricciones.
- Garantizar integridad, seguridad y trazabilidad mediante auditoría.
- Documentar el proceso de diseño y desarrollo del sistema.
- Integrar la base de datos con un frontend web moderno.

---

## Funcionalidades del Sistema

- Gestión de usuarios y roles.
- Registro de clientes.
- Gestión de productos e inventario.
- Registro de ventas y detalle de ventas.
- Consultas con JOIN y agregaciones.
- Auditoría automática de operaciones críticas.
- Generación de reportes mediante vistas.

---

## Modelo de Base de Datos

### Entidades Principales
- **Rol**
- **Usuario**
- **Cliente**
- **Producto**
- **Venta**
- **Detalle_Venta**
- **Auditoría**

El modelo fue normalizado hasta **3FN**, evitando redundancia y asegurando consistencia de datos.

---

## Implementación en PostgreSQL

- Creación de tablas con restricciones de integridad.
- Uso de **triggers de auditoría** para registrar INSERT, UPDATE y DELETE.
- Implementación de **vistas** para reportes de ventas.
- Consultas con JOIN y funciones de agregación.
- Creación de **índices** para optimizar el rendimiento.
- Uso de `EXPLAIN` para análisis de consultas.

---

## Seguridad

- Uso de roles y permisos en PostgreSQL.
- Auditoría automática de cambios.
- Preparación para respaldos de la base de datos con `pg_dump`.
- Diseño orientado a autenticación y autorización con JWT en el backend.

---

## rontend

### Tecnologías Utilizadas
- **React.js**
- **Vite**
- **Tailwind CSS**
- **JavaScript (ES6+)**
- **CSS**

### Objetivo del Frontend
- Proporcionar una interfaz gráfica amigable.
- Facilitar la navegación entre vistas.
- Consumir servicios del backend mediante API REST.
- Presentar información de forma clara y responsiva.

---

## Enlaces del Proyecto

🔗 **Repositorio GitHub**  
https://github.com/xGlitchWolfx/ProyectoB2_Bases_de_datos  

*Despliegue**  
- Frontend: https://proyectob2-bases-de-datos-frontend.onrender.com  
- Backend: https://proyectob2-bases-de-datos.onrender.com  

---

## Estado del Proyecto

- Base de datos implementada y documentada.
- Auditoría y consultas avanzadas funcionales.
- Frontend operativo.
- Backend en proceso de ampliación y mejora.

---

Proyecto desarrollado con fines académicos para la asignatura **Bases de Datos – ESFOT / EPN**.
