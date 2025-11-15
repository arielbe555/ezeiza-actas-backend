import jwt from "jsonwebtoken";

export const auth = (roles = []) => {
  const allowed = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    try {
      const header = req.headers.authorization || "";
      const token = header.startsWith("Bearer ") ? header.slice(7) : null;

      if (!token) {
        return res.status(401).json({ error: "Token requerido" });
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload;

      if (allowed.length && !allowed.includes(payload.rol)) {
        return res.status(403).json({ error: "Rol no autorizado" });
      }

      next();
    } catch (err) {
      console.error("Auth error", err);
      return res.status(401).json({ error: "Token inválido" });
    }
  };
};
