import pg from "pg";
const { Pool } = pg;

// Conexión con Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Render requiere SSL
});

/**
 * Función general para consultas
 */
export async function query(sql, params = []) {
  const result = await pool.query(sql, params);
  return result;
}

/**
 * Probar conexión
 */
export async function test() {
  await pool.query("SELECT 1");
  return true;
}

/**
 * Insertar acta (scraper)
 */
export async function insertActa({ id, patente, fecha, foto, video }) {
  await pool.query(
    `INSERT INTO actas (id, patente, fecha, foto, video)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO NOTHING`,
    [id, patente, fecha, foto, video]
  );
}

/**
 * Obtener última acta
 */
export async function getLastActa() {
  const result = await pool.query(
    "SELECT * FROM actas ORDER BY id DESC LIMIT 1"
  );
  return result.rows[0] || null;
}
