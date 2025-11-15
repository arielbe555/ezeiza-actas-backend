import { Router } from "express";
import { crearPago } from "../controllers/pagosController.js";

const router = Router();

// Ruta de prueba
router.get("/test", (req, res) => {
  res.json({ status: "ok", message: "API Pagos funcionando correctamente" });
});

// Crear pago
router.post("/crear", crearPago);

export default router;
