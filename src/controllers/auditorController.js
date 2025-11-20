import pool from "../config/db.js";

/* ============================================================
   1) LISTAR ACTAS PENDIENTES PARA AUDITOR
   ============================================================ */
export const listarPendientesAuditor = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT *
      FROM actas
      WHERE estado = 'pendiente_auditoria'
      ORDER BY fecha_registro DESC
      LIMIT 300
    `);

    return res.json(rows);
  } catch (error) {
    console.error("Error listarPendientesAuditor:", error);
    return res.status(500).json({ error: "Error obteniendo actas" });
  }
};

/* ============================================================
   2) APROBAR ACTA → REGLAS (auditor)
   ============================================================ */
export const aprobarAuditor = async (req, res) => {
  const { id } = req.params;
  const { auditorId, porcentaje, motivo } = req.body;

  const REGLAS = [50, 25, 60];
  const requiereDirector = !REGLAS.includes(Number(porcentaje));

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      "SELECT * FROM actas WHERE id=$1",
      [id]
    );

    if (!rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Acta no encontrada" });
    }

    const acta = rows[0];

    /* -------------------------------
       A) SI REQUIERE DIRECTOR
       ------------------------------- */
    if (requiereDirector) {
      const solicitud = await client.query(
        `
        INSERT INTO director_aprobaciones (
          acta_id, auditor_id, motivo, estado, fecha_solicitud
        )
        VALUES ($1,$2,$3,'pendiente',NOW())
        RETURNING *
        `,
        [id, auditorId, motivo || "Motivo no informado"]
      );

      await client.query(
        "UPDATE actas SET estado='pendiente_director' WHERE id=$1",
        [id]
      );

      await client.query("COMMIT");

      return res.json({
        ok: true,
        requiere_director: true,
        solicitud: solicitud.rows[0]
      });
    }

    /* -------------------------------
       B) APROBACIÓN DIRECTA
       ------------------------------- */

    const montoOriginal = Number(acta.monto);
    const montoFinal = montoOriginal - (montoOriginal * porcentaje / 100);

    await client.query(
      `
      UPDATE actas SET
        estado='aprobada_auditor',
        monto_calculado=$2,
        auditor_id=$3,
        fecha_validacion=NOW()
      WHERE id=$1
      `,
      [id, montoFinal, auditorId]
    );

    await client.query(
      `
      INSERT INTO auditoria (
        acta_id, auditor_id, accion, detalle, fecha
      )
      VALUES ($1,$2,'aprobar','Descuento: ${porcentaje}%',NOW())
      `,
      [id, auditorId]
    );

    await client.query("COMMIT");

    return res.json({ ok: true, monto_final: montoFinal });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error aprobarAuditor:", error);
    return res.status(500).json({ error: "Error aprobando acta" });
  } finally {
    client.release();
  }
};

/* ============================================================
   3) RECHAZAR ACTA
   ============================================================ */
export const rechazarAuditor = async (req, res) => {
  const { id } = req.params;
  const { auditorId, motivo } = req.body;

  try {
    await pool.query(
      "UPDATE actas SET estado='rechazada_auditor' WHERE id=$1",
      [id]
    );

    await pool.query(
      `
      INSERT INTO auditoria (
        acta_id, auditor_id, accion, detalle, fecha
      )
      VALUES ($1,$2,'rechazar',$3,NOW())
      `,
      [id, auditorId, motivo || "Sin motivo"]
    );

    return res.json({ ok: true });

  } catch (error) {
    console.error("Error rechazarAuditor:", error);
    return res.status(500).json({ error: "Error rechazando acta" });
  }
};

/* ============================================================
   4) RESOLUCIÓN FINAL DEL DIRECTOR
   ============================================================ */
export const resolverDirector = async (req, res) => {
  const { id } = req.params;
  const { directorId, aprobado, motivo } = req.body;

  const nuevoEstado = aprobado ? "aprobada_director" : "rechazada_director";

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
      UPDATE director_aprobaciones
      SET estado=$2,
          director_id=$3,
          motivo_resolucion=$4,
          fecha_resolucion=NOW()
      WHERE id=$1
      `,
      [id, nuevoEstado, directorId, motivo || ""]
    );

    await client.query(
      `
      UPDATE actas 
      SET estado=$2, director_id=$3
      WHERE id=(SELECT acta_id FROM director_aprobaciones WHERE id=$1)
      `,
      [id, nuevoEstado, directorId]
    );

    await client.query("COMMIT");

    return res.json({ ok: true });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error resolverDirector:", error);
    return res.status(500).json({ error: "Error en resolución del director" });
  } finally {
    client.release();
  }
};
