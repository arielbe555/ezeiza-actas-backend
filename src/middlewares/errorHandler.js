export const errorHandler = (err, req, res, next) => {
  console.error("🔥 ERROR GLOBAL:", err);
  if (res.headersSent) return;
  res.status(500).json({ error: "Error interno del servidor" });
};
