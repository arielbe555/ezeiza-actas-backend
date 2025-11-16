import express from "express";
import cors from "cors";
import infraccionesRoutes from "./src/routes/infraccionesRoutes.js";
import pagosRoutes from "./src/routes/pagosRoutes.js";
import scrapRoutes from "./src/routes/scrap.js";
import { ENV } from "./src/config/env.js";

const app = express();

app.use(cors());
app.use(express.json());

// Rutas principales
app.use("/api/infracciones", infraccionesRoutes);
app.use("/api/pagos", pagosRoutes);
app.use("/api/scraper", scrapRoutes);

// Root
app.get("/", (req, res) => {
  res.send("Backend CESA EZEIZA funcionando.");
});

// ⭐ Render asigna el puerto aquí
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor levantado en puerto ${PORT}`);
});
