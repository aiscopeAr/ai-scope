/**
 * POST /api/admin/upload-avatar
 * Accepts multipart/form-data with a "file" field.
 * Uploads to Cloudinary (folder: aiscope/authors) and returns the permanent URL.
 * Falls back to a base64 data URL if Cloudinary is not configured.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Only PNG, JPG, WebP, SVG allowed" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Try Cloudinary first
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    try {
      const cloudinaryModule = await import("cloudinary");
      const cloudinary = cloudinaryModule.v2;
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });

      const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "aiscope/authors", resource_type: "image", format: "webp", quality: "auto:good" },
          (err, res) => { if (err || !res) reject(err); else resolve(res); }
        );
        stream.end(buffer);
      });

      return NextResponse.json({ url: result.secure_url });
    } catch (err) {
      console.error("[upload-avatar] Cloudinary failed:", err);
    }
  }

  // Fallback: return base64 data URL (works but not permanent across redeploys)
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${file.type};base64,${base64}`;
  return NextResponse.json({ url: dataUrl, warning: "Cloudinary not configured — using base64 (not persistent)" });
}
