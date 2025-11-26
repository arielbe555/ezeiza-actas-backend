// src/routes/consulta_fix.js
import express from "express";
import { getActasByPatente } from "../database/db.js";
import {
  consultarInfratrackPorCuit,
  consultarInfratrackPorPatente,
  mapInfraccionesExternas
} from "../utils/infratrackClient.js";

const router = express.Router();

/**
 * ================================
 *  CONSULTA CIUDADANA 7.0
 * ================================
 *
 * /consulta?tipo=patente&valor=AF687OU
 * /consulta?tipo=cuit&valor=30999001005
 * /consulta?tipo=dni&valor=12345678  (placeholder)
 */
router.get("/", async (req, res) => {
  const { tipo, valor } = req.query;

  if (!tipo || !valor) {
    return res.status(400).json({
      ok: false,
      error: "Faltan parámetros: tipo y valor son obligatorios"
    });
  }

  const tipoNormalizado = String(tipo).toLowerCase().trim();
  const valorLimpio = String(valor).trim();

  const respuesta = {
    ok: true,
    criterio: { tipo: tipoNormalizado, valor: valorLimpio },
    fuentes: { propias: 0, infratrack: 0 },
    datos: { propias: [], infratrack: [] }
  };

  try {
    switch (tipoNormalizado) {
      /**
       * 🔵 CONSULTA POR PATENTE
       */
      case "patente": {
        const dominio = valorLimpio.toUpperCase();

        const actasPropias = await getActasByPatente(dominio);
        const infra = await consultarInfratrackPorPatente(dominio);

        const actasExternas = mapInfraccionesExternas(infra.infracciones);

        respuesta.fuentes.propias = actasPropias.length;
        respuesta.fuentes.infratrack = actasExternas.length;

        respuesta.datos.propias = actasPropias;
        respuesta.datos.infratrack = actasExternas;

        respuesta.meta = infra.meta;
        break;
      }

      /**
       * 🔵 CONSULTA POR CUIT (FUNCIONA PERFECTO)
       */
      case "cuit": {
        const infra = await consultarInfratrackPorCuit(valorLimpio);

        const actasExternas = mapInfraccionesExternas(infra.infracciones);

        respuesta.fuentes.infratrack = actasExternas.length;
        respuesta.datos.infratrack = actasExternas;
        respuesta.meta = infra.meta;
        break;
      }

      /**
       * 🔵 Placeholder DNI
       */
      case "dni": {
        respuesta.meta = {
          nota: "La búsqueda por DNI está lista para conectar a DB."
        };
        break;
      }

      default:
        return res.status(400).json({
          ok: false,
          error: "Tipo inválido. Use: patente | cuit | dni"
        });
    }

    return res.json(respuesta);
  } catch (error) {
    console.error("🛑 ERROR consulta:", error.message);

    return res.status(500).json({
      ok: false,
      error: error.message || "Error procesando la consulta"
    });
  }
});

/**
 * ================================
 *  ENDPOINT COMPATIBLE ANTERIOR
 * ================================
 */
router.get("/patente/:patente", async (req, res) => {
  try {
    const dominio = req.params.patente.toUpperCase();

    const actasPropias = await getActasByPatente(dominio);
    const infra = await consultarInfratrackPorPatente(dominio);
    const actasExternas = mapInfraccionesExternas(infra.infracciones);

    return res.json({
      ok: true,
      criterio: { tipo: "patente", valor: dominio },
      fuentes: {
        propias: actasPropias.length,
        infratrack: actasExternas.length
      },
      meta: infra.meta,
      datos: {
        propias: actasPropias,
        infratrack: actasExternas
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

export default router;
