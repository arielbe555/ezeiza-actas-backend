// src/services/auditoriaService.js
import fs from "fs";
import path from "path";

export async function registrarAuditoria({ actaId, accion, ip, detalles }) {
  try {
    const carpeta = "./auditoria";

    if (!fs.existsSync(carpeta)) {
      fs.mkdirSync(carpeta, { recursive: true });
    }

    const archivo = path.join(carpeta, `${actaId}.log`);

    const linea = `[${new Date().toISOString()}] | ACCION=${accion} | IP=${ip} | DETALLES=${detalles}\n`;

    fs.appendFileSync(archivo, linea);

    return true;
  } catch (error) {
    console.error("Error registrando auditoría:", error);
    throw error;
  }
}
