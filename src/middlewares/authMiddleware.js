import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "cambiar_esto_en_produccion";

export const verificarToken = (req, res, next) => {
  const header = req.headers["authorization"];

  if (!header) {
    return res.status(401).json({ error: "Token no enviado" });
  }

  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Token mal formado" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      rol: decoded.rol || decoded.rol_nuevo || decoded.role || "desconocido",
    };

    next();
  } catch (err) {
    console.error("Error verificarToken:", err);
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user?.rol) {
      return res.status(403).json({ error: "Usuario sin rol definido" });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        error: "Acceso denegado",
        rol: req.user.rol,
      });
    }

    next();
  };
};
