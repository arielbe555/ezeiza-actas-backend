// src/services/mediaService.js
import fs from "fs";
import path from "path";

export async function guardarMedia({ idActa, camaraId, tipo, base64 }) {
  try {
    const carpeta = `./media/${idActa}`;
    if (!fs.existsSync(carpeta)) {
      fs.mkdirSync(carpeta, { recursive: true });
    }

    const extension = tipo === "foto" ? "jpg" : "mp4";
    const nombreArchivo = `${tipo}_${camaraId}.${extension}`;
    const rutaCompleta = path.join(carpeta, nombreArchivo);

    const buffer = Buffer.from(base64, "base64");
    fs.writeFileSync(rutaCompleta, buffer);

    return rutaCompleta;
  } catch (error) {
    console.error("Error guardando media:", error);
    throw error;
  }
}
