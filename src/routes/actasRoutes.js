// src/routes/actasRoutes.js
import { Router } from "express";
import { buscarActas } from "../controllers/actasController.js";

const router = Router();

/**
 * GET /api/actas?dni=XXXXXXXX  o  /api/actas?cuit=XXXXXXXXXXXX
 */
router.get("/", buscarActas);

export default router;
