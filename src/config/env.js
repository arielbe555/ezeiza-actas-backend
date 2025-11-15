/**
 * CARGA CORRECTA DEL .env EN WINDOWS + ES MODULES
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Obtener ruta real del archivo actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env desde la raíz del proyecto
dotenv.config({
  path: path.resolve(__dirname, "../../.env")
});

// DEBUG (esto te dice si cargó bien)
console.log("======================================");
console.log("🔧 ENV CARGADO:");
console.log("🟦 DATABASE_URL:", !!process.env.DATABASE_URL);
console.log("🟩 MP_ACCESS_TOKEN:", !!process.env.MP_ACCESS_TOKEN);
console.log("🟨 CLOUDINARY_URL:", !!process.env.CLOUDINARY_URL);
console.log("======================================\n");

// Exportar variables para usar en toda la app
export default process.env;
