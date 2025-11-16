// src/config/env.js
import dotenv from "dotenv";

export function loadEnv() {
  const envFound = dotenv.config();
  if (envFound.error) {
    // En producción en Render probablemente ya estén las vars set, así que no es fatal
    console.warn("⚠️ .env no encontrado, usando variables de entorno del sistema");
  }
}

