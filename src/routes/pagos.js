import express from "express";
import { subirArchivo, generarPago, verificarPago } from "../controllers/pagosController.js";
const router = express.Router();
router.post("/subir", subirArchivo);
router.post("/generar", generarPago);
router.get("/estado/:id", verificarPago);
export default router;