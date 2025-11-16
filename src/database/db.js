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
//  CONSULTAS LOCALES
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

// ======================================
//  UPSERT DE ACTAS EXTERNAS (Infratrack)
// ======================================
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
