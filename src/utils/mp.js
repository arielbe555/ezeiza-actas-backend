
import mercadopago from "mercadopago";
import dotenv from "dotenv";

dotenv.config();

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN
});

/**
 * Crea una preferencia de pago para un acta
 */
export async function crearPagoActa({ actaId, monto, descripcion }) {
  const preference = {
    items: [
      {
        id: actaId.toString(),
        title: descripcion || `Pago de acta #${actaId}`,
        quantity: 1,
        currency_id: "ARS",
        unit_price: Number(monto)
      }
    ],
    back_urls: {
      success: process.env.MP_SUCCESS_URL,
      pending: process.env.MP_PENDING_URL,
      failure: process.env.MP_FAILURE_URL
    },
    auto_return: "approved"
  };

  const result = await mercadopago.preferences.create(preference);
  return result.body; // devuelve init_point, id, etc.
}
