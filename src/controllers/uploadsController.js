
// ============================================
//  CONTROLADOR DE SUBIDAS (CLOUDINARY)
// ============================================

import { v2 as cloudinary } from "cloudinary";

// Configurar Cloudinary desde variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

// Convierte buffer a base64
function bufferToBase64(fileBuffer) {
  return `data:${fileBuffer.mimetype};base64,${fileBuffer.buffer.toString("base64")}`;
}

export const subirArchivo = async (file) => {
  const base64 = bufferToBase64(file);

  const result = await cloudinary.uploader.upload(base64, {
    folder: "ezeiza/uploads",
    resource_type: "image",
  });

  return result.secure_url;
};

