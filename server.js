// ===========================
// CARGA .env
// ===========================
import dotenv from "dotenv";
dotenv.config();

// ===========================
// IMPORTS
// ===========================
import express from "express";
import cors from "cors";
import morgan from "morgan";

// Rutas
import pagosRouter from "./src/routes/pagosRoutes.js";
import actasRouter from "./src/routes/actasRoutes.js";
import infraccionesRouter from "./src/routes/infraccionesRoutes.js";
import uploadsRouter from "./src/routes/uploadsRoutes.js";
import adminRouter from "./src/routes/adminRoutes.js"; // si tenés admin

// ===========================
// APP
// ===========================
const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ===========================
// RUTAS
// ===========================
app.use("/api/pagos", pagosRouter);
app.use("/api/actas", actasRouter);
app.use("/api/infracciones", infraccionesRouter);
app.use("/api/uploads", uploadsRouter);

// Ruta admin ejemplo si existe
if (adminRouter) {
    app.use("/admin", adminRouter);
}

// Ruta base para ver que funciona
app.get("/", (req, res) => {
    res.json({
        status: "API funcionando correctamente",
        version: "1.0.0",
    });
});

// ===========================
// SERVIDOR
// ===========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor en puerto " + PORT));


