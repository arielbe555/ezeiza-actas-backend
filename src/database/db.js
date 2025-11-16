// ============================================
// CONEXIÓN A POSTGRES
// ============================================

import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ============================================
// INSERTAR ACTA
// ============================================

export async function insertActa({ id, patente, fecha, foto, video }) {
  await pool.query(
    `INSERT INTO actas (acta_id, patente, fecha, foto_url, video_url)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (acta_id) DO NOTHING`,
    [id, patente, fecha, foto, video]
  );
}

// ============================================
// OBTENER ÚLTIMA ACTA GUARDADA
// ============================================

export async function getLastActa() {
  const result = await pool.query(
    "SELECT * FROM actas ORDER BY acta_id DESC LIMIT 1"
  );
  return result.rows[0] || null;
}

// ============================================
// LOG DE ERRORES DEL SCRAPER
// ============================================

export async function logScraperError(actaId, errorMsg) {
  await pool.query(
    `INSERT INTO scraper_log (acta_id, error, fecha)
     VALUES ($1, $2, NOW())`,
    [actaId, errorMsg]
  );
}

// ============================================
// PRUEBA DE CONEXIÓN (OPCIONAL)
// ============================================

export async function testDB() {
  const r = await pool.query("SELECT NOW()");
  return r.rows[0];
}
