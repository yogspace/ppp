import path from "node:path";
import type { CollectionConfig } from "payload";
import { admins, anyone } from "@/access";
import { MEDIA_DIR } from "@/lib/media-dir";

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
    group: "Content",
    description:
      "Pictures, stickers and background videos. A sticker is a PNG with a transparent background.",
    defaultColumns: ["filename", "alt", "updatedAt"],
  },
  upload: {
    staticDir: path.join(MEDIA_DIR, "media"),
    mimeTypes: ["image/*", "video/mp4", "video/webm"],
    adminThumbnail: "small",
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
  fields: [
    {
      name: "alt",
      type: "text",
      admin: { description: "What it shows – read out instead." },
    },
  ],
};
