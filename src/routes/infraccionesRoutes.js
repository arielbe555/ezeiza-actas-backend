// src/routes/infraccionesRoutes.js

import { Router } from "express";
import {
  obtenerInfracciones,
  crearInfraccion
} from "../controllers/infraccionesController.js";

const router = Router();

/*  
  ============================
     RUTAS OFICIALES CESA
  ============================
*/

// 🔎 Buscar infracciones (tu endpoint original)
router.get("/", obtenerInfracciones);

// 📝 Crear acta local + generar PDF (Entrega 4)
router.post("/crear", crearInfraccion);

export default router;
