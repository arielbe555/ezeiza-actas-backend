// src/controllers/adminController.js
import { obtenerResumenSistema } from "../services/actasService.js";

export async function getAdminResumen(req, res, next) {
  try {
    const resume = await obtenerResumenSistema();

    res.json({
      status: "OK",
      message: "Resumen administrativo",
      timestamp: new Date().toISOString(),
      servicios: {
        pagos: "/api/pagos",
        actas: "/api/actas",
        infracciones: "/api/infracciones",
        uploads: "/api/uploads"
      },
      resume
    });
  } catch (err) {
    next(err);
  }
}
