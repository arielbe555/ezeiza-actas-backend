import express from "express";
import { verificarToken, requireRole } from "../middlewares/authMiddleware.js";
import { dashboardStats } from "../controllers/dashboardController.js";

const router = express.Router();

router.get(
  "/stats",
  verificarToken,
  requireRole("auditor", "admin"),
  dashboardStats
);

export default router;
