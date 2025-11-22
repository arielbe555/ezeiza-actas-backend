import app from "./app.js";
import fs from "fs";
import path from "path";

const pdfDir = path.join(process.cwd(), "pdfs");
if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir);
  console.log("📁 Carpeta /pdfs creada automáticamente");
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor levantado correctamente en puerto ${PORT}`);
});
