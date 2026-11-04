import fs from "node:fs/promises";
import path from "node:path";
import { POSTER_DIR } from "@/features/media/video";

/** A video's poster (media/video.ts) – kept by the browser for a day. */
export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ file: string }> }
) => {
  const { file } = await params;
  if (!/^[\w-]+\.webp$/.test(file)) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const body = await fs.readFile(path.join(POSTER_DIR, file));
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
};
