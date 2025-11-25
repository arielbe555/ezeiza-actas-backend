// server.js
import app from "./src/app.js";        // 👈 IMPORT DESDE src/app.js
import fs from "fs";
import path from "path";
import consultaRoutes from "./src/routes/consulta_fix.js";

const pdfDir = path.join(process.cwd(), "pdfs");
if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir);
  console.log("📁 Carpeta /pdfs creada automáticamente");
}

// Rutas de consulta ciudadana
app.use("/consulta", consultaRoutes);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor levantado correctamente en puerto ${PORT}`);
});
