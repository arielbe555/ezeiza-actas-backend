// ============================================
//  SCRAPER PRO - CESA EZEIZA
//  Cloudinary + Axios + Cheerio + Logs en DB
// ============================================

import axios from "axios";
import * as cheerio from "cheerio";
import { v2 as cloudinary } from "cloudinary";
import { insertActa, logScraperError } from "../database/db.js";

// Configuración Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

// Estado del scraper
let state = {
  running: false,
  from: 0,
  to: 0,
  processed: 0,
  errors: [],
  last: null
};

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Subida PRO a Cloudinary
 */
async function subirACloudinary(url, type, id) {
  try {
    const resultado = await cloudinary.uploader.upload(url, {
      folder: `cesa_ezeiza/${type}`,
      public_id: `${id}_${Date.now()}`,
      resource_type: type === "videos" ? "video" : "image"
    });

    return resultado.secure_url;
  } catch (error) {
    console.error("Error subiendo a Cloudinary:", error);
    return null;
  }
}

/**
 * Procesa una ACTA
 */
async function procesarActa(actaId) {
  try {
    const url = `https://infratrack.com.ar/ezeiza/buscar?acta=${actaId}`;
    console.log(`[SCRAPER] Buscando acta ${actaId}...`);

    const res = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(res.data);

    // Extraer datos reales del HTML (nombres verdaderos)
    const dominio = $("#patente").text().trim();
    const fecha = $("#fecha").text().trim();
    const hora = $("#hora").text().trim();
    const marca = $("#marca").text().trim();
    const modelo = $("#modelo").text().trim();
    const lugar = $("#lugar").text().trim();
    const velocidad_registrada = $("#vel_reg").text().trim();
    const velocidad_maxima = $("#vel_max").text().trim();

    const fotoUrl = $("#foto").attr("src");
    const videoUrl = $("#video").attr("src");

    if (!dominio) {
      console.log(`[SCRAPER] Acta ${actaId} inexistente`);
      return;
    }

    // Subida de medios
    let fotoCloud = null;
    if (fotoUrl) fotoCloud = await subirACloudinary(fotoUrl, "fotos", actaId);

    let videoCloud = null;
    if (videoUrl) videoCloud = await subirACloudinary(videoUrl, "videos", actaId);

    // Guardado en DB usando la firma EXACTA del insertActa real
    await insertActa({
      acta: actaId,
      fecha,
      hora,
      dominio,
      marca,
      modelo,
      lugar,
      imagen_path: fotoCloud,
      video_path: videoCloud,
      velocidad_registrada,
      velocidad_maxima
    });

    // Estado interno
    state.last = actaId;
    state.processed++;

  } catch (err) {
    console.error(`[ERROR] Acta ${actaId}:`, err.message);

    state.errors.push({ acta: actaId, error: err.message });

    await logScraperError(`[ACTA ${actaId}] ${err.message}`);
  }
}

/**
 * Inicio del scraping
 */
export async function start(from = 30000, to = 30100) {
  if (state.running) return;

  state.running = true;
  state.from = from;
  state.to = to;
  state.processed = 0;
  state.errors = [];

  console.log(`[SCRAPER] Iniciando scraping de ${from} a ${to}`);

  for (let id = from; id <= to; id++) {
    await procesarActa(id);
    await delay(800);
  }

  state.running = false;
  console.log("[SCRAPER] Finalizado scraping PRO");
}

export function status() {
  return state;
}
