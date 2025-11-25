// src/controllers/authController.js
import { query } from "../database/db.js";
import bcrypt from "bcryptjs";
import { signToken } from "../utils/jwt.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔥 FIX: CASTEO de rol y rol_nuevo a TEXT para evitar el error 42804
    const sql = `
      SELECT id, nombre, email, password_hash,
             COALESCE(rol::text, rol_nuevo::text, 'desconocido') AS rol
      FROM public.usuarios
      WHERE email = $1 AND activo = TRUE
    `;

    const result = await query(sql, [email]);

    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Usuario no encontrado o inactivo" });
    }

    const user = result.rows[0];

    if (!user.password_hash) {
      return res.status(500).json({ error: "El usuario no tiene password_hash en DB" });
    }

    // 🔐 Validación del password
    const ok = await bcrypt.compare(password, user.password_hash);

    if (!ok) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // 🔑 Generación del JWT
    const token = signToken({
      id: user.id,
      email: user.email,
      rol: user.rol,
    });

    return res.json({
      token,
      usuario: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
    });

  } catch (err) {
    console.error("Error en login:", err);
    return res.status(500).json({ error: "Error interno de autenticación" });
  }
};
console.log("🟢 AUTHCONTROLLER EJECUTADO DESDE:", import.meta.url);
