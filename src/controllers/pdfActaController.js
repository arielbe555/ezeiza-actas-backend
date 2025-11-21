// src/controllers/pdfActaController.js
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
// src/controllers/pdfActaController.js
import pool from "../database/db.js";

import { generarPdfActa } from "../utils/pdfActaService.js";

const pdfDir = path.join(process.cwd(), "pdfs");

/**
 * GET /api/pdf/actas/:id/pdf
 * Genera (si no existe) y devuelve el PDF del acta
 */
export const descargarPdfActa = async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query("SELECT * FROM actas WHERE id=$1", [id]);
    if (!rows.length) {
      return res.status(404).json({ error: "Acta no encontrada" });
    }

    const acta = rows[0];
    const fileName = `acta_${acta.id}.pdf`;
    const filePath = path.join(pdfDir, fileName);

    // Si no existe el PDF, lo genero
    if (!fs.existsSync(filePath)) {
      await generarPdfActa(acta);
    }

    return res.sendFile(filePath);
  } catch (error) {
    console.error("Error descargarPdfActa:", error);
    return res.status(500).json({ error: "Error generando/descargando PDF" });
  }
};

/**
 * POST /api/pdf/actas/:id/enviar-email
 * body: { email }
 * Genera el PDF (si no existe) y lo envía por correo
 */
export const enviarActaPorEmail = async (req, res) => {
  const { id } = req.params;
  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: "Email destino es requerido" });
  }

  try {
    const { rows } = await pool.query("SELECT * FROM actas WHERE id=$1", [id]);
    if (!rows.length) {
      return res.status(404).json({ error: "Acta no encontrada" });
    }

    const acta = rows[0];
    const { filePath, fileName } = await generarPdfActa(acta);

    // Configuración SMTP desde variables de entorno
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const from =
      process.env.SMTP_FROM || "no-reply@cesa-ezeiza.gob.ar";

    await transporter.sendMail({
      from,
      to: email,
      subject: `Notificación de acta de infracción N° ${acta.numero_acta || acta.id}`,
      text: "Se adjunta la notificación oficial de su acta de infracción.",
      html: `
        <p>Estimado/a,</p>
        <p>Se adjunta en este correo la notificación oficial de su acta de infracción de tránsito.</p>
        <p>Puede verificar la autenticidad del documento escaneando el código QR o ingresando al portal de consulta.</p>
        <p>Atentamente,<br/>CESA - Municipalidad de Ezeiza</p>
      `,
      attachments: [
        {
          filename: fileName,
          path: filePath,
        },
      ],
    });

    // Si después querés loguear en tabla notificaciones, lo hacés acá.
    // Lo dejo comentado para no romper nada si la tabla no existe.
    /*
    await pool.query(
      `
      INSERT INTO notificaciones_actas (acta_id, email, fecha_envio, canal)
      VALUES ($1,$2,NOW(),'email')
      `,
      [id, email]
    );
    */

    return res.json({ ok: true, enviado_a: email });
  } catch (error) {
    console.error("Error enviarActaPorEmail:", error);
    return res.status(500).json({ error: "Error enviando el email" });
  }
};
