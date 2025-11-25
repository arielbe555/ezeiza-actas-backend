import { Router } from "express";
import multer from "multer";
import { procesarUploads } from "../controllers/uploadsController.js";

const router = Router();

// Configuración de multer (archivos temporales)
const upload = multer({ dest: "uploads_temp/" });

// ============================================
// SUBIR ARCHIVO (foto, video, pdf) DE UN ACTA
// ============================================
router.post("/file", upload.single("archivo"), procesarUploads);

export default router;
