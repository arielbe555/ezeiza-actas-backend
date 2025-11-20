import pool from "../config/db.js";

// ===========================================
// LISTA DE ACTAS PARA AUDITOR
// ===========================================
export const listarPendientesAuditor = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT *
      FROM actas
      WHERE estado = 'pendiente_auditoria'
      ORDER BY fecha_registro DESC
      LIMIT 300
    `);
    res.json(rows);

  } catch (e) {
    console.error("Error listarPendientesAuditor:", e);
    res.status(500).json({ error: "Error obteniendo actas" });
  }
};

// ===========================================
// APROBAR ACTA CON REGLAS (AUDITOR)
// ===========================================
export const aprobarAuditor = async (req, res) => {
  const { id } = req.params;
  const { porcentaje, auditorId, motivo } = req.body;

  const REGLAS = [50, 25, 60];
  const requiereDirector = !REGLAS.includes(porcentaje);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows: actas } = await client.query(
      `SELECT * FROM actas WHERE id=$1`,
      [id]
    );

    if (!actas.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Acta no encontrada" });
    }

    const acta = actas[0];

    // Si requiere director → crear solicitud
    if (requiereDirector) {
      const solicitud = await client.query(
        `
        INSERT INTO director_aprobaciones 
        (acta_id, auditor_id, motivo, estado)
        VALUES ($1, $2, $3, 'pendiente')
        RETURNING *
        `,
        [id, auditorId, motivo || "Motivo no informado"]
      );

      await client.query(
        `UPDATE actas SET estado='pendiente_director' WHERE id=$1`,
        [id]
      );

      await client.query("COMMIT");

      return res.json({
        ok: true,
        requiere_director: true,
        solicitud: solicitud.rows[0],
      });
    }

    // Aprobación directa
    const montoFinal =
      acta.monto - (acta.monto * porcentaje / 100);

    await client.query(
      `
      UPDATE actas SET 
        estado='aprobada_auditor',
        monto_calculado=$2,
        auditor_id=$3
      WHERE id=$1
      `,
      [id, montoFinal, auditorId]
    );

    await client.query(
      `
      INSERT INTO auditoria (acta_id, auditor_id, accion, detalle)
      VALUES ($1, $2, 'aprobar', $3)
      `,
      [id, auditorId, `Aprobación con ${porcentaje}%`]
    );

    await client.query("COMMIT");

    res.json({ ok: true, monto: montoFinal });

  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Error aprobarAuditor:", e);
    res.status(500).json({ error: "Error aprobando acta" });
  } finally {
    client.release();
  }
};

// ===========================================
// RECHAZAR ACTA (AUDITOR)
// ===========================================
export const rechazarAuditor = async (req, res) => {
  const { id } = req.params;
  const { auditorId, motivo } = req.body;

  try {
    await pool.query(
      `UPDATE actas SET estado='rechazada_auditor' WHERE id=$1`,
      [id]
    );

    await pool.query(
      `
      INSERT INTO auditoria (acta_id, auditor_id, accion, detalle)
      VALUES ($1, $2, 'rechazar', $3)
      `,
      [id, auditorId, motivo || "Sin motivo"]
    );

    res.json({ ok: true });

  } catch (e) {
    console.error("Error rechazarAuditor:", e);
    res.status(500).json({ error: "Error rechazando acta" });
  }
};

// ===========================================
// SOLICITUD MANUAL DE DIRECTOR (extra)
// ===========================================
export const solicitarDirector = async (req, res) => {
  const { id } = req.params;
  const { auditorId, motivo } = req.body;

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO director_aprobaciones
      (acta_id, auditor_id, motivo, estado)
      VALUES ($1, $2, $3, 'pendiente')
      RETURNING *
      `,
      [id, auditorId, motivo || "Motivo no informado"]
    );

    await pool.query(
      `UPDATE actas SET estado='pendiente_director' WHERE id=$1`,
      [id]
    );

    res.json({ ok: true, solicitud: rows[0] });

  } catch (e) {
    console.error("Error solicitarDirector:", e);
    res.status(500).json({ error: "Error solicitando director" });
  }
};

// ===========================================
// RESOLUCIÓN DEL DIRECTOR
// ===========================================
export const resolverDirector = async (req, res) => {
  const { id } = req.params;
  const { directorId, aprobado, motivo } = req.body;

  const nuevoEstado = aprobado ? "validada" : "rechazada_director";

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Actualiza la solicitud
    await client.query(
      `
      UPDATE director_aprobaciones
      SET estado=$2, director_id=$3, fecha_resolucion=NOW(), motivo=$4
      WHERE id=$1
      `,
      [id, nuevoEstado, directorId, motivo || null]
    );

    // Actualiza el acta
    await client.query(
      `
      UPDATE actas 
      SET estado=$2, director_id=$3
      WHERE id=(SELECT acta_id FROM director_aprobaciones WHERE id=$1)
      `,
      [id, nuevoEstado, directorId]
    );

    await client.query("COMMIT");

    res.json({ ok: true });

  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Error resolverDirector:", e);
    res.status(500).json({ error: "Error resolviendo director" });
  } finally {
    client.release();
  }
};
