import { Router } from "express";
import { login } from "../controllers/authController.js";
import { getActasByPatente, getActaById } from "../controllers/actasController.js";
import { crearPago } from "../controllers/pagosController.js";
import { auth } from "../middlewares/auth.js";

const router = Router();

// health
router.get("/health", (req, res) => {
  res.json({ status: "ok", service: "ezeiza-actas-backend" });
});

// auth
router.post("/auth/login", login);

// actas
router.get("/actas/patente/:patente", auth(), getActasByPatente);
router.get("/actas/:id", auth(), getActaById);

// pagos
router.post("/pagos", auth(), crearPago);

export default router;
