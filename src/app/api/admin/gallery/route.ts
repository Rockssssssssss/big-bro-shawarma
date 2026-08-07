import { readdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;

/**
 * Lists every image currently in public/food — no hardcoded cap.
 * Drop a file in public/food and it shows up in the admin gallery.
 */
export async function GET() {
  try {
    const dir = path.join(process.cwd(), "public", "food");
    const entries = await readdir(dir, { withFileTypes: true });
    const images = entries
      .filter((e) => e.isFile() && IMAGE_EXT.test(e.name))
      .map((e) => `/food/${e.name}`)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    return NextResponse.json({ images });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list gallery";
    return NextResponse.json({ images: [], error: message }, { status: 500 });
  }
}
