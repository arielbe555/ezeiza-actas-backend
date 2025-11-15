import { Router } from "express";
import { start, status } from "../scraping/scraper.js";
import { getLastActa } from "../database/db.js";

const router = Router();

// Ejecuta scraping
router.get("/run", (req, res) => {
  start();
  res.json({ status: "scraping-started" });
});

// Estado
router.get("/status", (req, res) => {
  res.json(status());
});

// Última acta
router.get("/last", async (req, res) => {
  const last = await getLastActa();
  res.json(last);
});

export default router;

