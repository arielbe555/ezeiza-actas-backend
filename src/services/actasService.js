// src/services/actasService.js
import { getPool } from "../config/db.js";
import { logger } from "../utils/logger.js";

/**
 * Busca actas por DNI o CUIT del usuario.
 * 
 * @param {Object} params 
 * @param {string} [params.dni]
 * @param {string} [params.cuit]
 */
export async function buscarActasPorDocumento({ dni, cuit }) {
  const pool = getPool();

  if (!dni && !cuit) {
    const error = new Error("Debe enviar DNI o CUIT para consultar infracciones.");
    error.status = 400;
    throw error;
  }

  const client = await pool.connect();
  try {
    let query = `
      SELECT 
        a.*,
        u.nombre AS usuario_nombre,
        u.email AS usuario_email,
        v.patente AS vehiculo_patente,
        v.marca AS vehiculo_marca,
        v.modelo AS vehiculo_modelo,
        e.nombre AS estado_nombre,
        p.monto AS pago_monto,
        p.fecha AS pago_fecha
      FROM actas a
      LEFT JOIN usuarios u ON u.id = a.usuario_id
      LEFT JOIN vehiculos v ON v.id = a.vehiculo_id
      LEFT JOIN estados e ON e.id = a.estado
      LEFT JOIN pagos p ON p.acta_id = a.id
      WHERE 1=1
    `;

    const values = [];
    let idx = 1;

    if (dni) {
      query += ` AND (u.dni = $${idx})`;
      values.push(dni);
      idx++;
    }

    if (cuit) {
      query += ` AND (u.cuit = $${idx})`;
      values.push(cuit);
      idx++;
    }

    query += " ORDER BY a.fecha DESC";

    logger.debug("Consulta actas:", query, values);

    const res = await client.query(query, values);
    return res.rows;
  } catch (err) {
    logger.error("Error buscando actas por documento:", err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Devuelve un resumen simple para /admin/resumen
 * Cantidad de actas, usuarios, vehículos y pagos.
 */
export async function obtenerResumenSistema() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const [actas, usuarios, vehiculos, pagos] = await Promise.all([
      client.query("SELECT COUNT(*) AS total FROM actas"),
      client.query("SELECT COUNT(*) AS total FROM usuarios"),
      client.query("SELECT COUNT(*) AS total FROM vehiculos"),
      client.query("SELECT COUNT(*) AS total FROM pagos")
    ]);

    return {
      actas: parseInt(actas.rows[0].total, 10) || 0,
      usuarios: parseInt(usuarios.rows[0].total, 10) || 0,
      vehiculos: parseInt(vehiculos.rows[0].total, 10) || 0,
      pagos: parseInt(pagos.rows[0].total, 10) || 0
    };
  } catch (err) {
    logger.error("Error obteniendo resumen del sistema:", err);
    throw err;
  } finally {
    client.release();
  }
}
