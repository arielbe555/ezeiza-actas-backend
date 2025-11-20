import pool from "../config/db.js";

// =============================
// LISTAR PARA AUDITOR
// =============================
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
    console.error(e);
    res.status(500).json({ error: "Error obteniendo actas" });
  }
};

// =============================
// APROBAR CON REGLAS DE NEGOCIO
// =============================
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
      return res.status(404).json({ error: "No existe el acta" });
    }

    const acta = actas[0];

    // Si requiere director → crear solicitud
    if (requiereDirector) {
      const solicitud = await client.query(
        `
        INSERT INTO director_aprobaciones 
        (acta_id, auditor_id, motivo)
        VALUES ($1,$2,$3)
        RETURNING *
        `,
        [id, auditorId, motivo || "Motivo no informado"]
      );

      await client.query("UPDATE actas SET estado='pendiente_director' WHERE id=$1", [id]);

      await client.query("COMMIT");
      return res.json({
        ok: true,
        requiere_director: true,
        solicitud: solicitud.rows[0]
      });
    }

    // Si NO requiere director → aplicar descuento
    const montoFinal = acta.monto - (acta.monto * porcentaje / 100);

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
      VALUES ($1,$2,'aprobar','Aprobación con ${porcentaje}%')
      `,
      [id, auditorId]
    );

    await client.query("COMMIT");

    res.json({ ok: true, monto: montoFinal });

  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: "Error aprobando" });
  } finally {
    client.release();
  }
};

// =============================
// RECHAZAR
// =============================
export const rechazarAuditor = async (req, res) => {
  const { id } = req.params;
  const { auditorId, motivo } = req.body;

  await pool.query(
    `UPDATE actas SET estado='rechazada_auditor' WHERE id=$1`,
    [id]
  );

  await pool.query(
    `
    INSERT INTO auditoria (acta_id, auditor_id, accion, detalle)
    VALUES ($1,$2,'rechazar',$3)
    `,
    [id, auditorId, motivo || "Sin motivo"]
  );

  res.json({ ok: true });
};

// =============================
// RESOLUCIÓN DIRECTOR
// =============================
export const resolverDirector = async (req, res) => {
  const { id } = req.params;
  const { directorId, aprobado, motivo } = req.body;

  let estado = aprobado ? "aprobada_director" : "rechazada_director";

  await pool.query(
    `
    UPDATE director_aprobaciones
    SET estado=$2, director_id=$3, fecha_resolucion=NOW()
    WHERE id=$1
    `,
    [id, estado, directorId]
  );

  res.json({ ok: true });
};
