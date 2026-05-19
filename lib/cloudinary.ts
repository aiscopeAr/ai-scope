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
 * Returns null on failure (caller decides fallback).
 */
export async function uploadImageFromUrl(
  sourceUrl: string,
  folder = "aiscope/articles",
): Promise<string | null> {
  configure();
  const result = await cloudinary.uploader.upload(sourceUrl, {
    folder,
    resource_type: "image",
    overwrite: true,
    format: "webp",
    quality: "auto:good",
  });
  return result.secure_url;
}
