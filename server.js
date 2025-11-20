import fs from "fs";
import path from "path";

const pdfDir = path.join(process.cwd(), "pdfs");
if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir);
  console.log("📁 Carpeta /pdfs creada automáticamente");
}

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

const app = express();

app.use(cors());
app.use(express.json());

// Public
app.use("/api/scraper", scrapRoutes);
app.use("/api/pagos", pagosRoutes);

// Protegidas
app.use("/api/infracciones", verificarToken, infraccionesRoutes);
app.use("/api/tecnico", verificarToken, tecnicoRoutes);
app.use("/api/auditor", verificarToken, auditorRoutes);
app.use("/api/dashboard", verificarToken, dashboardRoutes);

// Root
app.get("/", (req, res) => {
  res.send("🚀 Backend CESA funcionando correctamente.");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor levantado correctamente en puerto ${PORT}`);
});
