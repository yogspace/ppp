import type { CollectionBeforeOperationHook } from "payload";

/** A HEIC/HEIF photo (an iPhone's) – by its type or its name. */
export const isHeic = (name?: string | null, type?: string | null) =>
  /heic|heif/i.test(type ?? "") || /\.(heic|heif)$/i.test(name ?? "");

type Upload = {
  data?: Buffer;
  name?: string;
  mimetype?: string;
  size?: number;
};

/**
 * An uploaded HEIC turned into a JPEG (a photo) or a PNG (a sticker: its
 * transparency kept) before Payload makes its sizes – sharp can't read HEIC,
 * heic-convert (WASM, no system libraries) can.
 */
export const convertHeic =
  (format: "JPEG" | "PNG"): CollectionBeforeOperationHook =>
  async ({ args, operation, req }) => {
    if (operation !== "create" && operation !== "update") return args;
    const file = (req as typeof req & { file?: Upload }).file;
    if (!(file?.data && isHeic(file.name, file.mimetype))) return args;
    try {
      const { default: heicConvert } = await import("heic-convert");
      const out = Buffer.from(
        await heicConvert({ buffer: file.data, format, quality: 0.92 })
      );
      const ext = format === "PNG" ? "png" : "jpg";
      file.data = out;
      file.size = out.length;
      file.mimetype = format === "PNG" ? "image/png" : "image/jpeg";
      file.name = (file.name ?? "photo").replace(/\.(heic|heif)$/i, `.${ext}`);
    } catch (error) {
      req.payload.logger.error(
        `HEIC not converted: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    return args;
  };
