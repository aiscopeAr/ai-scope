import { v2 as cloudinary } from "cloudinary";

let _configured = false;

function configure() {
  if (_configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  _configured = true;
}

/**
 * Upload an image from a URL to Cloudinary and return a permanent URL.
 * Falls back to the original URL if upload fails.
 */
export async function uploadImageFromUrl(
  sourceUrl: string,
  folder = "aiscope/articles",
): Promise<string> {
  try {
    configure();
    const result = await cloudinary.uploader.upload(sourceUrl, {
      folder,
      resource_type: "image",
      // Overwrite if same public_id (idempotent)
      overwrite: true,
      // Optimize delivery
      format: "webp",
      quality: "auto:good",
      fetch_format: "auto",
    });
    return result.secure_url;
  } catch (err) {
    console.error("[cloudinary] Upload failed:", err instanceof Error ? err.message : err);
    // Return original URL as fallback — better than nothing
    return sourceUrl;
  }
}
