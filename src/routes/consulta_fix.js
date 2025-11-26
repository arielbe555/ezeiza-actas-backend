// src/routes/consulta_fix.js
import express from "express";
import { getActasByPatente } from "../database/db.js";
import {
  consultarInfratrack,
  mapInfraccionesExternas
} from "../utils/infratrackClient.js";

const router = express.Router();

/**
 * ======================================================
 *        CONSULTA CIUDADANA 7.0 (COMPLETA)
 * ======================================================
 *
 * GET /consulta?tipo=patente&valor=XXX
 * GET /consulta?tipo=dni&valor=12345678
 * GET /consulta?tipo=cuit&valor=20301234567
 *
 * Devuelve datos locales + externos, normalizados.
 */
router.get("/", async (req, res) => {
  const { tipo, valor } = req.query;

  if (!tipo || !valor) {
    return res.status(400).json({
      ok: false,
      error: "Faltan parámetros: tipo y valor son obligatorios"
    });
  }

  const tipoNormalizado = String(tipo).toLowerCase();
  const cleanValor = String(valor).trim();

  // Respuesta base homogénea
  const respuesta = {
    ok: true,
    criterio: { tipo: tipoNormalizado, valor: cleanValor },
    fuentes: { propias: 0, infratrack: 0 },
    datos: { propias: [], infratrack: [] },
    meta: {}
  };

  try {
    switch (tipoNormalizado) {

      /**
       * =====================================================
       *            🔵 CONSULTA POR PATENTE
       * =====================================================
       */
      case "patente": {
        const dominio = cleanValor.toUpperCase();

        // 1️⃣ Actas propias
        const actasPropias = await getActasByPatente(dominio);

        // 2️⃣ Actas Infratrack
        const dataInfratrack = await consultarInfratrack("DOMINIO", dominio);
        const actasExternas = mapInfraccionesExternas(dataInfratrack.infracciones);

        respuesta.fuentes.propias = actasPropias.length;
        respuesta.fuentes.infratrack = actasExternas.length;
        respuesta.datos.propias = actasPropias;
        respuesta.datos.infratrack = actasExternas;
        respuesta.meta = {
          ...dataInfratrack.meta,
          total_general: actasPropias.length + actasExternas.length
        };

        break;
      }

      /**
       * =====================================================
       *        🔵 CONSULTA POR DNI / CUIT (SCRAP REAL)
       * =====================================================
       */
      case "dni":
      case "cuit": {
        const documento = cleanValor;

        const dataInfratrack = await consultarInfratrack("DOCUMENTO", documento);
        const actasExternas = mapInfraccionesExternas(dataInfratrack.infracciones);

        respuesta.fuentes.infratrack = actasExternas.length;
        respuesta.datos.infratrack = actasExternas;
        respuesta.meta = {
          ...dataInfratrack.meta,
          total_general: actasExternas.length
        };

        break;
      }

      default:
        return res.status(400).json({
          ok: false,
          error: "Tipo inválido. Use: patente | dni | cuit"
        });
    }

    return res.json(respuesta);

  } catch (error) {
    console.error(
      "🛑 ERROR consulta 7.0:",
      "\nMensaje:", error?.message,
      "\nStatus:", error?.response?.status,
      "\nData:", error?.response?.data,
      "\nStack:", error?.stack
    );

    return res.status(500).json({
      ok: false,
      error: error?.message || "Error interno procesando la consulta"
    });
  }
});


/**
 * =====================================================
 *     RUTA LEGACY (COMPATIBILIDAD HISTÓRICA)
 * =====================================================
 */
router.get("/patente/:patente", async (req, res) => {
  try {
    const dominio = req.params.patente.toUpperCase().trim();

    const actasPropias = await getActasByPatente(dominio);
    const dataInfratrack = await consultarInfratrack("DOMINIO", dominio);
    const actasExternas = mapInfraccionesExternas(dataInfratrack.infracciones);

    return res.json({
      ok: true,
      criterio: { tipo: "patente", valor: dominio },
      fuentes: {
        propias: actasPropias.length,
        infratrack: actasExternas.length
      },
      meta: {
        ...dataInfratrack.meta,
        total_general: actasPropias.length + actasExternas.length
      },
      datos: {
        propias: actasPropias,
        infratrack: actasExternas
      }
    });
  } catch (error) {
    console.error(
      "🛑 ERROR consulta legacy:",
      error?.message
    );

    return res.status(500).json({
      ok: false,
      error: error?.message || "Error consultando patente"
    });
  }
});

export default router;
