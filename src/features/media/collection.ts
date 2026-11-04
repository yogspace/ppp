import path from "node:path";
import type { CollectionConfig } from "payload";
import { admins, anyone } from "@/access";
import { MEDIA_DIR } from "@/lib/media-dir";
import { cacheFiles } from "./cache";
import { convertHeic } from "./heic";
import { describeVideo, dropVideoPoster } from "./video";

/**
 * Every picture and video: what the slides show, the stickers (a PNG with a
 * transparent background – it gets its white die-cut edge on the page) and
 * the themes' backgrounds.
 *
 * Three sizes besides the original, WebP (keeps the transparency): `small`
 * for the admin, `sticker` (within 1024 × 1024) for a sticker's 3D face,
 * `large` for whatever fills a slide.
 */
export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Picture", plural: "Pictures" },
  access: {
    read: anyone,
    create: admins,
    update: admins,
    delete: admins,
  },
  admin: {
    group: "Library",
    description:
      "Pictures and videos for slides and theme backgrounds. Stickers have a library of their own.",
    listSearchableFields: ["filename", "alt"],
    defaultColumns: ["filename", "alt", "updatedAt"],
  },
  upload: {
    staticDir: path.join(MEDIA_DIR, "media"),
    modifyResponseHeaders: cacheFiles,
    // Every picture (an iPhone's HEIC too – a JPEG then) and every video
    // (MP4, MOV, WebM …).
    mimeTypes: ["image/*", "video/*"],
    // A picture: its small size; a video: its poster (media/video.ts).
    adminThumbnail: ({ doc }) => {
      if (
        typeof doc.mimeType === "string" &&
        doc.mimeType.startsWith("video")
      ) {
        return typeof doc.poster === "string" ? doc.poster : null;
      }
      const sizes = doc.sizes as
        | Record<string, { url?: string | null }>
        | undefined;
      return (
        sizes?.small?.url ?? (typeof doc.url === "string" ? doc.url : null)
      );
    },
    imageSizes: [
      {
        name: "small",
        width: 480,
        withoutEnlargement: true,
        formatOptions: { format: "webp", options: { quality: 82 } },
      },
      {
        name: "sticker",
        width: 1024,
        height: 1024,
        fit: "inside",
        withoutEnlargement: true,
        formatOptions: { format: "webp", options: { quality: 88 } },
      },
      {
        name: "large",
        width: 2000,
        withoutEnlargement: true,
        formatOptions: { format: "webp", options: { quality: 84 } },
      },
    ],
  },
  hooks: {
    beforeOperation: [convertHeic("JPEG")],
    beforeChange: [describeVideo],
    afterDelete: [dropVideoPoster],
  },
  // The list's thumbnails need these, whatever columns it shows.
  forceSelect: { mimeType: true, poster: true, sizes: true, url: true },
  fields: [
    {
      // A video's still (media/video.ts) – made on upload.
      name: "poster",
      type: "text",
      admin: { hidden: true },
    },
    {
      name: "alt",
      type: "text",
      admin: { description: "What it shows – read out instead." },
    },
  ],
};
