import express from "express";
import { listarActas, obtenerActa, crearActa, ultimaActa } from "../controllers/actasController.js";

const router = express.Router();

router.get("/", listarActas);
router.get("/ultima", ultimaActa);
router.get("/:id", obtenerActa);
router.post("/", crearActa);

export default router;
