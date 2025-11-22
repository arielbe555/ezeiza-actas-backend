// src/app.js
import express from "express";
import cors from "cors";

import { verificarToken } from "./middlewares/authMiddleware.js";

import infraccionesRoutes from "./routes/infraccionesRoutes.js";
import pagosRoutes from "./routes/pagosRoutes.js";
import scrapRoutes from "./routes/scrap.js";
import tecnicoRoutes from "./routes/tecnicoRoutes.js";
import auditorRoutes from "./routes/auditorRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// =============================
// Rutas públicas
// =============================
app.use("/api/scraper", scrapRoutes);
app.use("/api/pagos", pagosRoutes);
app.use("/api/pdf", pdfRoutes);

// =============================
// Rutas protegidas (requieren JWT)
// =============================
app.use("/api/infracciones", verificarToken, infraccionesRoutes);
app.use("/api/tecnico", verificarToken, tecnicoRoutes);
app.use("/api/auditor", verificarToken, auditorRoutes);
app.use("/api/dashboard", verificarToken, dashboardRoutes);

export default app;
