import { v2 as cloudinary } from "cloudinary";

// Render te inyecta CLOUDINARY_URL ya con credenciales
cloudinary.config({
  secure: true
});

export default cloudinary;
