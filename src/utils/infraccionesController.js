import db from "../database/db.js";
import { scrapeEzeiza } from "../utils/scraperEzeiza.js";

export const consultarPorDominio = async (req, res) => {
  await manejarConsultaGenerica("DOMINIO", req.params.dominio, req, res);
};

export const consultarPorDni = async (req, res) => {
  await manejarConsultaGenerica("DNI", req.params.dni, req, res);
};

export const consultarPorCuit = async (req, res) => {
  await manejarConsultaGenerica("CUIT", req.params.cuit, req, res);
};

async function manejarConsultaGenerica(tipo, valor, req, res) {
  try {
    if (!valor) {
      return res.status(400).json({ ok: false, error: "Falta valor de búsqueda" });
    }

    await registrarConsulta(tipo, valor, req);

    const actas = await scrapeEzeiza(tipo, valor);

    if (!actas || actas.length === 0) {
      return res.json({ ok: true, tipo, valor, cantidad: 0, actas: [] });
    }

    await guardarActas(tipo, valor, actas);

    return res.json({
      ok: true,
      tipo,
      valor,
      cantidad: actas.length,
      actas,
    });
  } catch (error) {
    console.error("Error manejarConsultaGenerica:", error);
    return res.status(500).json({
      ok: false,
      error: "Error interno al procesar la consulta",
    });
  }
}

async function registrarConsulta(tipo, valor, req) {
  try {
    const ip =
      req.headers["x-forwarded-for"] ||
      req.socket?.remoteAddress ||
      null;
    const ua = req.headers["user-agent"] || null;

    await db.query(
      `INSERT INTO consultas (tipo, valor, ip, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [tipo, valor, ip, ua]
    );
  } catch (error) {
    console.error("Error registrando consulta:", error.message);
  }
}

async function guardarActas(tipo, valor, actas) {
  try {
    for (const acta of actas) {
      const actaId = acta.id ? String(acta.id) : null;
      const actaNumero = acta.acta ? String(acta.acta) : null;
      const estado = acta.estado || null;
      const fechaActa = acta.fecha || null;
      const montoTotal =
        acta.monto_total_float ||
        acta.monto_float ||
        null;

      const fotos = acta.fotos_cloudinary || [];
      const videos = acta.videos_cloudinary || [];

      await db.query(
        `INSERT INTO infracciones
          (tipo, valor, acta_id, acta_numero, estado, fecha_acta, monto_total,
           json_completo, fotos, videos, origen)
         VALUES
          ($1,   $2,   $3,      $4,          $5,     $6,         $7,
           $8,           $9,    $10,   'externo')`,
        [
          tipo,
          valor,
          actaId,
          actaNumero,
          estado,
          fechaActa,
          montoTotal,
          acta,    // JSON completo
          fotos,
          videos,
        ]
      );
    }
  } catch (error) {
    console.error("Error guardando actas en BD:", error.message);
  }
}
