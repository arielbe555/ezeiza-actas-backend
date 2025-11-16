// src/config/db.js
import pkg from "pg";
import { logger } from "../utils/logger.js";

const { Pool } = pkg;

let pool;

export function getPool() {
  if (!pool) {
    throw new Error("Pool de PostgreSQL no inicializado. Llamá a connectDB() primero.");
  }
  return pool;
}

export async function connectDB() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL no está definida en las variables de entorno.");
  }

  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  // Probar conexión
  try {
    const client = await pool.connect();
    const res = await client.query("SELECT NOW()");
    logger.info(`🟢 Conectado a PostgreSQL. NOW() = ${res.rows[0].now}`);
    client.release();
  } catch (err) {
    logger.error("❌ Error conectando a PostgreSQL:", err);
    throw err;
  }

  return pool;
}

