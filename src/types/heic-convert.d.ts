declare module "heic-convert" {
  interface HeicConvertOptions {
    buffer: Buffer | Uint8Array | ArrayBufferLike;
    format: "JPEG" | "PNG";
    /** 0..1 (nur für JPEG). */
    quality?: number;
  }
  export default function heicConvert(
    options: HeicConvertOptions
  ): Promise<Buffer>;
}
