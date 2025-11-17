// src/services/pdfService.js

import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import QRCode from "qrcode";

export async function generarActaPDF(data) {
  const {
    idActa,
    patente,
    velocidad,
    velocidadPermitida,
    direccion,
    lat,
    lng,
    fotoBase64,
    camaraId
  } = data;

  // ============================================================
  // 🟢 1. Crear carpeta /pdfs si no existe (Render NO la crea)
  // ============================================================
  const pdfDir = path.join(process.cwd(), "pdfs");

  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir);
    console.log("📁 Carpeta /pdfs creada automáticamente");
  }

  // ============================================================
  // 🟢 2. Generar HASH digital
  // ============================================================
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(data))
    .digest("hex");

  // ============================================================
  // 🟢 3. Generar QR con firma digital
  // ============================================================
  const qrData = {
    idActa,
    hash,
    fecha: new Date().toISOString(),
  };

  const qrImage = await QRCode.toDataURL(JSON.stringify(qrData));

  // ============================================================
  // 🟢 4. Path final del PDF
  // ============================================================
  const filePath = path.join(pdfDir, `${idActa}.pdf`);

  const doc = new PDFDocument({ margin: 40 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // ============================================================
  // 🟢 5. Header
  // ============================================================
  doc.fontSize(18).text("ACTA DE INFRACCIÓN AUTOMÁTICA", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`ID ACTA: ${idActa}`);
  doc.text(`Fecha/Hora: ${new Date().toLocaleString()}`);
  doc.text(`Cámara: ${camaraId}`);
  doc.moveDown();

  // ============================================================
  // 🟢 6. Datos del vehículo
  // ============================================================
  doc.fontSize(14).text("Datos del Vehículo", { underline: true });
  doc.fontSize(12).text(`Patente: ${patente}`);
  doc.text(`Velocidad registrada: ${velocidad} km/h`);
  doc.text(`Velocidad permitida: ${velocidadPermitida} km/h`);
  doc.text(`Exceso: ${velocidad - velocidadPermitida} km/h`);
  doc.moveDown();

  // ============================================================
  // 🟢 7. Ubicación
  // ============================================================
  doc.fontSize(14).text("Ubicación", { underline: true });
  doc.fontSize(12).text(`Dirección: ${direccion}`);
  doc.text(`Coordenadas: ${lat}, ${lng}`);
  doc.moveDown();

  // ============================================================
  // 🟢 8. Foto capturada
  // ============================================================
  const fotoBuffer = Buffer.from(fotoBase64, "base64");
  doc.image(fotoBuffer, { width: 320 });
  doc.moveDown();

  // ============================================================
  // 🟢 9. QR con hash digital
  // ============================================================
  const qrBuffer = Buffer.from(qrImage.split(",")[1], "base64");
  doc.image(qrBuffer, { width: 140, align: "left" });
  doc.moveDown();

  // ============================================================
  // 🟢 10. Firma digital
  // ============================================================
  doc.fontSize(10).text("FIRMA DIGITAL CESA");
  doc.text(`SHA256: ${hash}`);
  doc.text(`Timestamp: ${new Date().toISOString()}`);

  doc.end();

  return filePath;
}
