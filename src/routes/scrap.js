import { Router } from "express";
import { start, status } from "../scraping/scraper.js";
import { getLastActa } from "../database/db.js";

const router = Router();

/**
 * Ejecutar scraping
 * Permite parámetros opcionales:
 * /scrap/run?from=10000&to=10200
 */
router.get("/run", async (req, res) => {
  try {
    const from = parseInt(req.query.from) || 30000;
    const to = parseInt(req.query.to) || 30100;

    // Evitar ejecuciones simultáneas
    if (status().running) {
      return res.json({
        ok: false,
        message: "Scraper ya está en ejecución",
        status: status()
      });
    }

    // Arranca scraping
    start(from, to);

    return res.json({
      ok: true,
      message: `Scraping iniciado de ${from} a ${to}`,
      status: status()
    });

  } catch (error) {
    console.error("Error en /scrap/run:", error);
    return res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * Estado del scraper
 */
router.get("/status", (req, res) => {
  return res.json(status());
});

/**
 * Última acta en la base
 */
router.get("/last", async (req, res) => {
  try {
    const last = await getLastActa();
    return res.json({ ok: true, last });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
