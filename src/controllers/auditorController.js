import pool from "../config/db.js";

/* ============================================================
   1) LISTAR ACTAS PENDIENTES PARA AUDITOR
   ============================================================ */
export const listarActasPendientesAuditor = async (req, res) => {
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
    console.error("Error listarActasPendientesAuditor:", error);
    return res.status(500).json({ error: "Error obteniendo actas" });
  }
};


/* ============================================================
   2) APROBAR ACTA → Reglas del auditor
   ============================================================ */
export const aprobarActaAuditor = async (req, res) => {
  const { id } = req.params;
  const { auditorId, porcentaje, motivo } = req.body;

  const REGLAS_AUTOMATICAS = [50, 25, 60];  
  const requiereDirector = !REGLAS_AUTOMATICAS.includes(Number(porcentaje));

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Traigo el acta
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
          acta_id,
          auditor_id,
          motivo,
          estado,
          fecha_solicitud
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
       B) APROBACIÓN DIRECTA DEL AUDITOR
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
        acta_id,
        auditor_id,
        accion,
        detalle,
        fecha
      )
      VALUES ($1,$2,'aprobar','Descuento aplicado: ${porcentaje}%',NOW())
      `,
      [id, auditorId]
    );

    await client.query("COMMIT");

    return res.json({
      ok: true,
      aprobado: true,
      monto_final: montoFinal
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error aprobarActaAuditor:", error);
    return res.status(500).json({ error: "Error aprobando acta" });
  } finally {
    client.release();
  }
};


/* ============================================================
   3) RECHAZAR ACTA
   ============================================================ */
export const rechazarActaAuditor = async (req, res) => {
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
    console.error("Error rechazarActaAuditor:", error);
    return res.status(500).json({ error: "Error rechazando acta" });
  }
};


/* ============================================================
   4) DECISIÓN FINAL DEL DIRECTOR
   ============================================================ */
export const resolverAprobacionDirector = async (req, res) => {
  const { id } = req.params;
  const { directorId, aprobado, motivo } = req.body;

  try {
    const newState = aprobado ? "aprobada_director" : "rechazada_director";

    await pool.query(
      `
      UPDATE director_aprobaciones
      SET estado=$2,
          director_id=$3,
          motivo_resolucion=$4,
          fecha_resolucion=NOW()
      WHERE id=$1
      `,
      [id, newState, directorId, motivo || ""]
    );

    return res.json({ ok: true });
  } catch (error) {
    console.error("Error resolverAprobacionDirector:", error);
    return res.status(500).json({ error: "Error del director" });
  }
};
