// =============================================
//  DATABASE - Conexión PostgreSQL Render
// =============================================

import pg from "pg";
const { Pool } = pg;

// =============================================
//  VALIDACIÓN DE ENV
// =============================================
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ ERROR FATAL: DATABASE_URL no está definida.");
  process.exit(1);
}

console.log("🔵 [DB] Conectando a PostgreSQL Render...");

// =============================================
//  POOL GLOBAL
// =============================================
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

export default pool;

// =============================================
//  FUNCIÓN BASE query()
// =============================================
export async function query(sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    return result;
  } catch (err) {
    console.error("❌ ERROR en query():", err);
    throw err;
  }
}

// ======================================================
// TABLA REAL: actas_camaras
// ======================================================
export async function insertarActaLocal({
  idActa,
  patente,
  velocidad,
  velocidadPermitida,
  lat,
  lng,
  direccion,
  camaraId
}) {
  const sql = `
    INSERT INTO actas_camaras (
      idActa,
      patente,
      velocidad,
      velocidadPermitida,
      lat,
      lng,
      direccion,
      camaraId,
      fecha,
      estado
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW(), 'pendiente')
    RETURNING *;
  `;

  return await query(sql, [
    idActa,
    patente,
    velocidad,
    velocidadPermitida,
    lat,
    lng,
    direccion,
    camaraId
  ]);
}

// ======================================================
// SCRAPER → TABLA scraper_actas
// ======================================================
export async function insertActa({
  acta,
  fecha,
  hora,
  dominio,
  marca,
  modelo,
  lugar,
  imagen_path,
  video_path,
  velocidad_registrada,
  velocidad_maxima
}) {
  const sql = `
    INSERT INTO scraper_actas (
      acta_id,
      fecha,
      hora,
      dominio,
      marca,
      modelo,
      lugar,
      imagen,
      video,
      vel_registrada,
      vel_maxima
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    ON CONFLICT (acta_id)
    DO UPDATE SET
      fecha = EXCLUDED.fecha,
      dominio = EXCLUDED.dominio,
      marca = EXCLUDED.marca,
      modelo = EXCLUDED.modelo,
      lugar = EXCLUDED.lugar,
      imagen = EXCLUDED.imagen,
      video = EXCLUDED.video,
      vel_registrada = EXCLUDED.vel_registrada,
      vel_maxima = EXCLUDED.vel_maxima
    RETURNING *;
  `;

  return await query(sql, [
    acta,
    fecha,
    hora,
    dominio,
    marca,
    modelo,
    lugar,
    imagen_path,
    video_path,
    velocidad_registrada,
    velocidad_maxima
  ]);
}

export async function logScraperError(error) {
  const sql = `
      INSERT INTO scraper_errors (error, fecha)
      VALUES ($1, NOW());
  `;
  return await query(sql, [error]);
}

// ======================================================
// CÁMARAS — CONSULTAS
// ======================================================
export async function getActasByPatente(patente) {
  const sql = `
    SELECT *
    FROM actas_camaras
    WHERE patente = $1
    ORDER BY fecha DESC;
  `;
  const r = await query(sql, [patente]);
  return r.rows;
}

export async function getActaById(idActa) {
  const sql = `
    SELECT *
    FROM actas_camaras
    WHERE idActa = $1;
  `;
  const r = await query(sql, [idActa]);
  return r.rows[0] || null;
}

// ======================================================
// PAGOS — MERCADOPAGO
// ======================================================
export async function createPagoPendiente({
  actaId,
  dni,
  monto,
  mpPreferenceId,
  mpRaw
}) {
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

export async function getPagoPendienteByActa(actaId) {
  const sql = `
    SELECT *
    FROM pagos
    WHERE acta_id = $1
    ORDER BY fecha_creacion DESC
    LIMIT 1;
  `;
  const r = await query(sql, [actaId]);
  return r.rows[0] || null;
}

export async function updatePagoFromWebhook({
  mpPreferenceId,
  mpStatus,
  mpPaymentId,
  mpRaw
}) {
  const sql = `
    UPDATE pagos
    SET estado = $2,
        mp_payment_id = $3,
        mp_raw = $4,
        fecha_aprobacion = NOW()
    WHERE mp_preference_id = $1
    RETURNING *;
  `;
  return await query(sql, [
    mpPreferenceId,
    mpStatus,
    mpPaymentId,
    mpRaw
  ]);
}

export async function getPagosByDni(dni) {
  const sql = `
    SELECT *
    FROM pagos
    WHERE dni = $1
    ORDER BY fecha_creacion DESC;
  `;
  const r = await query(sql, [dni]);
  return r.rows;
}

export async function logMPNotification(payload) {
  const sql = `
    INSERT INTO mp_logs (payload, fecha)
    VALUES ($1, NOW());
  `;
  return await query(sql, [payload]);
}
// ======================================================
// Registrar Upload (foto / video) → uploads_log
// ======================================================
export async function registrarUpload({
  idActa,
  tipo,
  ruta,
  camaraId
}) {
  const sql = `
    INSERT INTO uploads_log (acta_id, tipo, ruta, camara_id, fecha)
    VALUES ($1,$2,$3,$4, NOW())
    RETURNING *;
  `;

  return await query(sql, [idActa, tipo, ruta, camaraId]);
}
// ======================================================
// Obtener el último acta scrapeada (para continuar)
// ======================================================
export async function getLastActa() {
  const sql = `
    SELECT acta_id
    FROM scraper_actas
    ORDER BY acta_id DESC
    LIMIT 1;
  `;

  const r = await query(sql);
  return r.rows[0] || null;
}
