// src/controllers/tecnicoController.js
import pool from "../database/db.js";

// ============================================================
// 1) LISTAR EVENTOS (técnico)
// ============================================================
export const listarEventosPendientesTecnico = async (req, res) => {
  try {
    const { estado = "nuevo" } = req.query;

    const { rows } = await pool.query(
      `
      SELECT
        ec.id,
        ec.camara_id,
        ec.tipo_evento,
        ec.timestamp_evento,
        ec.velocidad,
        ec.foto_url,
        ec.video_url,
        ec.ocr_patente,
        ec.estado
      FROM eventos_camara ec
      WHERE ec.estado = $1
      ORDER BY ec.timestamp_evento DESC
      LIMIT 200
      `,
      [estado]
    );

    res.json(rows);
  } catch (error) {
    console.error("Error listarEventosPendientesTecnico:", error);
    res.status(500).json({ error: "Error obteniendo eventos para técnico" });
  }
};

// ============================================================
// 2) VALIDAR EVENTO (técnico) → crea ACTA
// ============================================================
export const validarEventoTecnico = async (req, res) => {
  const { id } = req.params;
  const { patente, motivo, tecnicoId } = req.body || {};

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: eventos } = await client.query(
      `
      UPDATE eventos_camara
      SET
        estado       = 'aprobado_tecnico',
        ocr_patente  = $2,
        validado_por = $3,
        validado_en  = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [id, patente, tecnicoId || null]
    );

    if (eventos.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    const evento = eventos[0];
    const numeroActa = `ACT-${evento.id}`;

    const { rows: actas } = await client.query(
      `
      INSERT INTO actas (
        numero_acta, patente, camara_id, fecha,
        velocidad_registrada, monto, estado, origen, fecha_registro
      )
      VALUES ($1,$2,$3,$4,$5,0,'pendiente_auditoria','camara',NOW())
      RETURNING *
      `,
      [
        numeroActa,
        patente,
        evento.camara_id,
        evento.timestamp_evento,
        evento.velocidad
      ]
    );

    const acta = actas[0];

    await client.query(
      `
      INSERT INTO validaciones_tecnicas (
        evento_id, tecnico_id, accion, patente_leida, motivo
      )
      VALUES ($1, $2, 'validar', $3, $4)
      `,
      [evento.id, tecnicoId || null, patente, motivo || null]
    );

    await client.query("COMMIT");

    res.json({ ok: true, evento, acta });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error validarEventoTecnico:", error);
    res.status(500).json({ error: "Error validando evento" });
  } finally {
    client.release();
  }
};

// ============================================================
// 3) RECHAZAR EVENTO
// ============================================================
export const rechazarEventoTecnico = async (req, res) => {
  const { id } = req.params;
  const { motivo, tecnicoId, patente } = req.body || {};

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: eventos } = await client.query(
      `
      UPDATE eventos_camara
      SET estado='rechazado',
          validado_por=$2,
          validado_en=NOW()
      WHERE id=$1
      RETURNING *
      `,
      [id, tecnicoId || null]
    );

    if (!eventos.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    const evento = eventos[0];

    await client.query(
      `
      INSERT INTO validaciones_tecnicas (
        evento_id, tecnico_id, accion, patente_leida, motivo
      )
      VALUES ($1,$2,'rechazar',$3,$4)
      `,
      [evento.id, tecnicoId || null, patente || evento.ocr_patente, motivo || null]
    );

    await client.query("COMMIT");

    res.json({ ok: true, evento });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error rechazarEventoTecnico:", error);
    res.status(500).json({ error: "Error rechazando evento" });
  } finally {
    client.release();
  }
};
