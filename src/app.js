// app.js
import express from "express";
import cors from "cors";

// Middlewares
import { verificarToken } from "./middlewares/authMiddleware.js";

// Rutas
import authRoutes from "./routes/authRoutes.js";                 // 🔥 FALTA EN TU PROYECTO
import infraccionesRoutes from "./routes/infraccionesRoutes.js";
import pagosRoutes from "./routes/pagosRoutes.js";
import scrapRoutes from "./routes/scrap.js";
import tecnicoRoutes from "./routes/tecnicoRoutes.js";
import auditorRoutes from "./routes/auditorRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js";

const app = express();

// Configuración general
app.use(cors());
app.use(express.json());

// ----------------------------------------------
// RUTAS PÚBLICAS
// ----------------------------------------------
app.use("/api/auth", authRoutes);        // 👈 NECESARIO PARA LOGIN
app.use("/api/scraper", scrapRoutes);
app.use("/api/pagos", pagosRoutes);
app.use("/api/pdf", pdfRoutes);

// ----------------------------------------------
// RUTAS PROTEGIDAS
// ----------------------------------------------
app.use("/api/infracciones", verificarToken, infraccionesRoutes);
app.use("/api/tecnico", verificarToken, tecnicoRoutes);
app.use("/api/auditor", verificarToken, auditorRoutes);
app.use("/api/dashboard", verificarToken, dashboardRoutes);

export default app;
