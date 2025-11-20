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

// Lista eventos para técnico (pendientes, o por estado)
router.get(
  "/eventos",
  verificarToken,
  requireRole("tecnico", "admin"), // admin también puede mirar todo
  listarEventosPendientesTecnico
);

// Valida un evento y genera el acta
router.post(
  "/eventos/:id/validar",
  verificarToken,
  requireRole("tecnico", "admin"),
  validarEventoTecnico
);

// Rechaza un evento (ruido, ambulancia, etc.)
router.post(
  "/eventos/:id/rechazar",
  verificarToken,
  requireRole("tecnico", "admin"),
  rechazarEventoTecnico
);

export default router;
