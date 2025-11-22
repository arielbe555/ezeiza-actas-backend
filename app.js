// app.js
import express from "express";
import cors from "cors";

// Middlewares
import { verificarToken } from "./src/middlewares/authMiddleware.js";

// Rutas
import infraccionesRoutes from "./src/routes/infraccionesRoutes.js";
import pagosRoutes from "./src/routes/pagosRoutes.js";
import scrapRoutes from "./src/routes/scrap.js";
import tecnicoRoutes from "./src/routes/tecnicoRoutes.js";
import auditorRoutes from "./src/routes/auditorRoutes.js";
import dashboardRoutes from "./src/routes/dashboardRoutes.js";
import pdfRoutes from "./src/routes/pdfRoutes.js";

const app = express();

// Configuración general
app.use(cors());
app.use(express.json());

// ----------------------------------------------
// Rutas públicas
// ----------------------------------------------
app.use("/api/scraper", scrapRoutes);
app.use("/api/pagos", pagosRoutes);
app.use("/api/pdf", pdfRoutes);

// ----------------------------------------------
// Rutas protegidas
// ----------------------------------------------
app.use("/api/infracciones", verificarToken, infraccionesRoutes);
app.use("/api/tecnico", verificarToken, tecnicoRoutes);
app.use("/api/auditor", verificarToken, auditorRoutes);
app.use("/api/dashboard", verificarToken, dashboardRoutes);

export default app;
