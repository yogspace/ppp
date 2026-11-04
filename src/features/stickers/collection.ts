import path from "node:path";
import type { CollectionConfig } from "payload";
import { admins, anyone } from "@/access";
import { MEDIA_DIR } from "@/lib/media-dir";

/**
 * The sticker library: PNGs (or WebP, SVG) with a transparent background,
 * uploaded once, put on as many slides as wanted – each time with a place of
 * its own. On the page each gets a white die-cut edge and turns into glossy
 * 3D vinyl (stickers/art.ts, renderer.ts).
 *
 * Two sizes besides the original, WebP (keeps the transparency): `small`
 * for the admin, `sticker` (within 1024 × 1024) for the 3D face.
 */
export const Stickers: CollectionConfig = {
  slug: "stickers",
  labels: { singular: "Sticker", plural: "Stickers" },
  access: {
    read: anyone,
    create: admins,
    update: admins,
    delete: admins,
  },
  admin: {
    group: "Library",
    useAsTitle: "name",
    defaultColumns: ["filename", "name", "updatedAt"],
    listSearchableFields: ["name", "filename"],
    description:
      "Stickers to put on slides – PNGs with a transparent background. Upload once, use as often as you like.",
  },
  upload: {
    staticDir: path.join(MEDIA_DIR, "stickers"),
    mimeTypes: ["image/png", "image/webp", "image/svg+xml"],
    adminThumbnail: "small",
    imageSizes: [
      {
        name: "small",
        width: 320,
        height: 320,
        fit: "inside",
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
    ],
  },
  hooks: {
    // A sticker without a name is called after its file.
    beforeValidate: [
      ({ data, req }) => {
        if (data && !data.name) {
          const file = req.file?.name ?? data.filename;
          if (typeof file === "string") {
            data.name = file.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
          }
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      admin: { description: "Empty: after the file." },
    },
  ],
};
