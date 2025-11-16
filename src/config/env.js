// src/config/env.js
import dotenv from "dotenv";
dotenv.config();

const required = (name) => {
  const value = process.env[name];
  if (!value) {
    console.warn(`[ENV] Falta variable ${name} (usando valor por defecto si corresponde)`);
  }
  return value;
};

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 10000,
  DATABASE_URL: required("DATABASE_URL"),
  // Render normalmente requiere SSL parcial
  DB_SSL_REJECT_UNAUTHORIZED: process.env.DB_SSL_REJECT_UNAUTHORIZED === "true",
  INFRA_EZEIZA_URL:
    process.env.INFRA_EZEIZA_URL ||
    "https://consulta-ezeiza.infratrack.com.ar/infracciones/a-pagar",
  INFRA_TIPO_DOMINIO: process.env.INFRA_TIPO_DOMINIO || "DOMINIO",
  INFRA_TIPO_DOCUMENTO: process.env.INFRA_TIPO_DOCUMENTO || "DOCUMENTO",
  MP_ACCESS_TOKEN: required("MP_ACCESS_TOKEN")
};

