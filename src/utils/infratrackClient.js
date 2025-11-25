// src/utils/infratrackClient.js
import axios from "axios";
import { ENV } from "../config/env.js";

/**
 * Consulta Infratrack Ezeiza por dominio o documento.
 *
 * @param {"DOMINIO"|"DOCUMENTO"} tipo
 * @param {string} consulta dominio (PMB075) o documento (DNI/CUIT)
 * @returns {Promise<{meta:any, infracciones:any[]}>}
 */
export async function consultarInfratrack(tipo, consulta) {
  const params = new URLSearchParams({
    tipo,
    consulta,
    "g-recaptcha-response": "" // en el request real va vacío y responde igual
  });

  const url = `${ENV.INFRA_EZEIZA_URL}?${params.toString()}`;

  const { data } = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json, text/javascript, */*;q=0.9"
    },
    timeout: 15000
  });

  // La respuesta real trae algo así como:
  // { "sid": "...", "tipo_consulta": "DOMINIO", "consulta": "PMB075", "infracciones": [ ... ] }
  const infracciones = Array.isArray(data.infracciones)
    ? data.infracciones
    : data.infracciones?.data || [];

  return {
    meta: {
      tipo_consulta: data.tipo_consulta,
      consulta: data.consulta,
      total_infracciones: data.total_infracciones,
      total_monto: data.total_monto,
      raw: data
    },
    infracciones
  };
}

/**
 * Mapea las infracciones de Infratrack a un formato propio homogéneo.
 */
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
    // enlaces de pago / impresión si los trae
    pago_link: inf.pago_link ?? inf["pago_link"],
    imprimir_link: inf.imprimir_link ?? inf["imprimir_link"],
    // dejamos el raw por si el front quiere algo más adelante
    raw: inf
  }));
}
