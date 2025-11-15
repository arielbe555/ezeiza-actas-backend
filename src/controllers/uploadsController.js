import { v2 as cloudinary } from "cloudinary";

// Solo mostramos warning si realmente está vacío
if (!process.env.CLOUDINARY_URL || process.env.CLOUDINARY_URL.trim() === "") {
  console.warn("⚠️ CLOUDINARY_URL no definido.");
}

// Configuración automática desde CLOUDINARY_URL
cloudinary.config({
  secure: true,
});

export async function subirImagen(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se envió archivo" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "ezeiza-actas",
    });

    res.json({
      url: result.secure_url,
      public_id: result.public_id
    });

  } catch (err) {
    console.error("Error subirImagen:", err);
    res.status(500).json({ error: "Error subiendo imagen" });
  }
}


