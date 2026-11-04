import type { Media, Sticker } from "@/payload-types";

/** A picture as the pages need it – plain data, safe to hand to the browser. */
export type Picture = {
  src: string;
  width: number;
  height: number;
  alt: string;
  video: boolean;
};

type Resized = {
  url?: string | null;
  width?: number | null;
  height?: number | null;
};

/** Kept as uploaded: resizing would stop a GIF and flatten an SVG. */
const KEEP = new Set(["image/gif", "image/svg+xml"]);

/**
 * An upload (populated, or just its id when depth ran out) as a `Picture` –
 * `size` picks the resized version when there is one. Null for anything
 * missing.
 */
export const pictureOf = (
  media: Media | Sticker | string | null | undefined,
  size: "small" | "sticker" | "large" = "large"
): Picture | null => {
  if (!media || typeof media === "string" || !media.url) return null;
  const video = media.mimeType?.startsWith("video/") ?? false;
  const resized =
    video || KEEP.has(media.mimeType ?? "")
      ? null
      : (media.sizes as Record<string, Resized | undefined> | undefined)?.[
          size
        ];
  const pick = resized?.url ? resized : null;
  // A video's size isn't known to Payload: 16:9 until it plays.
  return {
    src: pick?.url ?? media.url,
    width: pick?.width ?? media.width ?? (video ? 16 : 1),
    height: pick?.height ?? media.height ?? (video ? 9 : 1),
    alt: ("alt" in media ? media.alt : "name" in media ? media.name : "") ?? "",
    video,
  };
};
