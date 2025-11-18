import { Router } from "express";
import {
  listarEventosPendientesTecnico,
  validarEventoTecnico,
  rechazarEventoTecnico,
} from "../controllers/tecnicoController.js";

const router = Router();

// Lista eventos pendientes de validación
router.get("/eventos", listarEventosPendientesTecnico);

// Valida y genera acta
router.post("/eventos/:id/validar", validarEventoTecnico);

// Rechaza evento
router.post("/eventos/:id/rechazar", rechazarEventoTecnico);

export default router;
