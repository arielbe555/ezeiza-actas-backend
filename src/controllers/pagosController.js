import { crearPagoActa } from "../utils/mp.js";
import {
  createPagoPendiente,
  updatePagoFromWebhook,
  getPagoByActa,
  getPagosByDni,
  logMPNotification
} from "../database/db.js";

// Crear preferencia de pago para un acta
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

    const mpRaw = JSON.stringify(pref);

    const pago = await createPagoPendiente({
      actaId,
      dni,
      monto,
      mpPreferenceId: pref.id,
      mpRaw
    });

    return res.json({
      ok: true,
      actaId,
      monto,
      preference_id: pref.id,
      init_point: pref.init_point,
      sandbox_init_point: pref.sandbox_init_point,
      pago_registrado: pago
    });

  } catch (err) {
    console.error("Error crearPreferenciaPago:", err);
    return res.status(500).json({ ok: false, error: "Error generando pago MP" });
  }
}

// Webhook que llama MercadoPago
export async function webhookMP(req, res) {
  try {
    const data = req.body;

    await logMPNotification(JSON.stringify(data));

    const tipo = data.type || data.action;

    if (tipo === "payment" || tipo === "created" || tipo === "updated") {
      const mpPaymentId = data.data && (data.data.id || data.data.payment_id);

      // NOTA: en modo PRO se debería consultar el pago a MP
      // para obtener status y preference_id correctos.
      // Acá hacemos una versión directa.
      const mpStatus = data.status || "unknown";
      const mpPreferenceId =
        data.data && (data.data.preference_id || data.data.id || null);

      if (mpPreferenceId) {
        await updatePagoFromWebhook({
          mpPreferenceId,
          mpPaymentId: mpPaymentId ? String(mpPaymentId) : null,
          mpStatus,
          mpRaw: JSON.stringify(data)
        });
      }
    }

    return res.status(200).send("OK");
  } catch (err) {
    console.error("Error webhookMP:", err);
    return res.status(500).send("ERROR");
  }
}

// Consultar estado de pago por acta
export async function estadoPagoPorActa(req, res) {
  try {
    const { actaId } = req.params;
    const pago = await getPagoByActa(Number(actaId));

    if (!pago) {
      return res.status(404).json({ ok: false, message: "Sin pagos para esta acta" });
    }

    return res.json({ ok: true, pago });
  } catch (err) {
    console.error("Error estadoPagoPorActa:", err);
    return res.status(500).json({ ok: false, error: "Error consultando pago" });
  }
}

// Historial de pagos por DNI
export async function historialPagosPorDni(req, res) {
  try {
    const { dni } = req.query;

    if (!dni) {
      return res.status(400).json({ ok: false, error: "dni es obligatorio" });
    }

    const pagos = await getPagosByDni(dni);
    return res.json({ ok: true, cantidad: pagos.length, pagos });
  } catch (err) {
    console.error("Error historialPagosPorDni:", err);
    return res.status(500).json({ ok: false, error: "Error consultando pagos" });
  }
}

