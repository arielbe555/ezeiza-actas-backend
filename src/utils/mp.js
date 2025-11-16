// ======================================
//  🟦 MERCADOPAGO SDK (NUEVA VERSION)
// ======================================

import MercadoPagoConfig, { Preference } from "mercadopago";
import { ENV } from "../config/env.js";

// Crear cliente MP
const mp = new MercadoPagoConfig({
  accessToken: ENV.MP_ACCESS_TOKEN
});

// Crear preferencia
export async function crearPreferencia({ titulo, monto, actaId, dni }) {
  try {
    const preference = new Preference(mp);

    const result = await preference.create({
      body: {
        items: [
          {
            id: String(actaId),
            title: titulo,
            quantity: 1,
            unit_price: Number(monto)
          }
        ],
        back_urls: {
          success: ENV.MP_SUCCESS_URL,
          failure: ENV.MP_FAILURE_URL,
          pending: ENV.MP_PENDING_URL
        },
        auto_return: "approved",
        metadata: {
          actaId,
          dni
        }
      }
    });

    return result;
  } catch (err) {
    console.error("❌ Error creando preferencia MP:", err);
    throw err;
  }
}

// Webhook
export function validarWebhook(req) {
  try {
    if (!req.body) return null;
    return req.body;
  } catch (err) {
    console.error("❌ Error webhook MP:", err);
    return null;
  }
}
