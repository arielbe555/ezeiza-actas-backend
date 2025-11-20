import express from "express";
import {
  listarPendientesAuditor,
  aprobarAuditor,
  rechazarAuditor,
  solicitarDirector,
  resolverDirector
} from "../controllers/auditorController.js";

import {
  verificarToken,
  requireRole
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/pendientes",
  verificarToken,
  requireRole("auditor", "admin"),
  listarPendientesAuditor
);

router.post("/:id/aprobar",
  verificarToken,
  requireRole("auditor", "admin"),
  aprobarAuditor
);

router.post("/:id/rechazar",
  verificarToken,
  requireRole("auditor", "admin"),
  rechazarAuditor
);

router.post("/:id/solicitar-director",
  verificarToken,
  requireRole("auditor", "admin"),
  solicitarDirector
);

router.post("/director/:id/resolver",
  verificarToken,
  requireRole("director", "admin"),
  resolverDirector
);

export default router;
