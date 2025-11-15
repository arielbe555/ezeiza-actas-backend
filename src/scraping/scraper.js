import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import { insertActa } from "../database/db.js";

let state = {
  running: false,
  from: 0,
  to: 0,
  processed: 0,
  errors: [],
  last: null
};

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function download(url, filepath) {
  const writer = fs.createWriteStream(filepath);

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream"
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

async function procesarActa(id) {
  const url = `https://infratrack.com.ar/ezeiza/buscar?acta=${id}`;
  console.log(`[SCRAPER] Buscando acta ${id}...`);

  const res = await axios.get(url);
  const $ = cheerio.load(res.data);

  const patente = $("#patente").text().trim();
  const fecha = $("#fecha").text().trim();
  const fotoUrl = $("#foto").attr("src");
  const videoUrl = $("#video").attr("src");

  if (!patente) {
    console.log(`[SCRAPER] Acta ${id} inexistente`);
    return;
  }

  let fotoPath = null;
  if (fotoUrl) {
    fotoPath = path.join("ezeiza/fotos", `${id}.jpg`);
    await download(fotoUrl, fotoPath);
  }

  let videoPath = null;
  if (videoUrl) {
    videoPath = path.join("ezeiza/videos", `${id}.mp4`);
    await download(videoUrl, videoPath);
  }

  await insertActa({
    id,
    patente,
    fecha,
    foto: fotoPath,
    video: videoPath
  });

  state.last = id;
  state.processed++;
}

export async function start(from = 30000, to = 30100) {
  if (state.running) return;

  state.running = true;
  state.from = from;
  state.to = to;
  state.processed = 0;
  state.errors = [];

  console.log(`[SCRAPER] Iniciando scraping de ${from} a ${to}`);

  for (let id = from; id <= to; id++) {
    try {
      await procesarActa(id);
      await delay(300);
    } catch (e) {
      console.error(`[ERROR] Acta ${id}:`, e.message);
      state.errors.push({ id, error: e.message });
    }
  }

  state.running = false;
  console.log("[SCRAPER] Finalizado");
}

export function status() {
  return state;
}
