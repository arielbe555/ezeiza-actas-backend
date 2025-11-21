import express from "express";
import { obtenerDashboardStats } from "../controllers/dashboardController.js";
import { verificarToken, requireRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get(
  "/stats",
  verificarToken,
  requireRole("auditor", "admin", "director"), 
  obtenerDashboardStats
);

export default router;
