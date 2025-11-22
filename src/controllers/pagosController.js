// src/controllers/pagosController.js

import { crearPagoActa } from "../utils/mp.js";

import {
  createPagoPendiente,
  updatePagoFromWebhook,
  getPagoPendienteByActa,
  getPagosByDni,
  logMPNotification
} from "../database/db.js";

// ==========================================
// Crear preferencia de pago
// ==========================================
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
      dni: dni || null,
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

// ==========================================
// Webhook MercadoPago
// ==========================================
export async function webhookMP(req, res) {
  try {
    const data = req.body;

    await logMPNotification(JSON.stringify(data));

    const tipo = data.type || data.action;

    // Verifica que MP envió los campos correctos
    if (tipo === "payment" || tipo === "updated" || tipo === "created") {

      const mpPreferenceId = data?.data?.preference_id;
      const mpStatus = data?.data?.status;
      const mpPaymentId = data?.data?.id;

      if (!mpPreferenceId) {
        console.error("Webhook recibido sin preference_id válido");
        return res.status(200).send("IGNORED");
      }

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

// ==========================================
// Estado por acta
// ==========================================
export async function estadoPagoPorActa(req, res) {
  try {
    const { actaId } = req.params;

    const pago = await getPagoPendienteByActa(actaId);

    if (!pago) {
      return res.status(404).json({ ok: false, message: "Sin pagos" });
    }

    return res.json({ ok: true, pago });

  } catch (err) {
    console.error("estadoPagoPorActa error:", err);
    return res.status(500).json({ ok: false, error: "Error consultando pago" });
  }
}

// ==========================================
// Historial por DNI
// ==========================================
export async function historialPagosPorDni(req, res) {
  try {
    const { dni } = req.query;

    if (!dni) {
      return res.status(400).json({ ok: false, error: "dni requerido" });
    }

    const pagos = await getPagosByDni(dni);
    return res.json({ ok: true, pagos });

  } catch (err) {
    console.error("historialPagosPorDni error:", err);
    return res.status(500).json({ ok: false, error: "Error obteniendo historial" });
  }
}
