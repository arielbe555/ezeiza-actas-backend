// src/routes/consulta_fix.js
import express from "express";
import { getActaById, getActasByPatente } from "../database/db.js";

const router = express.Router();

/**
 * Consulta por acta
 * GET /consulta/acta/:id
 */
router.get("/acta/:id", async (req, res) => {
  try {
    const acta = await getActaById(req.params.id);

    if (!acta) {
      return res
        .status(404)
        .json({ ok: false, msg: "Acta no encontrada" });
    }

    res.json({ ok: true, acta });
  } catch (err) {
    console.error("consulta/acta error:", err);
    res
      .status(500)
      .json({ ok: false, error: "Error interno" });
  }
});

/**
 * Consulta por patente
 * GET /consulta/patente/:patente
 */
router.get("/patente/:patente", async (req, res) => {
  try {
    const actas = await getActasByPatente(req.params.patente);
    res.json({ ok: true, actas });
  } catch (err) {
    console.error("consulta/patente error:", err);
    res
      .status(500)
      .json({ ok: false, error: "Error interno" });
  }
});

export default router;
