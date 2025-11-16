// src/database/db.js
import pg from "pg";
import { ENV } from "../config/env.js";

const { Pool } = pg;

// ======================================================
//  🟢 CONEXIÓN A POSTGRES
// ======================================================
export const pool = new Pool({
  connectionString: ENV.DB_URL,
  ssl: ENV.DB_SSL ? { rejectUnauthorized: false } : false
});

// Helper universal
export async function query(text, params) {
  const result = await pool.query(text, params);
  return result.rows;
}

// ======================================================
//  🔵 ACTAS – CONSULTAS PRINCIPALES
// ======================================================

// Por DNI / CUIT / DOCUMENTO
export async function getActasByDocumento(documento) {
  const sql = `
    SELECT *
    FROM actas
    WHERE documento = $1
    ORDER BY fecha DESC;
  `;
  return await query(sql, [documento]);
}

// Por patente / dominio
export async function getActasByPatente(patente) {
  const sql = `
    SELECT *
    FROM actas
    WHERE patente = $1
    ORDER BY fecha DESC;
  `;
  return await query(sql, [patente]);
}

// Insertar o actualizar acta externa automáticamente
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
      patente   = EXCLUDED.patente,
      fecha     = EXCLUDED.fecha,
      monto     = EXCLUDED.monto,
      estado    = EXCLUDED.estado,
      descripcion = EXCLUDED.descripcion,
      origen    = EXCLUDED.origen
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

// ======================================================
//  💳 PAGOS (MercadoPago)
// ======================================================

// Crear pago pendiente
export async function createPagoPendiente({ actaId, dni, monto, mpPreferenceId, mpRaw }) {
  const sql = `
    INSERT INTO pagos (
      acta_id,
      dni,
      monto,
      mp_preference_id,
      mp_raw,
      estado,
      fecha_creacion
    )
    VALUES ($1,$2,$3,$4,$5,'pendiente',NOW())
    RETURNING *;
  `;
  return await query(sql, [actaId, dni, monto, mpPreferenceId, mpRaw]);
}

// Último pago pendiente por acta
export async function getPagoPendienteByActa(actaId) {
  const sql = `
    SELECT *
    FROM pagos
    WHERE acta_id = $1
    ORDER BY fecha_creacion DESC
    LIMIT 1;
  `;
  const rows = await query(sql, [actaId]);
  return rows[0] || null;
}

// Historial de pagos por DNI
export async function getPagosByDni(dni) {
  const sql = `
    SELECT *
    FROM pagos
    WHERE dni = $1
    ORDER BY fecha_creacion DESC;
  `;
  return await query(sql, [dni]);
}

// Registrar payload completo del webhook
export async function logMPNotification(payload) {
  const sql = `
    INSERT INTO mp_logs (payload, fecha)
    VALUES ($1, NOW());
  `;
  return await query(sql, [payload]);
}

// Actualizar pago desde webhook MP
export async function updatePagoFromWebhook({ mpPreferenceId, mpStatus, mpPaymentId, mpRaw }) {
  const sql = `
    UPDATE pagos
    SET estado = $2,
        mp_payment_id = $3,
        mp_raw = $4,
        fecha_aprobacion = NOW()
    WHERE mp_preference_id = $1
    RETURNING *;
  `;
  return await query(sql, [mpPreferenceId, mpStatus, mpPaymentId, mpRaw]);
}
