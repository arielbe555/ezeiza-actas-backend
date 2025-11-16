import { Router } from "express";
import {
  crearPreferenciaPago,
  webhookMP,
  estadoPagoPorActa,
  historialPagosPorDni
} from "../controllers/pagosController.js";

const router = Router();

// Crear preferencia de pago
router.post("/crear", crearPreferenciaPago);

// Webhook que llama MercadoPago
router.post("/webhook", webhookMP);

// Estado por acta
router.get("/estado/:actaId", estadoPagoPorActa);

// Historial por DNI
router.get("/historial", historialPagosPorDni);

export default router;
