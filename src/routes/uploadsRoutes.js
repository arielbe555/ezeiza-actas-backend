// ============================================
//  RUTAS PRO DE SUBIDA DE ARCHIVOS
//  MULTIPLES FORMATOS + VALIDACIÓN + CLOUDINARY
// ============================================

import { Router } from "express";
import multer from "multer";
import { procesarUploads } from "../controllers/uploadsController.js";

const router = Router();

// ----------------------
// CONFIGURACIÓN MULTER
// ----------------------

const storage = multer.memoryStorage();

// Tipos válidos
const allowedMime = {
  images: ["image/jpeg", "image/png", "image/jpg"],
  pdfs: ["application/pdf"],
  videos: ["video/mp4", "video/quicktime"]
};

// Validador de MIME
const fileFilter = (req, file, cb) => {
  const { mimetype } = file;

  if (
    allowedMime.images.includes(mimetype) ||
    allowedMime.pdfs.includes(mimetype) ||
    allowedMime.videos.includes(mimetype)
  ) {
    cb(null, true);
  } else {
    cb(new Error("Formato no permitido"), false);
  }
};

// Límite: 20 MB por archivo
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter
});

// ----------------------
// RUTA PARA MULTIPLES ARCHIVOS
// ----------------------
router.post(
  "/",
  upload.array("files", 10), // máximo 10 archivos
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "No se recibieron archivos"
        });
      }

      const results = await procesarUploads(req.files);

      return res.status(200).json({
        status: "ok",
        cantidad: results.length,
        archivos: results
      });

    } catch (err) {
      console.error("UPLOAD PRO ERROR:", err);
      return res.status(500).json({
        status: "error",
        message: err.message || "Error interno al subir archivos"
      });
    }
  }
);

export default router;
