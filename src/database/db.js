// TEST FIX - 16/11/2025
import pg from "pg";
const { Pool } = pg;

// =============================
//  POOL
// =============================
export const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: false }
});

export async function query(text, params) {
  const res = await pool.query(text, params);
  return res.rows;
}

// =============================
//  🔵 ACTAS LOCALES
// =============================
export async function getActasByDocumento(documento) {
  const sql = `
    SELECT *
    FROM actas
    WHERE documento = $1
    ORDER BY fecha DESC;
  `;
  return await query(sql, [documento]);
}

export async function getActasByPatente(patente) {
  const sql = `
    SELECT *
    FROM actas
    WHERE patente = $1
    ORDER BY fecha DESC;
  `;
  return await query(sql, [patente]);
}

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
      numero_acta, documento, patente, fecha,
      monto, estado, descripcion, origen
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
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
    numero_acta, documento, patente, fecha,
    monto, estado, descripcion, origen
  ]);
}

// =============================
//  🟢 PAGOS
// =============================
export async function createPagoPendiente({ actaId, dni, monto, mpPreferenceId, mpRaw }) {
  const sql = `
    INSERT INTO pagos (
      acta_id, dni, monto,
      mp_preference_id, mp_raw,
      estado, fecha_creacion
    )
    VALUES ($1,$2,$3,$4,$5,'pendiente',NOW())
    RETURNING *;
  `;
  return await query(sql, [actaId, dni, monto, mpPreferenceId, mpRaw]);
}

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

export async function getPagosByDni(dni) {
  const sql = `
    SELECT *
    FROM pagos
    WHERE dni = $1
    ORDER BY fecha_creacion DESC;
  `;
  return await query(sql, [dni]);
}

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

export async function logMPNotification(payload) {
  const sql = `
    INSERT INTO mp_logs (payload, fecha)
    VALUES ($1, NOW());
  `;
  return await query(sql, [payload]);
}

// =============================
//  🟣 SCRAPER
// =============================
export async function insertActa({ id, patente, fecha, foto, video }) {
  const sql = `
    INSERT INTO scraper_actas (acta_id, patente, fecha, foto, video)
    VALUES ($1,$2,$3,$4,$5)
    ON CONFLICT (acta_id) DO NOTHING
    RETURNING *;
  `;
  return await query(sql, [id, patente, fecha, foto, video]);
}

export async function logScraperError(id, error) {
  const sql = `
    INSERT INTO scraper_errors (acta_id, error, fecha)
    VALUES ($1,$2,NOW());
  `;
  return await query(sql, [id, error]);
}

export async function getLastActa() {
  const sql = `
    SELECT acta_id
    FROM scraper_actas
    ORDER BY acta_id DESC
    LIMIT 1;
  `;
  const rows = await query(sql);
  return rows[0] || null;
}
git add src/src/database/db.js
git commit -m "fix: db.js completo con todas las exportaciones"
git push origin main
