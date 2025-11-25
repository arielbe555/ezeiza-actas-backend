// src/utils/mp.js
import { MercadoPagoConfig, Preference } from "mercadopago";

/**
 * Cliente MercadoPago usando el SDK NUEVO (2024+)
 */
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

/**
 * Crear pago MercadoPago para un acta
 */
export async function crearPagoActa({ actaId, monto, descripcion }) {
  try {
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            title: descripcion || `Pago Acta ${actaId}`,
            quantity: 1,
            unit_price: Number(monto)
          }
        ],
        back_urls: {
          success: process.env.MP_SUCCESS_URL,
          failure: process.env.MP_FAILURE_URL,
          pending: process.env.MP_PENDING_URL
        },
        auto_return: "approved",
        metadata: {
          actaId,
          monto
        }
      }
    });

    // Retornar formato esperado por tu controller
    return {
      ok: true,
      id: result.id,
      init_point: result.init_point,
      raw: result
    };

  } catch (error) {
    console.error("ERROR crearPagoActa:", error);
    return {
      ok: false,
      error: error.message
    };
  }
}
