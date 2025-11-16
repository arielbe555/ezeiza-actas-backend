// ============================================
//  LECTURA DEL .env
// ============================================
import dotenv from "dotenv";

dotenv.config();

// ============================================
//  OBJETO ENV EXPORTADO
// ============================================
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3000,

  // PostgreSQL
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS,
  DB_NAME: process.env.DB_NAME,

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",

  // MercadoPago
  MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN,

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};

// ============================================
//  SI QUERÉS USAR env.js SOLO PARA CARGAR
// ============================================
console.log("[ENV] Variables cargadas correctamente");
