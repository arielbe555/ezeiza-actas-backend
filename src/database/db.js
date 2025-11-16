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
// ACTAS
// ============================================
export async function insertActa({ id, patente, fecha, foto, video }) {
  await pool.query(
    `INSERT INTO actas (acta_id, patente, fecha, foto_url, video_url)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (acta_id) DO NOTHING`,
    [id, patente, fecha, foto, video]
  );
}

export async function getLastActa() {
  const result = await pool.query(
    "SELECT * FROM actas ORDER BY acta_id DESC LIMIT 1"
  );
  return result.rows[0] || null;
}

// ============================================
// LOG SCRAPER
// ============================================
export async function logScraperError(actaId, errorMsg) {
  await pool.query(
    `INSERT INTO scraper_log (acta_id, error, fecha)
     VALUES ($1, $2, NOW())`,
    [actaId, errorMsg]
  );
}

// ============================================
// PAGOS - CREAR PENDIENTE
// ============================================
export async function createPagoPendiente({
  actaId,
  dni,
  monto,
  mpPreferenceId,
  mpRaw
}) {
  const result = await pool.query(
    `INSERT INTO pagos_actas
      (acta_id, dni, monto, mp_preference_id, mp_status, mp_raw)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [actaId, dni || null, monto, mpPreferenceId, "pending", mpRaw]
  );
  return result.rows[0];
}

// ============================================
// PAGOS - ACTUALIZAR DESDE WEBHOOK
// ============================================
export async function updatePagoFromWebhook({
  mpPreferenceId,
  mpPaymentId,
  mpStatus,
  mpRaw
}) {
  const result = await pool.query(
    `UPDATE pagos_actas
       SET mp_payment_id = $2,
           mp_status = $3,
           mp_raw = $4,
           actualizado_en = NOW()
     WHERE mp_preference_id = $1
     RETURNING *`,
    [mpPreferenceId, mpPaymentId, mpStatus, mpRaw]
  );

  // Si no existía (edge case), registramos nuevo
  if (result.rowCount === 0) {
    const insert = await pool.query(
      `INSERT INTO pagos_actas
        (acta_id, monto, mp_preference_id, mp_payment_id, mp_status, mp_raw)
       VALUES (NULL, 0, $1, $2, $3, $4)
       RETURNING *`,
      [mpPreferenceId, mpPaymentId, mpStatus, mpRaw]
    );
    return insert.rows[0];
  }

  return result.rows[0];
}

// ============================================
// PAGOS - CONSULTAS
// ============================================
export async function getPagoByActa(actaId) {
  const result = await pool.query(
    `SELECT * FROM pagos_actas
      WHERE acta_id = $1
      ORDER BY id DESC
      LIMIT 1`,
    [actaId]
  );
  return result.rows[0] || null;
}

export async function getPagosByDni(dni) {
  const result = await pool.query(
    `SELECT * FROM pagos_actas
      WHERE dni = $1
      ORDER BY actualizado_en DESC`,
    [dni]
  );
  return result.rows;
}

// ============================================
// LOG NOTIFICACIONES MP (WEBHOOK)
// ============================================
export async function logMPNotification(raw) {
  await pool.query(
    `INSERT INTO mp_notifications_log (data_raw)
     VALUES ($1)`,
    [raw]
  );
}

// ============================================
// TEST DB
// ============================================
export async function testDB() {
  const r = await pool.query("SELECT NOW()");
  return r.rows[0];
}

