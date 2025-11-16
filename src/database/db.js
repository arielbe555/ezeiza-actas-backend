// src/database/db.js
import { pool } from "../config/db.js";

/**
 * Devuelve actas locales por DNI/CUIT del titular (tabla vehiculos.dni_propietario)
 */
export async function getActasByDocumento(documento) {
  const query = `
    SELECT
      a.id,
      a.numero_acta,
      a.fecha,
      a.ubicacion,
      a.velocidad_permitida,
      a.velocidad_registrada,
      a.monto,
      a.estado,
      a.fecha_registro,
      a.fecha_pago,
      v.patente,
      v.dni_propietario AS documento,
      v.telefono,
      v.direccion,
      COALESCE(p.id IS NOT NULL, false) AS pagada
    FROM actas a
    JOIN vehiculos v ON a.vehiculo_id = v.id
    LEFT JOIN pagos p ON p.acta_id = a.id
    WHERE v.dni_propietario = $1
    ORDER BY a.fecha DESC NULLS LAST;
  `;

  const { rows } = await pool.query(query, [documento]);
  return rows;
}

/**
 * Devuelve actas locales por dominio/patente
 */
export async function getActasByPatente(patente) {
  const query = `
    SELECT
      a.id,
      a.numero_acta,
      a.fecha,
      a.ubicacion,
      a.velocidad_permitida,
      a.velocidad_registrada,
      a.monto,
      a.estado,
      a.fecha_registro,
      a.fecha_pago,
      v.patente,
      v.dni_propietario AS documento,
      v.telefono,
      v.direccion,
      COALESCE(p.id IS NOT NULL, false) AS pagada
    FROM actas a
    JOIN vehiculos v ON a.vehiculo_id = v.id
    LEFT JOIN pagos p ON p.acta_id = a.id
    WHERE v.patente = $1
    ORDER BY a.fecha DESC NULLS LAST;
  `;

  const { rows } = await pool.query(query, [patente]);
  return rows;
}

/**
 * Inserta un acta que viene de un scraper externo (si no existe) para ir
 * consolidando la base local. Se apoya en numero_acta como clave lógica.
 */
export async function upsertActaExterna(acta) {
  const {
    numero_acta,
    documento,
    patente,
    fecha,
    monto,
    estado,
    descripcion,
    origen
  } = acta;

  // MUY simplificado: asume que ya existe vehiculo y usuario,
  // o en su defecto crea un vehiculo básico.
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let vehiculoId;
    const vehSel = await client.query(
      `SELECT id FROM vehiculos WHERE patente = $1`,
      [patente]
    );

    if (vehSel.rows.length) {
      vehiculoId = vehSel.rows[0].id;
    } else {
      const vehIns = await client.query(
        `INSERT INTO vehiculos (patente, dni_propietario)
         VALUES ($1, $2)
         RETURNING id`,
        [patente, documento]
      );
      vehiculoId = vehIns.rows[0].id;
    }

    const actSel = await client.query(
      `SELECT id FROM actas WHERE numero_acta = $1`,
      [numero_acta]
    );

    if (!actSel.rows.length) {
      await client.query(
        `INSERT INTO actas
          (numero_acta, vehiculo_id, fecha, monto, estado, ubicacion, observaciones)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          numero_acta,
          vehiculoId,
          fecha,
          monto,
          estado,
          "Origen externo " + (origen || "Ezeiza"),
          descripcion || null
        ]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[DB] Error upsertActaExterna:", err);
  } finally {
    client.release();
  }
}
export async function logScraperError(actaId, errorMsg) {
  await pool.query(
    `INSERT INTO scraper_log (acta_id, error, fecha) VALUES ($1, $2, NOW())`,
    [actaId, errorMsg]
  );
}
export async function logScraperError(actaId, errorMsg) {
  await pool.query(
    `INSERT INTO scraper_log (acta_id, error, fecha) VALUES ($1, $2, NOW())`,
    [actaId, errorMsg]
  );
}

