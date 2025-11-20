// src/app.js
import express from "express";
import cors from "cors";
import morgan from "morgan";

import actasRouter from "./routes/actasRoutes.js";
import pagosRouter from "./routes/pagosRoutes.js";
import uploadsRouter from "./routes/uploadsRoutes.js";
import infraccionesRouter from "./routes/infraccionesRoutes.js";
import scrapRouter from "./routes/scrapRoutes.js";
import tecnicoRoutes from "./routes/tecnicoRoutes.js";

const app = express();

// =======================
// MIDDLEWARES
// =======================
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// =======================
// RUTAS API
// =======================
app.use("/api/actas", actasRouter);
app.use("/api/pagos", pagosRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/infracciones", infraccionesRouter);
app.use("/api/scrap", scrapRouter);

// NUEVO: módulo técnico
app.use("/api/tecnico", tecnicoRoutes);

// Ping simple
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "ezeiza-actas-backend", ts: new Date() });
});

export default app;
