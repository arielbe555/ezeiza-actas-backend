// src/routes/adminRoutes.js
import { Router } from "express";
import { getAdminResumen } from "../controllers/adminController.js";
// import { requireAuth } from "../middlewares/auth.js"; // para más adelante

const router = Router();

// Podríamos poner requireAuth acá después
router.get("/resumen", getAdminResumen);

export default router;

