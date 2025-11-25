import axios from "axios";
import * as cheerio from "cheerio";
import { uploadMediaList } from "./cloudinaryUploader.js";

/**
 * Scrapea Infratrack Ezeiza para un tipo de búsqueda y valor.
 * tipo: "DOMINIO" | "DNI" | "CUIT"
 * consulta: valor a buscar
 *
 * Devuelve array de actas, cada una con fotos/videos en Cloudinary.
 */
export async function scrapeEzeiza(tipo, consulta) {
  try {
    const url = `https://consulta-ezeiza.infratrack.com.ar/infracciones/a-pagar?tipo=${encodeURIComponent(
      tipo
    )}&consulta=${encodeURIComponent(consulta)}&g-recaptcha-response=`;

    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0 Safari/537.36",
      },
    });

    const actas = extraerActasDesdeHtml(html);
    if (!actas || actas.length === 0) return [];

    const actasEnriquecidas = [];

    for (const acta of actas) {
      const actaId = (acta.acta || acta.id || "sin-id")
        .toString()
        .replace(/[^a-zA-Z0-9_-]/g, "_");

      const fotos = acta.fotos_extraidas || [];
      const videos = acta.videos_extraidos || [];

      const fotosCloud = await uploadMediaList(
        fotos,
        `ezeiza/${actaId}/fotos`,
        "image"
      );
      const videosCloud = await uploadMediaList(
        videos,
        `ezeiza/${actaId}/videos`,
        "video"
      );

      acta.fotos_cloudinary = fotosCloud;
      acta.videos_cloudinary = videosCloud;

      actasEnriquecidas.push(acta);
    }

    return actasEnriquecidas;
  } catch (err) {
    console.error("ERROR scrapeEzeiza:", err.message);
    return [];
  }
}

function extraerActasDesdeHtml(html) {
  try {
    const actas = [];

    const firstIdx = html.indexOf('{"id"');
    const lastIdx = html.lastIndexOf("}") + 1;

    let baseJson = null;
    if (firstIdx !== -1 && lastIdx !== -1 && lastIdx > firstIdx) {
      const jsonString = html.substring(firstIdx, lastIdx);
      try {
        baseJson = JSON.parse(jsonString);
      } catch (e) {
        console.error("No se pudo parsear JSON principal de actas:", e.message);
      }
    }

    const $ = cheerio.load(html);

    const fotos = [];
    const videos = [];

    $("img.img-thumbnail").each((i, el) => {
      const src = $(el).attr("src");
      if (src) fotos.push(normalizarUrl(src));
    });

    $("source").each((i, el) => {
      const src = $(el).attr("src");
      if (src && src.toLowerCase().includes(".mp4")) {
        videos.push(normalizarUrl(src));
      }
    });

    if (Array.isArray(baseJson)) {
      baseJson.forEach((a) => {
        a.fotos_extraidas = fotos;
        a.videos_extraidos = videos;
        actas.push(a);
      });
    } else if (baseJson && typeof baseJson === "object") {
      baseJson.fotos_extraidas = fotos;
      baseJson.videos_extraidos = videos;
      actas.push(baseJson);
    } else if (fotos.length || videos.length) {
      actas.push({
        id: null,
        acta: null,
        estado: null,
        monto_total_float: null,
        monto_float: null,
        fecha: null,
        lugar: null,
        descripcion: null,
        fotos_extraidas: fotos,
        videos_extraidos: videos,
      });
    }

    return actas;
  } catch (err) {
    console.error("Error extrayendo actas desde HTML:", err.message);
    return [];
  }
}

function normalizarUrl(url) {
  if (!url) return url;
  return url.replace(/\\\\\\//g, "/").replace(/\\//g, "/");
}
