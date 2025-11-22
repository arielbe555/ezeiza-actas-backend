// src/controllers/dashboardController.js
import { pool } from "../database/db.js";

/* ============================================================
   RESUMEN GENERAL DEL SISTEMA → PARA DASHBOARD
   ============================================================ */
export const obtenerDashboardStats = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM actas) AS totalActas,
        (SELECT COUNT(*) FROM actas WHERE estado='pendiente_auditoria') AS pendientes,
        (SELECT COUNT(*) FROM actas WHERE estado LIKE 'aprobada_%') AS validadas,
        (SELECT COUNT(*) FROM actas WHERE estado LIKE 'rechazada_%') AS rechazadas
    `);

    return res.json(rows[0]);

  } catch (error) {
    console.error("Error obtenerDashboardStats:", error);
    return res.status(500).json({ error: "Error cargando estadísticas" });
  }
};
