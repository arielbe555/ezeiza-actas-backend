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
  ssl: { rejectUnauthorized: false }
});

pool.connect()
  .then(() => console.log("[DB] 🟢 Conectado a PostgreSQL"))
  .catch(err => console.error("[DB] 🔴 Error de conexión:", err.message));

// =====================================================
//  UTILIDAD GENERAL
// =====================================================
export async function query(sql, params) {
  try {
    const r = await pool.query(sql, params);
    return r.rows;
  } catch (err) {
    console.error("[DB] ❌ Error en consulta:", err.message);
    throw err;
  }
}

// =====================================================
//  ACTAS – ALTA
// =====================================================
export async function insertActa(data) {
  const sql = `
    INSERT INTO actas (
      acta_numero,
      dni,
      cuit,
      patente,
      tipo_origen,
      fecha,
      hora,
      motivo,
      monto,
      estado,
      foto_url,
      video_url
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pendiente',$10,$11)
    RETURNING *;
  `;

  const params = [
    data.acta_numero,
    data.dni || null,
    data.cuit || null,
    data.patente,
    data.tipo_origen || "externa",
    data.fecha,
    data.hora || null,
    data.motivo || "No especificado",
    data.monto || 0,
    data.foto_url || null,
    data.video_url || null
  ];

  const r = await query(sql, params);
  return r[0];
}

// =====================================================
//  ACTAS – OBTENER
// =====================================================
export async function getActasByDocumento(documento) {
  const sql = `
    SELECT *
    FROM actas
    WHERE dni = $1 OR cuit = $1 OR patente = $1
    ORDER BY fecha DESC;
  `;
  return await query(sql, [documento]);
}

export async function getActaById(id) {
  const sql = `SELECT * FROM actas WHERE id = $1 LIMIT 1;`;
  const r = await query(sql, [id]);
  return r[0];
}

export async function getActasPendientes() {
  const sql = `
    SELECT *
    FROM actas
    WHERE estado = 'pendiente'
    ORDER BY fecha DESC;
  `;
  return await query(sql);
}

export async function getActasExternas() {
  const sql = `
    SELECT *
    FROM actas
    WHERE tipo_origen = 'externa'
    ORDER BY fecha DESC;
  `;
  return await query(sql);
}

export async function getActasPropias() {
  const sql = `
    SELECT *
    FROM actas
    WHERE tipo_origen = 'propia'
    ORDER BY fecha DESC;
  `;
  return await query(sql);
}

// =====================================================
//  ACTAS – CAMBIAR ESTADO
// =====================================================
export async function setActaEstado(id, estado) {
  const sql = `
    UPDATE actas
    SET estado = $2
    WHERE id = $1
    RETURNING *;
  `;
  const r = await query(sql, [id, estado]);
  return r[0];
}

// =====================================================
//  PAGOS PENDIENTES (MERCADO PAGO)
// =====================================================
export async function createPagoPendiente({
  acta_id,
  monto,
  medio,
  estado = "pendiente",
  referencia_externa = null
}) {
  const sql = `
    INSERT INTO pagos_pendientes (
      acta_id,
      monto,
      medio,
      estado,
      referencia_externa,
      creado_en
    ) VALUES ($1,$2,$3,$4,$5,NOW())
    RETURNING *;
  `;

  const params = [
    acta_id,
    monto,
    medio,
    estado,
    referencia_externa
  ];

  const r = await query(sql, params);
  return r[0];
}

export async function getPagoPendienteById(id) {
  const sql = `
    SELECT *
    FROM pagos_pendientes
    WHERE id = $1 LIMIT 1;
  `;
  const r = await query(sql, [id]);
  return r[0];
}

export async function getPagoPendienteByActa(actaId) {
  const sql = `
    SELECT *
    FROM pagos_pendientes
    WHERE acta_id = $1
    ORDER BY creado_en DESC
    LIMIT 1;
  `;
  const r = await query(sql, [actaId]);
  return r[0];
}

export async function updatePagoPendiente(id, estado, referencia) {
  const sql = `
    UPDATE pagos_pendientes
    SET estado = $2,
        referencia_externa = $3
    WHERE id = $1
    RETURNING *;
  `;
  const r = await query(sql, [id, estado, referencia]);
  return r[0];
}

export async function getPagosPendientes() {
  const sql = `
    SELECT *
    FROM pagos_pendientes
    ORDER BY creado_en DESC;
  `;
  return await query(sql);
}

// =====================================================
//  PAGOS – REGISTRO FINAL
// =====================================================
export async function registrarPago(actaId, comprobante, mpJSON) {
  const sql = `
    INSERT INTO pagos (
      acta_id,
      comprobante,
      datos_mp,
      fecha_pago
    ) VALUES ($1,$2,$3,NOW())
    RETURNING *;
  `;
  const r = await query(sql, [actaId, comprobante, mpJSON]);
  return r[0];
}

export async function marcarActaComoPagada(actaId) {
  return await setActaEstado(actaId, "pagada");
}

export async function registrarPagoMP({
  actaId,
  mp_id,
  mp_status,
  mp_raw
}) {
  const sql = `
    INSERT INTO pagos (
      acta_id,
      comprobante,
      datos_mp,
      fecha_pago
    ) VALUES ($1,$2,$3,NOW())
    RETURNING *;
  `;

  const r = await query(sql, [
    actaId,
    mp_id,
    mp_raw
  ]);

  await setActaEstado(actaId, "pagada");

  return r[0];
}

// =====================================================
//  SCRAPER LOGS
// =====================================================
export async function logScraperError(actaId, errorMsg) {
  const sql = `
    INSERT INTO scraper_logs (acta_id, error, fecha)
    VALUES ($1,$2,NOW());
  `;
  return await query(sql, [actaId, errorMsg]);
}

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
//  AUDITORÍA
// =====================================================
export async function logConsulta(documento, ip) {
  const sql = `
    INSERT INTO consultas (documento, ip, fecha)
    VALUES ($1,$2,NOW());
  `;
  await query(sql, [documento, ip]);
}

export async function logAccion(usuarioId, descripcion) {
  const sql = `
    INSERT INTO auditoria (usuario_id, descripcion, fecha)
    VALUES ($1,$2,NOW());
  `;
  await query(sql, [usuarioId, descripcion]);
}

// =====================================================
//  DASHBOARD
// =====================================================
export async function getDashboardResumen() {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM actas) AS total_actas,
      (SELECT COUNT(*) FROM actas WHERE estado='pendiente') AS pendientes,
      (SELECT COUNT(*) FROM actas WHERE estado='pagada') AS pagadas,
      (SELECT COUNT(*) FROM actas WHERE tipo_origen='externa') AS externas,
      (SELECT COUNT(*) FROM actas WHERE tipo_origen='propia') AS propias;
  `;
  const r = await query(sql);
  return r[0];
}


