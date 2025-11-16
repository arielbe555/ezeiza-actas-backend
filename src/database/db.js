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

// =====================================================
//  UTILIDAD
// =====================================================
export async function query(sql, params) {
  const result = await pool.query(sql, params);
  return result.rows;
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

  const result = await query(sql, params);
  return result[0];
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
  const data = await query(sql, [id]);
  return data[0];
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
  return query(sql);
}

export async function getActasPropias() {
  const sql = `
    SELECT *
    FROM actas
    WHERE tipo_origen = 'propia'
    ORDER BY fecha DESC;
  `;
  return query(sql);
}

// =====================================================
//  ACTAS – PAGOS
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

  const result = await query(sql, [actaId, comprobante, mpJSON]);
  return result[0];
}

export async function marcarActaComoPagada(actaId) {
  const sql = `
    UPDATE actas
    SET estado = 'pagada'
    WHERE id = $1
    RETURNING *;
  `;

  const result = await query(sql, [actaId]);
  return result[0];
}

// =====================================================
//  SCRAPER – LOGS Y ESTADO
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
//  AUDITORÍA – CONSULTAS
// =====================================================
export async function logConsulta(documento, ip) {
  const sql = `
    INSERT INTO consultas (
      documento,
      ip,
      fecha
    ) VALUES ($1,$2,NOW());
  `;
  await query(sql, [documento, ip]);
}

export async function logAccion(usuarioId, descripcion) {
  const sql = `
    INSERT INTO auditoria (
      usuario_id,
      descripcion,
      fecha
    ) VALUES ($1,$2,NOW());
  `;
  await query(sql, [usuarioId, descripcion]);
}

// =====================================================
//  RESUMEN GENERAL PARA DASHBOARD
// =====================================================
export async function getDashboardResumen() {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM actas) AS total_actas,
      (SELECT COUNT(*) FROM actas WHERE estado='pendiente') AS pendientes,
      (SELECT COUNT(*) FROM actas WHERE estado='pagada') AS pagadas,
      (SELECT COUNT(*) FROM actas WHERE tipo_origen='externa') AS externas,
      (SELECT COUNT(*) FROM actas WHERE tipo_origen='propia') AS propias
  `;
  const r = await query(sql);
  return r[0];
}

