// src/controllers/pagosController.js
import { crearPreferenceActas } from "../utils/mp.js";

/**
 * POST /api/pagos/preference
 * body: { actas: [{numero_acta, monto}], documento?, dominio? }
 */
export async function crearPreference(req, res) {
  try {
    const { actas, documento, dominio } = req.body;

    if (!Array.isArray(actas) || !actas.length) {
      return res.status(400).json({
        ok: false,
        error: "Debes enviar un array 'actas' con numero_acta y monto"
      });
    }

    const total = actas.reduce(
      (acc, a) => acc + Number(a.monto || a.monto_total || 0),
      0
    );

    const titulo = `Pago de ${actas.length} actas`;
    const externalReference = JSON.stringify({
      documento,
      dominio,
      actas: actas.map((a) => a.numero_acta)
    });

    const pref = await crearPreferenceActas({
      titulo,
      monto: total,
      externalReference
    });

    return res.json({
      ok: true,
      preference_id: pref.id,
      init_point: pref.init_point,
      sandbox_init_point: pref.sandbox_init_point
    });
  } catch (err) {
    console.error("[PAGOS] Error creando preference:", err);
    return res.status(500).json({
      ok: false,
      error: "No se pudo crear la orden de pago"
    });
  }
}


