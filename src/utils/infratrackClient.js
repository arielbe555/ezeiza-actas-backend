// src/utils/infratrackClient.js
import axios from "axios";
import { ENV } from "../config/env.js";

export async function consultarInfratrack(tipo, consulta) {
  if (!ENV.INFRA_EZEIZA_URL) {
    throw new Error("INFRA_EZEIZA_URL no está definida.");
  }

  const params = new URLSearchParams({
    tipo,
    consulta,
    municipio: "ezeiza",
    "g-recaptcha-response": ""
  });

  const url = `${ENV.INFRA_EZEIZA_URL}?${params.toString()}`;

  console.log("🔎 URL SCRAP:", url);

  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json, text/javascript, */*;q=0.9"
      },
      timeout: 15000
    });

    const infracciones = Array.isArray(data.infracciones)
      ? data.infracciones
      : data.infracciones?.data || [];

    return {
      meta: data,
      infracciones
    };
  } catch (error) {
    console.error("🛑 ERROR SCRAP:", error?.message);
    throw error;
  }
}

export function mapInfraccionesExternas(infracciones) {
  return infracciones.map((inf) => ({
    origen: "externa",
    proveedor: "infratrack_ezeiza",
    id_externo: inf.id,
    numero_acta: inf.acta,
    estado: inf.estado,
    descripcion: inf.descripcion,
    monto_total: inf.monto_total_float ?? inf.monto_float ?? 0,
    monto_voluntario: inf.monto_float ?? null,
    pago_voluntario_texto: inf.pago_voluntario ?? null,
    fecha: inf.fecha ?? null,
    fecha_vencimiento: inf.fecha_vencimiento ?? null,
    lugar: inf.lugar ?? null,
    pago_link: inf.pago_link,
    imprimir_link: inf.imprimir_link,
    raw: inf
  }));
}
