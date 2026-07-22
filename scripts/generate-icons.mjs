/**
 * One-time script: generate favicon.ico + PWA icon set from the real Lumiq logo.
 * Source: public/branding/lumiq-logo-square-512.png
 * Usage: node scripts/generate-icons.mjs
 */
import sharp from "sharp";
import { writeFileSync } from "fs";

const SOURCE = "public/branding/lumiq-logo-square-512.png";

async function main() {
  // Next.js file-convention icons — control the browser tab icon and iOS home-screen icon directly.
  await sharp(SOURCE).resize(512, 512).png().toFile("app/icon.png");
  await sharp(SOURCE).resize(180, 180).png().toFile("app/apple-icon.png");

  // PWA manifest icons (referenced by app/manifest.ts, previously missing entirely)
  await sharp(SOURCE).resize(512, 512).png().toFile("public/icon.png");
  await sharp(SOURCE).resize(192, 192).png().toFile("public/icon-192.png");
  await sharp(SOURCE).resize(512, 512).png().toFile("public/icon-512.png");

  // Maskable icon needs safe-area padding (~20%) so the logo isn't cropped by OS masks
  await sharp(SOURCE)
    .resize(320, 320)
    .extend({ top: 96, bottom: 96, left: 96, right: 96, background: { r: 99, g: 102, b: 241, alpha: 1 } })
    .png()
    .toFile("public/icon-maskable.png");

  // favicon.ico — classic multi-resolution ICO for browser tabs / bookmarks.
  // Each frame is a plain PNG buffer inside an ICO container (same encoding
  // browsers/OSes already expect for sizes > 16px — no external ICO library needed).
  const sizes = [16, 32, 48, 256];
  const pngBuffers = await Promise.all(
    sizes.map((s) => sharp(SOURCE).resize(s, s).png().toBuffer())
  );

  const icoBuffer = buildIco(sizes, pngBuffers);
  writeFileSync("app/favicon.ico", icoBuffer);

  console.log("Generated: app/icon.png, app/favicon.ico, public/icon*.png");
}

/** Builds a minimal ICO container (header + ICONDIRENTRY[] + PNG frame data). */
function buildIco(sizes, pngBuffers) {
  const count = sizes.length;
  const headerSize = 6;
  const entrySize = 16;
  const dataOffset0 = headerSize + entrySize * count;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(count, 4);

  const entries = [];
  let runningOffset = dataOffset0;
  for (let i = 0; i < count; i++) {
    const size = sizes[i];
    const buf = pngBuffers[i];
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height (0 = 256)
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buf.length, 8); // data size
    entry.writeUInt32LE(runningOffset, 12); // data offset
    entries.push(entry);
    runningOffset += buf.length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffers]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
