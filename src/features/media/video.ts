import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type {
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
} from "payload";
import { MEDIA_DIR } from "@/lib/media-dir";

/**
 * Videos (MP4, MOV, WebM …): their size read from the file, and a still
 * from them – the poster, shown in the admin's lists and on the slide until
 * the video plays. Posters are files of their own (MEDIA_DIR/posters),
 * served at /posters/<name>.webp.
 */

const run = promisify(execFile);
export const POSTER_DIR = path.join(MEDIA_DIR, "posters");
const POSTER_WIDTH = 640;

/**
 * Width and height from an MP4/MOV's track header (`tkhd`) – the boxes'
 * headers only, so even a big file costs nothing. Turned upright as filmed:
 * a phone's portrait video is stored sideways with a turn in its matrix.
 */
export const videoSize = (buf: Buffer) => {
  let best: { width: number; height: number } | null = null;
  const walk = (start: number, end: number) => {
    let offset = start;
    while (offset + 8 <= end) {
      let size = buf.readUInt32BE(offset);
      const type = buf.toString("latin1", offset + 4, offset + 8);
      let head = 8;
      if (size === 1) {
        size = Number(buf.readBigUInt64BE(offset + 8));
        head = 16;
      } else if (size === 0) {
        size = end - offset;
      }
      if (size < head || offset + size > end) break;
      if (type === "moov" || type === "trak" || type === "mdia") {
        walk(offset + head, offset + size);
      } else if (type === "tkhd" && size >= 92) {
        const w = buf.readUInt32BE(offset + size - 8) / 65536;
        const h = buf.readUInt32BE(offset + size - 4) / 65536;
        const a = buf.readInt32BE(offset + size - 44) / 65536;
        const b = buf.readInt32BE(offset + size - 40) / 65536;
        const turned = Math.abs(a) < 0.5 && Math.abs(b) > 0.5;
        if (w >= 1 && h >= 1) {
          best = turned
            ? { width: Math.round(h), height: Math.round(w) }
            : { width: Math.round(w), height: Math.round(h) };
        }
      }
      offset += size;
    }
  };
  try {
    walk(0, buf.length);
  } catch {
    return null;
  }
  return best;
};

/** A still from the video (at ½ s, else its first frame) – its file name. */
const still = async (video: string) => {
  await fs.mkdir(POSTER_DIR, { recursive: true });
  const name = `${randomUUID()}.webp`;
  const out = path.join(POSTER_DIR, name);
  const args = (at: string[]) => [
    ...at,
    "-i",
    video,
    "-frames:v",
    "1",
    "-vf",
    `scale=${POSTER_WIDTH}:-2`,
    "-c:v",
    "libwebp",
    "-quality",
    "80",
    "-y",
    out,
  ];
  try {
    await run("ffmpeg", args(["-ss", "0.5"]));
    await fs.access(out);
  } catch {
    try {
      // A very short clip: ½ s is past its end.
      await run("ffmpeg", args([]));
    } catch {
      return null;
    }
  }
  return name;
};

const dropPoster = async (poster: unknown) => {
  if (typeof poster !== "string") return;
  const name = path.basename(poster);
  if (/^[\w-]+\.webp$/.test(name)) {
    await fs.rm(path.join(POSTER_DIR, name), { force: true });
  }
};

type Upload = { data?: Buffer; mimetype?: string; name?: string };

/** A new video: its size and poster; one saved without a poster: one made. */
export const describeVideo: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const file = (req as typeof req & { file?: Upload }).file;
  const fresh = file?.data && file.mimetype?.startsWith("video/");
  if (fresh && file?.data) {
    const size = videoSize(file.data);
    if (size) Object.assign(data, size);
    const tmp = path.join(
      os.tmpdir(),
      `ppp-${randomUUID()}-${path.basename(file.name ?? "video")}`
    );
    try {
      await fs.writeFile(tmp, file.data);
      const name = await still(tmp);
      if (name) {
        await dropPoster(originalDoc?.poster);
        data.poster = `/posters/${name}`;
      }
    } finally {
      await fs.rm(tmp, { force: true });
    }
    return data;
  }
  // From before posters: made from the file on disk.
  const type = data.mimeType ?? originalDoc?.mimeType;
  const filename = data.filename ?? originalDoc?.filename;
  if (
    !(data.poster ?? originalDoc?.poster) &&
    typeof type === "string" &&
    type.startsWith("video/") &&
    typeof filename === "string"
  ) {
    const name = await still(path.join(MEDIA_DIR, "media", filename));
    if (name) data.poster = `/posters/${name}`;
  }
  return data;
};

export const dropVideoPoster: CollectionAfterDeleteHook = async ({ doc }) => {
  await dropPoster(doc?.poster);
};
