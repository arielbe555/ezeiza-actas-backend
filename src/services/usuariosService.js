// src/services/usuariosService.js
import { pool as getPool } from "../database/db.js";
import { logger } from "../utils/logger.js";

export async function buscarUsuarioPorDocumento({ dni, cuit }) {
  const pool = getPool();

  if (!dni && !cuit) {
    const error = new Error("Debe enviar DNI o CUIT.");
    error.status = 400;
    throw error;
  }

  const client = await pool.connect();
  try {
    let query = "SELECT * FROM usuarios WHERE 1=1";
    const values = [];
    let idx = 1;

    if (dni) {
      query += ` AND dni = $${idx}`;
      values.push(dni);
      idx++;
    }

    if (cuit) {
      query += ` AND cuit = $${idx}`;
      values.push(cuit);
      idx++;
    }

    const res = await client.query(query, values);
    return res.rows[0] || null;
  } catch (err) {
    logger.error("Error buscando usuario por documento:", err);
    throw err;
  } finally {
    client.release();
  }
}
