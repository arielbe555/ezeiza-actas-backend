// ============================================
//  CARGA DEL .env (solo 1 vez en toda la app)
// ============================================
import "./config/env.js";

// ============================================
//  IMPORTS DEL SERVIDOR
// ============================================
import express from "express";
import cors from "cors";
import morgan from "morgan";

// Rutas
import actasRouter from "./routes/actasRoutes.js";
import pagosRouter from "./routes/pagosRoutes.js";
import uploadsRouter from "./routes/uploadsRoutes.js";
import infraccionesRouter from "./routes/infraccionesRoutes.js";
import scrapRouter from "./routes/scrap.js";

const app = express();

// ============================================
//  MIDDLEWARES
// ============================================
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*"
}));

app.use(express.json());
app.use(morgan("dev"));

// ============================================
//  RUTA DE SALUD
// ============================================
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "API Ezeiza Actas OK" });
});

// ============================================
//  RUTAS PRINCIPALES
// ============================================
app.use("/api/actas", actasRouter);
app.use("/api/pagos", pagosRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/infracciones", infraccionesRouter);

// SCRAPER
app.use("/scrap", scrapRouter);

// ============================================
//  SERVIDOR
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Servidor levantado en puerto " + PORT);
});

export default app;

