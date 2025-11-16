// src/controllers/pagosController.js

import { crearPagoActa } from "../utils/mp.js";

import {
  createPagoPendiente,
  marcarPagoAprobado,
  getPagosByActa
  // updatePagoFromWebhook,      // ❌ NO existe en db.js (desactivado)
  // getPagosByDni,              // ❌ NO existe en db.js (desactivado)
  // logMPNotification           // ❌ NO existe en db.js (desactivado)
} from "../database/db.js";

/* ============================================================
   🔵 CREAR PREFERENCIA DE PAGO (MercadoPago)
   ============================================================ */
export async function crearPreferenciaPago(req, res) {
  try {
    const { actaId, monto } = req.body;

    if (!actaId || !monto) {
      return res.status(400).json({ ok: false, error: "actaId y monto son obligatorios" });
    }

    // 1) Crear preferencia en MP
    const pref = await crearPagoActa({
      actaId,
      monto,
      descripcion: `Pago de Acta ${actaId}`
    });

    // 2) Registrar pago pendiente en base
    const pago = await createPagoPendiente({
      acta_id: actaId,
      monto: monto,
      medio_pago: "mercadopago"
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

/* ============================================================
   🟣 CONSULTAR PAGO POR ACTA
   ============================================================ */
export async function estadoPagoPorActa(req, res) {
  try {
    const { actaId } = req.params;

    const pagos = await getPagosByActa(actaId);

    if (!pagos || pagos.length === 0) {
      return res.status(404).json({ ok: false, message: "Sin pagos registrados" });
    }

    return res.json({ ok: true, pagos });

  } catch (err) {
    console.error("Error consultando pago:", err);
    return res.status(500).json({ ok: false, error: "Error consultando pago" });
  }
}

/* ============================================================
   🔵 WEBHOOK MP (placeholder para no romper Render)
   ============================================================ */
export async function webhookMP(req, res) {
  try {
    // Por ahora desactivado para evitar errores
    // Activamos cuando sumemos updatePagoFromWebhook + logMPNotification en db.js

    console.log("Webhook MP recibido:", req.body);

    return res.status(200).send("OK");

  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("ERROR");
  }
}

/* ============================================================
   🟤 HISTORIAL POR DNI (DESACTIVADO)
   ============================================================ */
// export async function historialPagosPorDni(req, res) {
//   const { dni } = req.query;
//   const pagos = await getPagosByDni(dni);
//   return res.json({ ok: true, pagos });
// }

