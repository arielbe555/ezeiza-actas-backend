// src/middlewares/authMiddleware.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "cambiar_esto_en_produccion";

/**
 * Verifica que venga un JWT válido en Authorization: Bearer <token>
 * y deja el usuario decodificado en req.user
 */
export const verificarToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ error: "Token no enviado" });
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Token mal formado" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Normalizamos los campos del usuario
    req.user = {
      id: decoded.id,
      email: decoded.email,
      rol:
        decoded.rol ||
        decoded.rol_nuevo ||
        decoded.role ||
        "desconocido",
    };

    return next();
  } catch (err) {
    console.error("Error verificarToken:", err);
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};

/**
 * Middleware de autorización por rol.
 * Ej: requireRole('tecnico', 'admin')
 */
export const requireRole = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !req.user.rol) {
      return res.status(403).json({ error: "Usuario sin rol definido" });
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        error: "Acceso denegado para este rol",
        rol: req.user.rol,
      });
    }

    return next();
  };
};
