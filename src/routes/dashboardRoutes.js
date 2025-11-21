import express from "express";
import { obtenerDashboardStats } from "../controllers/dashboardController.js";
import { verificarToken, requireRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get(
  "/stats",
  verificarToken,
  requireRole("auditor", "director", "tecnico", "admin"),
  obtenerDashboardStats
);

export default router;
