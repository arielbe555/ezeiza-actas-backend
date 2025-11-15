import { Router } from "express";
import multer from "multer";
import { subirImagen } from "../controllers/uploadsController.js";

const router = Router();

const upload = multer({ dest: "tmp_uploads/" });

// POST /api/uploads/imagen
router.post("/imagen", upload.single("file"), subirImagen);

export default router;
