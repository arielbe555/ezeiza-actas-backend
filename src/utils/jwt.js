import jwt from "jsonwebtoken";

export const signToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      rol: user.rol
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "90d" }
  );
};
