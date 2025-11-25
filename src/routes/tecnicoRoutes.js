// src/routes/tecnicoRoutes.js
import express from "express";

import {
  listarEventosPendientesTecnico,
  validarEventoTecnico,
  rechazarEventoTecnico,
} from "../controllers/tecnicoController.js";

import {
  verificarToken,
  requireRole,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * GET /api/tecnico/eventos?estado=nuevo
 * Lista eventos pendientes para validación técnica
 */
router.get(
  "/eventos",
  verificarToken,
  requireRole("tecnico", "admin"),
  listarEventosPendientesTecnico
);

/**
 * POST /api/tecnico/eventos/:id/validar
 * El técnico valida el evento → genera el acta
 */
router.post(
  "/eventos/:id/validar",
  verificarToken,
  requireRole("tecnico", "admin"),
  validarEventoTecnico
);

/**
 * POST /api/tecnico/eventos/:id/rechazar
 * El técnico rechaza el evento (ambulancia, vehículo oficial, ruido, error OCR)
 */
router.post(
  "/eventos/:id/rechazar",
  verificarToken,
  requireRole("tecnico", "admin"),
  rechazarEventoTecnico
);

export default router;
