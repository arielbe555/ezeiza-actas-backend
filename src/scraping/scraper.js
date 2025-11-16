// ============================================
//  SCRAPER PRO - CESA EZEIZA
//  Cloudinary + Axios + Cheerio + Logs en DB
// ============================================

import axios from "axios";
import * as cheerio from "cheerio";
import { v2 as cloudinary } from "cloudinary";
import { insertActa, logScraperError } from "../database/db.js";

// Configurar Cloudinary con variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

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
 * Proceso de scraping de un solo acta
 */
async function procesarActa(id) {
  try {
    const url = `https://infratrack.com.ar/ezeiza/buscar?acta=${id}`;
    console.log(`[SCRAPER] Buscando acta ${id}...`);

    const res = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(res.data);

    const patente = $("#patente").text().trim();
    const fecha = $("#fecha").text().trim();
    const fotoUrl = $("#foto").attr("src");
    const videoUrl = $("#video").attr("src");

    if (!patente) {
      console.log(`[SCRAPER] Acta ${id} inexistente.`);
      return;
    }

    // Subir foto y video a Cloudinary
    let fotoCloud = null;
    if (fotoUrl) {
      fotoCloud = await subirACloudinary(fotoUrl, "fotos", id);
    }

    let videoCloud = null;
    if (videoUrl) {
      videoCloud = await subirACloudinary(videoUrl, "videos", id);
    }

    // Guardar en DB
    await insertActa({
      id,
      patente,
      fecha,
      foto: fotoCloud,
      video: videoCloud
    });

    state.last = id;
    state.processed++;

  } catch (err) {
    console.error(`[ERROR] Acta ${id}:`, err.message);

    state.errors.push({ id, error: err.message });

    await logScraperError(id, err.message);
  }
}

/**
 * Inicio del scraping PRO
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
    await delay(800);  // delay seguro para evitar bloqueo de Infratrack
  }

  state.running = false;
  console.log("[SCRAPER] Finalizado scraping PRO");
}

export function status() {
  return state;
}

