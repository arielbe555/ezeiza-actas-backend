import pool from "../config/db.js";

export const dashboardStats = async (req, res) => {
  try {
    const total = await pool.query(`SELECT COUNT(*) AS total FROM actas`);

    const estados = await pool.query(`
      SELECT estado, COUNT(*) AS cantidad
      FROM actas
      GROUP BY estado
    `);

    const stats = {
      totalActas: Number(total.rows[0].total) || 0,
      pendientes: 0,
      validadas: 0,
      rechazadas: 0,
      director: 0
    };

    estados.rows.forEach((e) => {
      if (e.estado === "pendiente_auditoria") stats.pendientes = Number(e.cantidad);
      if (e.estado === "validada" || e.estado === "aprobada_director") stats.validadas += Number(e.cantidad);
      if (e.estado.includes("rechazada")) stats.rechazadas += Number(e.cantidad);
      if (e.estado === "pendiente_director") stats.director += Number(e.cantidad);
    });

    res.json(stats);
  } catch (error) {
    console.error("Error dashboardStats:", error);
    res.status(500).json({ error: "Error obteniendo estadísticas del dashboard" });
  }
};
