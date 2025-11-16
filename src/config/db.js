// src/config/db.js
import pg from "pg";
import { ENV } from "./env.js";

const { Pool } = pg;

if (!ENV.DATABASE_URL) {
  console.error(
    "[DB] No se encontró DATABASE_URL. Configurala en Render o en .env"
  );
}

export const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
  ssl: ENV.DATABASE_URL
    ? { rejectUnauthorized: ENV.DB_SSL_REJECT_UNAUTHORIZED ?? false }
    : false
});

pool.on("connect", () => {
  console.log("[DB] Conectado a PostgreSQL");
});

pool.on("error", (err) => {
  console.error("[DB] Error en pool:", err);
});

