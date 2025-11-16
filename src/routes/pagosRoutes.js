// src/routes/pagosRoutes.js
import { Router } from "express";
import { crearPreference } from "../controllers/pagosController.js";

const router = Router();

router.post("/preference", crearPreference);

export default router;

