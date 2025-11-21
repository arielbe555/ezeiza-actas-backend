import PDFDocument from "pdfkit";
import fs from "fs";
import QRCode from "qrcode";

export async function generarPDFActa(acta) {
  return new Promise(async (resolve, reject) => {
    try {
      const pdfPath = `pdfs/ACTA_${acta.id}.pdf`;

      const doc = new PDFDocument({
        size: "A4",
        margin: 40
      });

      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // Título
      doc.fontSize(22).text("ACTA DE INFRACCIÓN", { align: "center" });
      doc.moveDown();

      // Datos principales
      doc.fontSize(12).text(`Número de Acta: ${acta.numero_acta}`);
      doc.text(`Fecha: ${new Date(acta.fecha).toLocaleString("es-AR")}`);
      doc.text(`Patente: ${acta.patente}`);
      doc.text(`Cámara: ${acta.camara_id}`);
      doc.text(`Ubicación: ${acta.ubicacion || "-"}`);
      doc.text(`Velocidad registrada: ${acta.velocidad_registrada} km/h`);
      doc.text(`Monto calculado: $ ${acta.monto_calculado || acta.monto}`);
      doc.moveDown();

      // QR con link al pago / validación
      const qrData = `https://cesa.ezeiza.gob/validar/${acta.id}`;
      const qrImage = await QRCode.toDataURL(qrData);

      doc.text("Validación con QR:", { underline: true });
      doc.image(qrImage, { width: 150 });
      doc.moveDown();

      // Cierre
      doc.text("Firma Digital:", { underline: true });
      doc.text("--------------------------------------------------");
      doc.text("Sistema CESA - Municipio de Ezeiza");
      doc.end();

      stream.on("finish", () => resolve(pdfPath));
    } catch (err) {
      console.error("Error generando PDF:", err);
      reject(err);
    }
  });
}
