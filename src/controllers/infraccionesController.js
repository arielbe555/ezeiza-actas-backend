import { query } from "../database/db.js";

// ================================
// LISTAR TODAS
// ================================
export async function listarInfracciones(req, res) {
  try {
    const result = await query(
      "SELECT * FROM infracciones ORDER BY fecha DESC LIMIT 100"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error listarInfracciones:", err);
    res.status(500).json({ error: "Error obteniendo infracciones" });
  }
}

// ================================
// CREAR
// ================================
export async function crearInfraccion(req, res) {
  try {
    const { dominio, dni, cuit, descripcion, monto } = req.body;

    const result = await query(
      `INSERT INTO infracciones (dominio, dni, cuit, descripcion, monto)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [dominio, dni, cuit, descripcion, monto]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error crearInfraccion:", err);
    res.status(500).json({ error: "Error creando infracción" });
  }
}

// ================================
// POR DOMINIO
// ================================
export async function consultarPorDominio(req, res) {
  try {
    const { dominio } = req.params;

    const result = await query(
      "SELECT * FROM infracciones WHERE dominio = $1 ORDER BY fecha DESC",
      [dominio]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error consultarPorDominio:", err);
    res.status(500).json({ error: "Error consultando por dominio" });
  }
}

// ================================
// POR DNI
// ================================
export async function consultarPorDni(req, res) {
  try {
    const { dni } = req.params;

    const result = await query(
      "SELECT * FROM infracciones WHERE dni = $1 ORDER BY fecha DESC",
      [dni]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error consultarPorDni:", err);
    res.status(500).json({ error: "Error consultando por DNI" });
  }
}

// ================================
// POR CUIT
// ================================
export async function consultarPorCuit(req, res) {
  try {
    const { cuit } = req.params;

    const result = await query(
      "SELECT * FROM infracciones WHERE cuit = $1 ORDER BY fecha DESC",
      [cuit]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error consultarPorCuit:", err);
    res.status(500).json({ error: "Error consultando por CUIT" });
  }
}

