// server.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { loadEnv } from "./src/config/env.js";
import { connectDB } from "./src/config/db.js";
import { logger } from "./src/utils/logger.js";

import router from "./src/routes/index.js";
import { notFoundHandler, errorHandler } from "./src/middlewares/errorHandler.js";

loadEnv(); // Carga variables de entorno (.env, etc.)

const app = express();

// Middlewares base
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Rutas principales
app.use("/", router);

// Manejo 404 y errores
app.use(notFoundHandler);
app.use(errorHandler);

// Inicio del servidor
const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`🚀 Servidor CESA escuchando en puerto ${PORT}`);
    });
  } catch (err) {
    logger.error("❌ No se pudo iniciar el servidor", err);
    process.exit(1);
  }
}

start();

