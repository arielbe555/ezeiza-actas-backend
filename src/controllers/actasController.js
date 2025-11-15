import { query, insertActa, getLastActa } from "../database/db.js";

// Listar actas
export async function listarActas(req, res) {
  try {
    const result = await query(
      "SELECT id, patente, fecha, foto, video FROM actas ORDER BY fecha DESC LIMIT 50"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error listarActas:", err);
    res.status(500).json({ error: "Error obteniendo actas" });
  }
}

// Obtener una acta por ID
export async function obtenerActa(req, res) {
  try {
    const { id } = req.params;

    const result = await query("SELECT * FROM actas WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Acta no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error obtenerActa:", err);
    res.status(500).json({ error: "Error obteniendo acta" });
  }
}

// Crear acta manualmente
export async function crearActa(req, res) {
  try {
    const { id, patente, fecha, foto, video } = req.body;

    await insertActa({ id, patente, fecha, foto, video });

    res.status(201).json({ mensaje: "Acta creada OK" });
  } catch (err) {
    console.error("Error crearActa:", err);
    res.status(500).json({ error: "Error creando acta" });
  }
}

// Obtener última acta cargada
export async function ultimaActa(req, res) {
  try {
    const acta = await getLastActa();
    res.json(acta || {});
  } catch (err) {
    console.error("Error getLastActa:", err);
    res.status(500).json({ error: "Error obteniendo última acta" });
  }
}

