// src/routes/index.js
import { Router } from "express";
import adminRoutes from "./adminRoutes.js";
import actasRoutes from "./actasRoutes.js";

const router = Router();

// Healthcheck
router.get("/", (req, res) => {
  res.json({
    status: "API funcionando correctamente",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// Rutas admin
router.use("/admin", adminRoutes);

// Rutas actas (consultas públicas)
router.use("/api/actas", actasRoutes);

// (En próximas entregas enchufamos /api/infracciones, /api/pagos, /api/uploads, /api/scraper, etc.)
export default router;

