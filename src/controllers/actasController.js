// src/controllers/actasController.js
import { buscarActasPorDocumento } from "../services/actasService.js";

export async function buscarActas(req, res, next) {
  try {
    const { dni, cuit } = req.query;

    const actas = await buscarActasPorDocumento({ dni, cuit });

    res.json({
      status: "OK",
      count: actas.length,
      data: actas
    });
  } catch (err) {
    next(err);
  }
}


