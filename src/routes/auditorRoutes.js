import express from "express";
import {
  listarPendientesAuditor,
  aprobarAuditor,
  rechazarAuditor,
  resolverDirector
} from "../controllers/auditorController.js";

import { verificarToken, requireRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

/* ========================================================
   LISTAR ACTAS PENDIENTES PARA AUDITOR
   ======================================================== */
router.get(
  "/pendientes",
  verificarToken,
  requireRole("auditor", "admin"),
  listarPendientesAuditor
);

/* ========================================================
   APROBAR ACTA (con reglas o solicitud a director)
   ======================================================== */
router.post(
  "/:id/aprobar",
  verificarToken,
  requireRole("auditor", "admin"),
  aprobarAuditor
);

/* ========================================================
   RECHAZAR ACTA
   ======================================================== */
router.post(
  "/:id/rechazar",
  verificarToken,
  requireRole("auditor", "admin"),
  rechazarAuditor
);

/* ========================================================
   RESOLUCION DEL DIRECTOR
   ======================================================== */
router.post(
  "/director/:id/resolver",
  verificarToken,
  requireRole("director", "admin"),
  resolverDirector
);

export default router;
