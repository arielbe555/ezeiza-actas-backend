// src/controllers/infraccionesController.js
import { ENV } from "../config/env.js";
import {
  getActasByDocumento,
  getActasByPatente,
  upsertActaExterna
} from "../database/db.js";
import {
  consultarInfratrack,
  mapInfraccionesExternas
} from "../utils/infratrackClient.js";

function detectarConsulta(query) {
  const { dni, cuit, documento, dominio, patente } = query;

  if (dominio || patente) {
    return { tipo: "DOMINIO", valor: dominio || patente };
  }

  const doc = dni || cuit || documento;
  if (doc) {
    return { tipo: "DOCUMENTO", valor: doc };
  }

  return null;
}

export async function obtenerInfracciones(req, res) {
  const criterio = detectarConsulta(req.query);

  if (!criterio) {
    return res.status(400).json({
      ok: false,
      error:
        "Debes enviar ?dni=, ?cuit=, ?documento= o ?dominio= / ?patente= en el query string"
    });
  }

  const { tipo, valor } = criterio;

  try {
    // 1) Base local
    let actasLocales = [];
    if (tipo === "DOCUMENTO") {
      actasLocales = await getActasByDocumento(valor);
    } else {
      actasLocales = await getActasByPatente(valor);
    }

    // 2) Infratrack externo
    let metaExterna = null;
    let actasExternas = [];

    try {
      const { meta, infracciones } = await consultarInfratrack(
        tipo === "DOCUMENTO"
          ? ENV.INFRA_TIPO_DOCUMENTO
          : ENV.INFRA_TIPO_DOMINIO,
        valor
      );

      metaExterna = meta;
      actasExternas = mapInfraccionesExternas(infracciones);

      // Opcional: ir consolidando en tu base propia (sin bloquear la respuesta)
      for (const acta of actasExternas) {
        upsertActaExterna({
          numero_acta: acta.numero_acta,
          documento: tipo === "DOCUMENTO" ? valor : null,
          patente: tipo === "DOMINIO" ? valor : null,
          fecha: acta.fecha,
          monto: acta.monto_total,
          estado: acta.estado,
          descripcion: acta.descripcion,
          origen: "infratrack_ezeiza"
        }).catch((e) => console.error("upsertActaExterna error:", e.message));
      }
    } catch (errExt) {
      console.error("[INFRACCIONES] Error consultando Infratrack:", errExt);
    }

    const respuesta = {
      ok: true,
      criterio: {
        tipo_busqueda: tipo,
        valor
      },
      resumen: {
        total_locales: actasLocales.length,
        total_externas: actasExternas.length,
        total_general: actasLocales.length + actasExternas.length
      },
      origenes: {
        externa: metaExterna
      },
      actas_locales: actasLocales,
      actas_externas: actasExternas
    };

    return res.json(respuesta);
  } catch (err) {
    console.error("[INFRACCIONES] Error general:", err);
    return res.status(500).json({
      ok: false,
      error: "Error obteniendo infracciones"
    });
  }
}


