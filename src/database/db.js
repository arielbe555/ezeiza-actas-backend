// src/database/db.js
import pg from "pg";
import { ENV } from "../config/env.js";

const { Pool } = pg;

// ======================================
//  POOL DE CONEXIÓN
// ======================================
export const pool = new Pool({
  connectionString: ENV.DB_URL,
  ssl: ENV.DB_SSL ? { rejectUnauthorized: false } : false
});

// Helper para queries
export async function query(text, params) {
  const result = await pool.query(text, params);
  return result.rows;
}

// ======================================
//  🔵 CONSULTAS DE ACTAS
// ======================================

// Buscar actas por DNI/CUIT/DOCUMENTO
export async function getActasByDocumento(documento) {
  const sql = `
    SELECT *
    FROM actas
    WHERE documento = $1
    ORDER BY fecha DESC;
  `;
  return await query(sql, [documento]);
}

// Buscar actas por patente/dominio
export async function getActasByPatente(patente) {
  const sql = `
    SELECT *
    FROM actas
    WHERE patente = $1
    ORDER BY fecha DESC;
  `;
  return await query(sql, [patente]);
}

// Insertar o actualizar actas externas
export async function upsertActaExterna({
  numero_acta,
  documento,
  patente,
  fecha,
  monto,
  estado,
  descripcion,
  origen
}) {
  const sql = `
    INSERT INTO actas (
      numero_acta,
      documento,
      patente,
      fecha,
      monto,
      estado,
      descripcion,
      origen
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (numero_acta)
    DO UPDATE SET
      documento = EXCLUDED.documento,
      patente = EXCLUDED.patente,
      fecha = EXCLUDED.fecha,
      monto = EXCLUDED.monto,
      estado = EXCLUDED.estado,
      descripcion = EXCLUDED.descripcion,
      origen = EXCLUDED.origen
    RETURNING *;
  `;

  return await query(sql, [
    numero_acta,
    documento,
    patente,
    fecha,
    monto,
    estado,
    descripcion,
    origen
  ]);
}

// ======================================
//  🟢 PAGOS
// ======================================

// Crear pago pendiente
export async function createPagoPendiente({
  acta_id,
  monto,
  medio_pago
}) {
  const sql = `
    INSERT INTO pagos (
      acta_id,
      monto,
      medio_pago,
      estado,
      fecha_creacion
    )
    VALUES ($1, $2, $3, 'pendiente', NOW())
    RETURNING *;
  `;
  return await query(sql, [acta_id, monto, medio_pago]);
}

// Actualizar pago como aprobado
export async function marcarPagoAprobado(pago_id) {
  const sql = `
    UPDATE pagos
    SET estado = 'aprobado',
        fecha_aprobacion = NOW()
    WHERE id = $1
    RETURNING *;
  `;
  return await query(sql, [pago_id]);
}

// Consultar pagos por acta
export async function getPagosByActa(acta_id) {
  const sql = `
    SELECT *
    FROM pagos
    WHERE acta_id = $1
    ORDER BY fecha_creacion DESC;
  `;
  return await query(sql, [acta_id]);
}

// ======================================
//  🟣 CONCILIACIÓN BANCARIA
// ======================================
export async function registrarConciliacion({
  pago_id,
  referencia,
  importe,
  fecha
}) {
  const sql = `
    INSERT INTO conciliaciones (
      pago_id,
      referencia,
      importe,
      fecha
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  return await query(sql, [pago_id, referencia, importe, fecha]);
}
