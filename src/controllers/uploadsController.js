import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Config Cloudinary (Render toma variables del .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ============================================
// SUBIR FOTO / VIDEO DE ACTA
// ============================================
export const procesarUploads = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se envió ningún archivo" });
    }

    const archivo = req.file.path;

    const subida = await cloudinary.uploader.upload(archivo, {
      folder: "actas_ezeiza",
      resource_type: "auto",
    });

    // Borrar archivo temporal
    fs.unlinkSync(archivo);

    return res.json({
      ok: true,
      url: subida.secure_url,
      public_id: subida.public_id,
    });

  } catch (err) {
    console.error("❌ Error subiendo archivo:", err);
    return res.status(500).json({
      ok: false,
      error: "Error subiendo archivo a Cloudinary",
    });
  }
};

