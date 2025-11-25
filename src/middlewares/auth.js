// src/middlewares/auth.js
import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      status: "error",
      message: "No autorizado. Token no enviado."
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({
      status: "error",
      message: "Token inválido o expirado."
    });
  }
}

