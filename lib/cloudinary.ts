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

/** Strips query string/credentials — safe to log. */
function sanitizeUrlForLog(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}${u.pathname}`;
  } catch {
    return "<unparseable-url>";
  }
}

/**
 * Fetch an image from an arbitrary HTTPS source (e.g. a Replicate prediction
 * output — historical replicate.delivery or newer signed R2/Cloudflare gateway
 * URLs) and upload the bytes to Cloudinary.
 *
 * We deliberately fetch the bytes ourselves rather than handing Cloudinary's
 * uploader the remote URL: Cloudinary's remote-fetch path probes the URL in
 * ways some signed URLs reject (e.g. HEAD returns 403 while GET succeeds),
 * so uploading bytes we already GET'd ourselves avoids depending on that
 * probe behavior. Not tied to any specific source hostname.
 *
 * Returns null on failure (caller decides fallback).
 */
export async function uploadImageFromUrl(
  sourceUrl: string,
  folder = "aiscope/articles",
): Promise<string | null> {
  const safeUrl = sanitizeUrlForLog(sourceUrl);

  let response: Response;
  try {
    response = await fetch(sourceUrl, { method: "GET" });
  } catch (err) {
    console.error(
      `[cloudinary] stage=replicate_output_fetch host=${safeUrl} error=${err instanceof Error ? err.message : "fetch failed"}`,
    );
    return null;
  }

  if (!response.ok) {
    console.error(`[cloudinary] stage=replicate_output_fetch host=${safeUrl} status=${response.status}`);
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    console.error(`[cloudinary] stage=replicate_output_fetch host=${safeUrl} error=unexpected content-type "${contentType}"`);
    return null;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0) {
    console.error(`[cloudinary] stage=replicate_output_fetch host=${safeUrl} error=empty body`);
    return null;
  }

  configure();

  try {
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          overwrite: true,
          format: "webp",
          quality: "auto:good",
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary upload returned no result"));
            return;
          }
          resolve(result);
        },
      );
      uploadStream.end(buffer);
    });
    return result.secure_url;
  } catch (err) {
    console.error(
      `[cloudinary] stage=cloudinary_upload host=${safeUrl} error=${err instanceof Error ? err.message : "upload failed"}`,
    );
    return null;
  }
}
