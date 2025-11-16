// src/controllers/infraccionesController.js

import { ENV } from "../config/env.js";
import {
  getActasByDocumento,
  getActasByPatente,
  upsertActaExterna,
  insertarActaLocal
} from "../database/db.js";

import {
  consultarInfratrack,
  mapInfraccionesExternas
} from "../utils/infratrackClient.js";

import { generarActaPDF } from "../services/pdfService.js";   // ⬅ AGREGADO
import axios from "axios";                                    // ⬅ AGREGADO


/* ============================================================
    🔎  CONTROLADOR ORIGINAL — CONSULTAR INFRACCIONES
   ============================================================ */

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

    // 2) Consulta externa a Infratrack
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

      // Consolidación (no bloquea respuesta)
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


/* ============================================================
    📄  NUEVO CONTROLADOR — GENERAR ACTA + PDF (ENTREGA 4)
   ============================================================ */

export const crearInfraccion = async (req, res) => {
  try {
    const {
      patente,
      velocidad,
      velocidadPermitida,
      lat,
      lng,
      foto,
      camaraId
    } = req.body;

    if (!patente) return res.status(400).json({ error: "Patente requerida." });
    if (!velocidad || !velocidadPermitida) {
      return res.status(400).json({ error: "Velocidades inválidas." });
    }
    if (!lat || !lng) return res.status(400).json({ error: "Coordenadas inválidas." });
    if (!foto) return res.status(400).json({ error: "Foto requerida (base64)." });
    if (!camaraId) return res.status(400).json({ error: "camaraId requerido." });

    // Obtener dirección real
    let direccion = "Dirección no disponible";
    try {
      const geo = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { "User-Agent": "CESA Infracciones" } }
      );
      direccion = geo.data.display_name || direccion;
    } catch (e) {
      console.log("⚠ Reverse geocoding error:", e.message);
    }

    // ID único del acta
    const idActa = `CESA-${Date.now()}`;

    // Guardar en BD propia
    await insertarActaLocal({
      idActa,
      patente,
      velocidad,
      velocidadPermitida,
      lat,
      lng,
      direccion,
      camaraId
    });

    // Generar PDF completo
    const pdfPath = await generarActaPDF({
      idActa,
      patente,
      velocidad,
      velocidadPermitida,
      direccion,
      lat,
      lng,
      fotoBase64: foto,
      camaraId
    });

    return res.json({
      ok: true,
      mensaje: "Acta generada exitosamente.",
      idActa,
      pdf: pdfPath,
      direccion
    });

  } catch (error) {
    console.error("[CREAR INFRACCION] ERROR:", error);
    return res.status(500).json({
      ok: false,
      error: "Error al generar el acta",
      detalle: error.message
    });
  }
};
