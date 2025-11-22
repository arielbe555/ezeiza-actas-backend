// src/controllers/authController.js
import { query } from "../database/db.js";
import bcrypt from "bcryptjs";
import { signToken } from "../utils/jwt.js";

/**
 * Login de usuario
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario activo
    const sql = `
      SELECT id, nombre, email,
             password_hash,
             COALESCE(rol, rol_nuevo, 'desconocido') AS rol
      FROM usuarios
      WHERE email = $1 AND activo = TRUE
    `;

    const result = await query(sql, [email]);

    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Usuario no encontrado o inactivo" });
    }

    const user = result.rows[0];

    // Verificar password
    if (!user.password_hash) {
      return res.status(500).json({ error: "El usuario no tiene password_hash en DB" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);

    if (!ok) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Firmar token JWT
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
