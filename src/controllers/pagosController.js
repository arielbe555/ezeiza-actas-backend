import { crearPagoActa } from "../utils/mp.js";

import {
  createPagoPendiente,
  updatePagoFromWebhook,
  getPagoPendienteByActa,
  getPagosByDni,
  logMPNotification
} from "../database/db.js";

// Crear preferencia de pago
export async function crearPreferenciaPago(req, res) {
  try {
    const { actaId, monto, dni } = req.body;

    if (!actaId || !monto) {
      return res.status(400).json({ error: "actaId y monto son obligatorios" });
    }

    const pref = await crearPagoActa({
      actaId,
      monto,
      descripcion: `Pago de Acta ${actaId}`
    });

    const pago = await createPagoPendiente({
      actaId,
      dni,
      monto,
      mpPreferenceId: pref.id,
      mpRaw: JSON.stringify(pref)
    });

    return res.json({
      ok: true,
      preference_id: pref.id,
      init_point: pref.init_point,
      pago
    });

  } catch (err) {
    console.error("Error crear pago:", err);
    return res.status(500).json({ ok: false, error: "Error generando pago" });
  }
}

// Webhook
export async function webhookMP(req, res) {
  try {
    const data = req.body;

    await logMPNotification(JSON.stringify(data));

    const tipo = data.type || data.action;

    if (tipo === "payment" || tipo === "updated" || tipo === "created") {
      const mpPreferenceId = data.data.preference_id;
      const mpStatus = data.data.status;
      const mpPaymentId = data.data.id;

      await updatePagoFromWebhook({
        mpPreferenceId,
        mpStatus,
        mpPaymentId,
        mpRaw: JSON.stringify(data)
      });
    }

    res.status(200).send("OK");

  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("ERROR");
  }
}

// Consultar pago por acta
export async function estadoPagoPorActa(req, res) {
  const { actaId } = req.params;

  const pago = await getPagoPendienteByActa(actaId);

  if (!pago) {
    return res.status(404).json({ ok: false, message: "Sin pagos" });
  }

  return res.json({ ok: true, pago });
}

// Historial por DNI
export async function historialPagosPorDni(req, res) {
  const { dni } = req.query;
  const pagos = await getPagosByDni(dni);
  return res.json({ ok: true, pagos });
}

// =======================================================
// 🔥 EXPORTACIÓN REAL (Esto es lo que te faltaba)
// =======================================================
export {
  crearPreferenciaPago,
  webhookMP,
  estadoPagoPorActa,
  historialPagosPorDni
};
