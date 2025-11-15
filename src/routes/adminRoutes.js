import { Router } from "express";

const router = Router();

// Ruta ejemplo: resumen del sistema
router.get("/resumen", (req, res) => {
    res.json({
        status: "OK",
        message: "Resumen administrativo",
        timestamp: new Date(),
        servicios: {
            pagos: "/api/pagos",
            actas: "/api/actas",
            infracciones: "/api/infracciones",
            uploads: "/api/uploads"
        }
    });
});

export default router;
