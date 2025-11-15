import express from "express";
import {
  consultarPorDominio,
  consultarPorDni,
  consultarPorCuit,
  listarInfracciones,
  crearInfraccion
} from "../controllers/infraccionesController.js";

const router = express.Router();

router.get("/", listarInfracciones);
router.post("/", crearInfraccion);

router.get("/dominio/:dominio", consultarPorDominio);
router.get("/dni/:dni", consultarPorDni);
router.get("/cuit/:cuit", consultarPorCuit);

export default router;
