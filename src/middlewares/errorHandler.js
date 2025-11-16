// src/middlewares/errorHandler.js
import { logger } from "../utils/logger.js";

export function notFoundHandler(req, res, next) {
  res.status(404).json({
    status: "error",
    message: `Ruta ${req.originalUrl} no encontrada`
  });
}

export function errorHandler(err, req, res, next) {
  logger.error("Error no controlado:", err);

  const status = err.status || 500;
  const message =
    err.publicMessage ||
    err.message ||
    "Ocurrió un error inesperado. Intente nuevamente o contacte al administrador.";

  res.status(status).json({
    status: "error",
    message
  });
}
