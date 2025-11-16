// =====================================================
//  BASE DE DATOS - SISTEMA DE INFRACCIONES CESA
// =====================================================

import pkg from "pg";
import { ENV } from "../config/env.js";

const { Pool } = pkg;

// =====================================================
//  CONEXIÓN
// =====================================================
export const pool = new Pool({
  host: ENV.DB_HOST,
  port: ENV.DB_PORT,
  user: ENV.DB_USER,
  password: ENV.DB_PASS,
  database: ENV.DB_NAME,
  ssl: true
});

pool.connect()
  .then(() => console.log("[DB] 🟢 Conectado a PostgreSQL"))
  .catch(err => console.error("[DB] 🔴 Error de conexión:", err));

export async function query(sql, params) {
  const result = await pool.query(sql, params);
  return result.rows;
}

// =====================================================
//  ACTAS – INSERCIÓN BÁSICA PARA SCRAPER
// =====================================================
export async function insertActa(data) {
  const sql = `
    INSERT INTO actas (
      acta_numero, patente, fecha, foto_url, video_url
    ) VALUES ($1,$2,$3,$4,$5)
    ON CONFLICT (acta_numero) DO NOTHING
    RETURNING *;
  `;

  const params = [
    data.id,
    data.patente,
    data.fecha,
    data.foto,
    data.video
  ];

  const result = await query(sql, params);
  return result[0];
}

// =====================================================
//  CONSULTAS DE ACTAS
// =====================================================
export async function getLastActa() {
  const sql = `
    SELECT acta_numero
    FROM actas
    ORDER BY acta_numero DESC
    LIMIT 1;
  `;
  const r = await query(sql);
  return r[0] || null;
}

// =====================================================
//  PAGOS – CREAR PENDIENTE
// =====================================================
export async function createPagoPendiente(data) {
  const sql = `
    INSERT INTO pagos (
      acta_id, dni, monto, mp_preference_id, mp_raw, estado, fecha_creado
    ) VALUES ($1,$2,$3,$4,$5,'pendiente',NOW())
    RETURNING *;
  `;

  const params = [
    data.actaId,
    data.dni || null,
    data.monto,
    data.mpPreferenceId,
    data.mpRaw
  ];

  const r = await query(sql, params);
  return r[0];
}

// =====================================================
//  PAGOS – ACTUALIZAR DESDE WEBHOOK
// =====================================================
export async function updatePagoFromWebhook(data) {
  const sql = `
    UPDATE pagos
    SET 
      mp_payment_id = $1,
      mp_status = $2,
      mp_raw = $3,
      estado = CASE 
        WHEN $2 = 'approved' THEN 'pagado'
        ELSE 'pendiente'
      END,
      fecha_actualizado = NOW()
    WHERE mp_preference_id = $4
    RETURNING *;
  `;

  const params = [
    data.mpPaymentId,
    data.mpStatus,
    data.mpRaw,
    data.mpPreferenceId
  ];

  const r = await query(sql, params);
  return r[0];
}

// =====================================================
//  PAGOS – OBTENER POR ACTA
// =====================================================
export async function getPagoPendienteByActa(actaId) {
  const sql = `
    SELECT *
    FROM pagos
    WHERE acta_id = $1
    ORDER BY fecha_creado DESC
    LIMIT 1;
  `;

  const r = await query(sql, [actaId]);
  return r[0];
}

// =====================================================
//  PAGOS – HISTORIAL POR DNI
// =====================================================
export async function getPagosByDni(dni) {
  const sql = `
    SELECT *
    FROM pagos
    WHERE dni = $1
    ORDER BY fecha_creado DESC;
  `;
  return await query(sql, [dni]);
}

// =====================================================
//  LOG NOTIFICACIONES MERCADOPAGO
// =====================================================
export async function logMPNotification(raw) {
  const sql = `
    INSERT INTO mp_logs (payload, fecha)
    VALUES ($1, NOW());
  `;
  return await query(sql, [raw]);
}


