// src/utils/mp.js
import mercadopago from "mercadopago";
import { ENV } from "../config/env.js";

if (ENV.MP_ACCESS_TOKEN) {
  mercadopago.configure({
    access_token: ENV.MP_ACCESS_TOKEN
  });
} else {
  console.warn("[MP] Falta MP_ACCESS_TOKEN, módulo de pagos limitado.");
}

export async function crearPreferenceActas({ titulo, monto, externalReference }) {
  if (!ENV.MP_ACCESS_TOKEN) {
    throw new Error("MP_ACCESS_TOKEN no configurado");
  }

  const preference = {
    items: [
      {
        title: titulo || "Pago de infracciones",
        quantity: 1,
        currency_id: "ARS",
        unit_price: Number(monto)
      }
    ],
    external_reference: externalReference,
    back_urls: {
      success: "https://ezeiza.netlify.app/pago-exitoso",
      failure: "https://ezeiza.netlify.app/pago-error",
      pending: "https://ezeiza.netlify.app/pago-pendiente"
    },
    auto_return: "approved"
  };

  const response = await mercadopago.preferences.create(preference);
  return response.body;
}
