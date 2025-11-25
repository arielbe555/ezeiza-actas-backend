// src/routes/consulta_fix.js
import express from "express";
import { getActasByPatente } from "../database/db.js";
import { buscarInfratrack } from "../utils/infratrackClient.js";

const router = express.Router();

/**
 * Consulta ciudadana 5.0
 * GET /consulta?tipo=patente|dni|cuit&valor=XXXX
 *
 * Por ahora:
 *  - patente: consulta real (DB + Infratrack)
 *  - dni/cuit: devuelven estructura vacía pero estable
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
      case "patente": {
        // 1) Nuestras actas
        const actasPropias = await getActasByPatente(valor);

        // 2) Infratrack
        const actasInfratrack = await buscarInfratrack(valor);

        respuesta.fuentes.propias = actasPropias.length;
        respuesta.fuentes.infratrack = actasInfratrack.length;
        respuesta.datos.propias = actasPropias;
        respuesta.datos.infratrack = actasInfratrack;
        break;
      }

      case "dni":
      case "cuit": {
        // 🎯 VERSIÓN ESTABLE “PUNTA-APUNTA”
        // Más adelante podemos enganchar:
        //  - getActasByDni(valor)
        //  - getActasByCuit(valor)
        // Por ahora devolvemos estructura vacía pero sin romper nada.
        respuesta.meta = {
          nota: `Búsqueda por ${tipoNormalizado} aún no implementada, endpoint estable listo para conectar a DB.`
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
 * Ruta compatible con lo que ya teníamos:
 * GET /consulta/patente/:patente
 */
router.get("/patente/:patente", async (req, res) => {
  const { patente } = req.params;

  try {
    const actasPropias = await getActasByPatente(patente);
    const actasInfratrack = await buscarInfratrack(patente);

    return res.json({
      ok: true,
      criterio: { tipo: "patente", valor: patente },
      fuentes: {
        propias: actasPropias.length,
        infratrack: actasInfratrack.length
      },
      datos: {
        propias: actasPropias,
        infratrack: actasInfratrack
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
