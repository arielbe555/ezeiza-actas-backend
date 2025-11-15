import { MercadoPagoConfig, Preference } from "mercadopago";

// ❤️ Si existe la variable, no mostramos error falso
if (!process.env.MP_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN.trim() === "") {
  console.warn("⚠️ MP_ACCESS_TOKEN no configurado.");
}

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

export const crearPago = async (req, res) => {
  try {
    const { monto, descripcion } = req.body;

    if (!monto) {
      return res.status(400).json({ error: "El monto es obligatorio" });
    }

    const preference = new Preference(client);

    const preferenceData = {
      items: [
        {
          title: descripcion || "Pago Ezeiza",
          quantity: 1,
          currency_id: "ARS",
          unit_price: Number(monto),
        },
      ],
      auto_return: "approved",
      back_urls: {
        success: "https://tuweb.com/success",
        failure: "https://tuweb.com/failure",
        pending: "https://tuweb.com/pending",
      }
    };

    const result = await preference.create({ body: preferenceData });

    return res.json({
      status: "ok",
      init_point: result.init_point,
      id: result.id,
    });

  } catch (error) {
    console.error("Error en crearPago:", error);
    res.status(500).json({
      error: "Error al generar el pago",
      detalle: error.message,
    });
  }
};

