// ================================================
//  CONTROLADOR DE INFRACCIONES (VERSIÓN FINAL)
//  Totalmente alineado con actas_camaras
// ================================================

import {
  getActasByPatente,
  insertarActaLocal,
  registrarUpload
} from "../database/db.js";

import { generarActaPDF } from "../services/pdfService.js";
import { registrarAuditoria } from "../services/auditoriaService.js";
import { guardarMedia } from "../services/mediaService.js";
import axios from "axios";


// =====================================================
// 🔎 CONSULTAR ACTAS (LOCAL) POR PATENTE
// =====================================================
export async function obtenerInfracciones(req, res) {
  try {
    const { patente } = req.query;

    if (!patente) {
      return res.status(400).json({
        ok: false,
        error: "Debes enviar ?patente= en el query string"
      });
    }

    const actasLocales = await getActasByPatente(patente);

    return res.json({
      ok: true,
      total: actasLocales.length,
      actas: actasLocales
    });
  } catch (err) {
    console.error("[OBTENER INFRACCIONES] ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "Error obteniendo infracciones",
      detalle: err.message
    });
  }
}



// =====================================================
// 📄 CREAR ACTA COMPLETA (FOTO + VIDEO + PDF + AUDITORÍA)
// =====================================================
export const crearInfraccion = async (req, res) => {
  try {
    const {
      patente,
      velocidad,
      velocidadPermitida,
      lat,
      lng,
      foto,
      camaraId,
      video
    } = req.body;

    if (!patente) return res.status(400).json({ error: "Patente requerida." });
    if (!velocidad || !velocidadPermitida)
      return res.status(400).json({ error: "Velocidades inválidas." });
    if (!lat || !lng)
      return res.status(400).json({ error: "Coordenadas inválidas." });
    if (!foto)
      return res.status(400).json({ error: "Foto base64 requerida." });
    if (!camaraId)
      return res.status(400).json({ error: "camaraId requerido." });

    // 1) Reverse geocoding (OpenStreetMap)
    let direccion = "Dirección no disponible";
    try {
      const geo = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { "User-Agent": "CESA-Infracciones" } }
      );
      direccion = geo.data.display_name || direccion;
    } catch (e) {
      console.log("⚠ Error geocoding:", e.message);
    }

    // 2) Generar ID único del acta
    const idActa = `CESA-${Date.now()}`;

    // 3) Insertar registro en actas_camaras
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

    // 4) Guardar foto en disco / cloud
    const rutaFoto = await guardarMedia({
      idActa,
      camaraId,
      tipo: "foto",
      base64: foto
    });

    // 5) Guardar video si existe
    let rutaVideo = null;
    if (video) {
      rutaVideo = await guardarMedia({
        idActa,
        camaraId,
        tipo: "video",
        base64: video
      });
    }

    // 6) Auditoría (alta)
    await registrarAuditoria({
      actaId: idActa,
      accion: "ACTA_CREADA",
      ip: req.ip,
      detalles: `Foto: ${rutaFoto} - Video: ${rutaVideo}`
    });

    // 7) Generar PDF del acta
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

    // 8) Auditoría (PDF generado)
    await registrarAuditoria({
      actaId: idActa,
      accion: "PDF_GENERADO",
      ip: req.ip,
      detalles: pdfPath
    });

    // 9) Respuesta final
    return res.json({
      ok: true,
      mensaje: "Acta generada con media y PDF.",
      idActa,
      direccion,
      foto: rutaFoto,
      video: rutaVideo,
      pdf: pdfPath
    });

  } catch (error) {
    console.error("[CREAR INFRACCION] ERROR:", error);
    return res.status(500).json({
      ok: false,
      error: "Error interno",
      detalle: error.message
    });
  }
};
