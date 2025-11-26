// src/utils/infratrackClient.js
import axios from "axios";
import { ENV } from "../config/env.js";

function buildUrl(tipo, consulta) {
  return `${ENV.INFRA_EZEIZA_URL}?tipo=${tipo}&consulta=${consulta}&g-recaptcha-response=`;
}

async function ejecutarConsulta(tipo, consulta) {
  const url = buildUrl(tipo, consulta);

  console.log("🔎 Llamando a Infratrack:", url);

  const { data } = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Accept": "application/json, text/javascript, */*;q=0.01",
      "X-Requested-With": "XMLHttpRequest",
      "Referer": "https://consulta-web.infratrack.com.ar/index.php?municipio=ezeiza"
    },
    timeout: 15000
  });

  return {
    meta: data,
    infracciones: Object.values(data.infracciones || {})
  };
}

export async function consultarInfratrackPorCuit(cuit) {
  return ejecutarConsulta("CUIT", cuit);
}

export async function consultarInfratrackPorPatente(patente) {
  return ejecutarConsulta("DOMINIO", patente);
}

export function mapInfraccionesExternas(infracciones) {
  return infracciones.map((inf) => ({
    origen: "externa",
    proveedor: "infratrack_ezeiza",
    id_externo: inf.id,
    acta: inf.acta,
    estado: inf.estado,
    descripcion: inf.descripcion,
    monto_total: inf.monto_total_float || inf.monto_float || 0,
    raw: inf
  }));
}
