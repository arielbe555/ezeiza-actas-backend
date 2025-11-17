// ============================================
//  CARGA DEL .env
// ============================================
import dotenv from "dotenv";
dotenv.config();

// ============================================
//  OBJETO ENV UNIFICADO
// ============================================
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "production",
  PORT: process.env.PORT || 3000,

  // 🔥 PostgreSQL (Render)
  DATABASE_URL: process.env.DATABASE_URL,

  // 🔥 Cloudinary
  CLOUDINARY_URL: process.env.CLOUDINARY_URL,

  // 🔥 JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES: process.env.JWT_EXPIRES,

  // 🔥 CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",

  // 🔥 AWS (si en el futuro modificás mediaService.js)
  AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
  AWS_SECRET_KEY: process.env.AWS_SECRET_KEY,
  AWS_BUCKET: process.env.AWS_BUCKET,
  AWS_REGION: process.env.AWS_REGION,
  AWS_CLOUDFRONT_URL: process.env.AWS_CLOUDFRONT_URL,

  // 🔥 MercadoPago (si lo usás)
  MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN,
};

// ============================================
//  TEST VISUAL
// ============================================
console.log("[ENV] Variables cargadas correctamente");
