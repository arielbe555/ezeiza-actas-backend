// src/utils/infratrackClient.js
import axios from "axios";
import { ENV } from "../config/env.js";

// ==============================
// CUIT
// ==============================
export async function consultarInfratrackPorCuit(cuit) {
  const url = `${ENV.INFRA_EZEIZA_URL}?tipo=CUIT&consulta=${cuit}&g-recaptcha-response=`;

  const { data } = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json, text/javascript, */*;q=0.9"
    },
    timeout: 20000
  });

  const infracciones = Object.values(data.infracciones || {});

  return {
    meta: data,
    infracciones
  };
}

// ==============================
// PATENTE
// ==============================
export async function consultarInfratrackPorPatente(patente) {
  const url = `${ENV.INFRA_EZEIZA_URL}?tipo=DOMINIO&consulta=${patente}&g-recaptcha-response=`;

  const { data } = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json, text/javascript, */*;q=0.9"
    },
    timeout: 20000
  });

  const infracciones = Object.values(data.infracciones || {});

  return {
    meta: data,
    infracciones
  };
}

// ==============================
// MAPEO
// ==============================
export function mapInfraccionesExternas(infracciones) {
  return infracciones.map((inf) => ({
    origen: "externa",
    proveedor: "infratrack_ezeiza",
    id_externo: inf.id,
    acta: inf.acta,
    estado: inf.estado,
    descripcion: inf.descripcion,
    monto_total: inf.monto_total_float || 0,
    monto_float: inf.monto_float || 0,
    raw: inf
  }));
}
