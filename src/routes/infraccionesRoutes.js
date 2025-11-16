// src/routes/infraccionesRoutes.js
import { Router } from "express";
import { obtenerInfracciones } from "../controllers/infraccionesController.js";

const router = Router();

// GET /api/infracciones?dni=...  o  ?dominio=...
router.get("/", obtenerInfracciones);

export default router;
