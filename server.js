// server.js
import app from "./app.js";
import fs from "fs";
import path from "path";
import consultaRoutes from "./src/routes/consulta_fix.js"; // 👈 OJO: src/routes

// Crear carpeta PDFs si no existe
const pdfDir = path.join(process.cwd(), "pdfs");
if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir);
  console.log("📁 Carpeta /pdfs creada automáticamente");
}

// Rutas de consulta (vecino)
app.use("/consulta", consultaRoutes);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor levantado correctamente en puerto ${PORT}`);
});
