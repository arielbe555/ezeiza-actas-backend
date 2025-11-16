// ======================================
//  🔵 CONEXIÓN A POSTGRES
// ======================================
import pg from "pg";
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Helper de consulta
export async function query(sql, params) {
  const result = await pool.query(sql, params);
  return result.rows;
}

// ======================================
//  🟢 ACTAS (SCRAPER + SISTEMA)
// ======================================

// Insertar ACTA completa desde scraper
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
    INSERT INTO actas (
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
      velocidad_maxima,
      fecha_creacion
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
    RETURNING *;
  `;

  const params = [
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
  ];

  const rows = await query(sql, params);
  return rows[0];
}

// Registrar error del scraper
export async function logScraperError(error) {
  const sql = `
    INSERT INTO scraper_logs (error, fecha)
    VALUES ($1, NOW());
  `;
  return await query(sql, [error]);
}

// ======================================
//  🟢 PAGOS MERCADOPAGO
// ======================================

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

// Obtener último pago pendiente por acta
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

// Historial pagos por DNI
export async function getPagosByDni(dni) {
  const sql = `
    SELECT *
    FROM pagos
    WHERE dni = $1
    ORDER BY fecha_creacion DESC;
  `;
  return await query(sql, [dni]);
}

// Guardar logs de MercadoPago
export async function logMPNotification(payload) {
  const sql = `
    INSERT INTO mp_logs (payload, fecha)
    VALUES ($1, NOW());
  `;
  return await query(sql, [payload]);
}

// Actualizar pago desde webhook
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
