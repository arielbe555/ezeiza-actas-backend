// src/routes/pdfRoutes.js
import express from "express";
import {
  descargarPdfActa,
  enviarActaPorEmail,
} from "../controllers/pdfActaController.js";

const router = express.Router();

// ✅ Ruta pública para que el ciudadano pueda validar/ver el PDF por QR
router.get("/actas/:id/pdf", descargarPdfActa);

// ✅ Ruta para enviar el PDF por email (se puede proteger más adelante)
router.post("/actas/:id/enviar-email", enviarActaPorEmail);

export default router;
