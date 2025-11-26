// src/routes/consulta_fix.js
import express from "express";
import { getActasByPatente } from "../database/db.js";
import {
  consultarInfratrack,
  mapInfraccionesExternas
} from "../utils/infratrackClient.js";

const router = express.Router();

/**
 * 📌 Consulta Ciudadana 5.0
 * GET /consulta?tipo=patente|dni|cuit&valor=XXXX
 *
 * Patente: consulta real (DB + Infratrack).
 * DNI/CUIT: estructura estable y escalable (listo para conectar).
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

  // Objeto base de respuesta
  const respuesta = {
    ok: true,
    criterio: {
      tipo: tipoNormalizado,
      valor
    },
    fuentes: {
      propias: 0,
      infratrack: 0
    },
    datos: {
      propias: [],
      infratrack: []
    }
  };

  try {
    switch (tipoNormalizado) {
      /**
       * 🔵 BÚSQUEDA POR DOMINIO (caso principal)
       * - Buscamos primero en nuestras actas internas (DB)
       * - Luego consultamos a Infratrack Ezeiza
       */
      case "patente": {
        const dominio = valor.toUpperCase().trim();

        // 1) Actas propias
        const actasPropias = await getActasByPatente(dominio);

        // 2) Infratrack (externo)
        const dataInfratrack = await consultarInfratrack("DOMINIO", dominio);
        const actasExternas = mapInfraccionesExternas(dataInfratrack.infracciones);

        // Cargar a la respuesta final
        respuesta.fuentes.propias = actasPropias.length;
        respuesta.fuentes.infratrack = actasExternas.length;

        respuesta.datos.propias = actasPropias;
        respuesta.datos.infratrack = actasExternas;

        // Info adicional útil
        respuesta.meta = dataInfratrack.meta;
        break;
      }

      /**
       * 🔵 BÚSQUEDA POR PERSONA (placeholder estable)
       */
      case "dni":
      case "cuit": {
        respuesta.meta = {
          nota:
            `La búsqueda por ${tipoNormalizado} aún no está implementada. ` +
            `El endpoint ya está estable y listo para conectar con DB.`
        };
        break;
      }

      default:
        return res.status(400).json({
          ok: false,
          error: "Tipo de búsqueda inválido. Use: patente | dni | cuit"
        });
    }

    return res.json(respuesta);
  } catch (error) {
    console.error("ERROR consulta ciudadana:", error);
    return res.status(500).json({
      ok: false,
      error: "Error procesando la consulta ciudadana"
    });
  }
});

/**
 * 📌 Compatibilidad con la versión anterior del sistema:
 * GET /consulta/patente/:patente
 */
router.get("/patente/:patente", async (req, res) => {
  const { patente } = req.params;

  try {
    const dominio = patente.toUpperCase().trim();

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
      meta: dataInfratrack.meta,
      datos: {
        propias: actasPropias,
        infratrack: actasExternas
      }
    });
  } catch (error) {
    console.error("ERROR consulta patente simple:", error);
    return res.status(500).json({
      ok: false,
      error: "Error interno consultando por patente"
    });
  }
});

export default router;
