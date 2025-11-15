import { v2 as cloudinary } from "cloudinary";

if (!process.env.CLOUDINARY_URL) {
  console.warn("⚠️ CLOUDINARY_URL no está definido. Cloudinary no funcionará correctamente.");
}

cloudinary.config({
  secure: true,
});

/**
 * Sube una lista de URLs remotas a Cloudinary.
 * urls: array de strings
 * folder: carpeta base en Cloudinary (ej: "ezeiza/F-1234/fotos")
 * defaultResourceType: "image" | "video"
 */
export async function uploadMediaList(
  urls = [],
  folder = "ezeiza",
  defaultResourceType = "image"
) {
  const results = [];

  for (const url of urls) {
    if (!url) continue;
    try {
      const lower = url.toLowerCase();
      let resourceType = defaultResourceType;

      if (lower.endsWith(".mp4") || lower.includes(".mp4")) {
        resourceType = "video";
      } else if (
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".png") ||
        lower.endsWith(".webp")
      ) {
        resourceType = "image";
      }

      const uploadResult = await cloudinary.uploader.upload(url, {
        folder,
        resource_type: resourceType,
      });

      results.push(uploadResult.secure_url);
    } catch (err) {
      console.error("Error subiendo a Cloudinary:", url, err.message);
    }
  }

  return results;
}
