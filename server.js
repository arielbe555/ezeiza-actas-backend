// server.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
dotenv.config();

import "./src/config/env.js"; // solo valida env
import infraccionesRouter from "./src/routes/infraccionesRoutes.js";
import pagosRouter from "./src/routes/pagosRoutes.js";

const app = express();

// Middlewares base
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Healthcheck
app.get("/", (req, res) => {
  res.json({
    status: "API funcionando correctamente",
    version: "1.0.0"
  });
});

// Resumen admin simple (se puede ampliar después)
app.get("/admin/resumen", (req, res) => {
  res.json({
    status: "OK",
    message: "Resumen administrativo",
    timestamp: new Date().toISOString(),
    servicios: {
      pagos: "/api/pagos",
      actas: "/api/actas",
      infracciones: "/api/infracciones",
      uploads: "/api/uploads"
    }
  });
});

// Rutas de negocio
app.use("/api/infracciones", infraccionesRouter);
app.use("/api/pagos", pagosRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Error handler simple
app.use((err, req, res, next) => {
  console.error("ERROR GLOBAL:", err);
  res.status(500).json({ error: "Error interno del servidor" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});


