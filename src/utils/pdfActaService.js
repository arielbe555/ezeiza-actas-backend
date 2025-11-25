// src/utils/pdfActaService.js
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";

const pdfDir = path.join(process.cwd(), "pdfs");

// Por seguridad, nos aseguramos que exista la carpeta /pdfs
if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir);
  console.log("📁 Carpeta /pdfs creada automáticamente");
}

function buildVerificationUrl(acta) {
  const baseUrl =
    process.env.CESA_PUBLIC_URL || "https://cesa-ezeiza.example.gov/consulta";
  const id = acta.numero_acta || acta.id;
  return `${baseUrl}?acta=${encodeURIComponent(id)}`;
}

/**
 * Genera el PDF de un acta dentro de /pdfs
 * Retorna: { filePath, fileName, verificationUrl }
 */
export async function generarPdfActa(acta) {
  return new Promise(async (resolve, reject) => {
    try {
      const fileName = `acta_${acta.id}.pdf`;
      const filePath = path.join(pdfDir, fileName);

      const verificationUrl = buildVerificationUrl(acta);
      const qrDataUrl = await QRCode.toDataURL(verificationUrl);

      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // ENCABEZADO
      doc.fontSize(10).text("MUNICIPALIDAD DE EZEIZA", { align: "left" });
      doc.moveDown(0.3);
      doc.fontSize(8).text("CESA – Centro de Seguridad y Actas", {
        align: "left",
      });

      doc.moveDown(1);
      doc
        .fontSize(16)
        .text("ACTA DE INFRACCIÓN DE TRÁNSITO", { align: "center" });
      doc.moveDown(0.5);

      // DATOS PRINCIPALES DEL ACTA
      doc.fontSize(10);
      doc.text(`N° de acta: ${acta.numero_acta || acta.id}`);
      doc.text(`Patente: ${acta.patente || "-"}`);
      doc.text(
        `Fecha de infracción: ${
          acta.fecha ? new Date(acta.fecha).toLocaleString("es-AR") : "-"
        }`
      );
      doc.text(`Ubicación: ${acta.ubicacion || "-"}`);
      doc.text(`Cámara: ${acta.camara_id || "-"}`);
      doc.text(
        `Velocidad registrada: ${acta.velocidad_registrada || "-"} km/h`
      );
      if (acta.velocidad_permitida) {
        doc.text(`Velocidad permitida: ${acta.velocidad_permitida} km/h`);
      }
      doc.text(`Monto base: $${acta.monto || 0}`);
      if (acta.monto_calculado) {
        doc.text(
          `Monto calculado según resolución: $${acta.monto_calculado}`
        );
      }
      doc.text(`Estado actual: ${acta.estado || "-"}`);

      doc.moveDown(1);
      doc.text("Detalle:", { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(9).text(
        "Esta acta ha sido generada por el sistema CESA a partir de evidencia capturada por cámaras homologadas. " +
          "La presente notificación constituye domicilio fiscal electrónico a los efectos de la Ley de Tránsito.",
        { align: "justify" }
      );

      // LINK + QR DE VALIDACIÓN
      doc.moveDown(1);
      doc.fontSize(10).text("Verificación y pago online:", {
        underline: true,
      });
      doc
        .fontSize(9)
        .text(`Ingrese a: ${verificationUrl}`, {
          link: verificationUrl,
          underline: true,
        });

      const qrImage = qrDataUrl.split(",")[1];
      const qrBuffer = Buffer.from(qrImage, "base64");

      doc.image(qrBuffer, doc.page.width - 150, doc.y - 20, {
        fit: [100, 100],
        align: "right",
      });

      doc.moveDown(2);
      doc
        .fontSize(8)
        .text(
          "Documento firmado digitalmente por el sistema CESA. La alteración de este archivo invalida su validez.",
          { align: "center" }
        );

      doc.end();

      stream.on("finish", () => {
        resolve({ filePath, fileName, verificationUrl });
      });
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}
