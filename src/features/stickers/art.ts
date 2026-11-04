import { outlineRings, type Ring } from "./outline";

/**
 * A sticker made from a picture, in the browser: the die-cut outline (the
 * picture's shape grown by a white rim), the face (the picture on white)
 * and a soft shadow. All in the face's coordinates: 0 … 1 across its width,
 * y down; the picture sits in its middle.
 */
export type StickerArt = {
  /** The outline(s) – x 0 … 1, y 0 … `aspect`. */
  rings: Ring[];
  /** The face's height / width. */
  aspect: number;
  /** The face: white, the picture in the middle. */
  face: HTMLCanvasElement;
  /** The shadow, black and soft, `shadowScale` × the face, same middle. */
  shadow: HTMLCanvasElement;
  shadowScale: number;
  /** The picture's width as a share of the face's. */
  pictureShare: number;
  /** The face's height as a share of the picture's. */
  faceHeight: number;
  /**
   * The sticker flat, cut out along its outline (white rim, the picture in
   * it), as big as the face – a PNG's address, for while its slide moves.
   */
  flat: string;
};

/** The flat sticker is drawn at most this big (longer side, px). */
const FLAT = 512;

/** The white rim, as a share of the picture's longer side. */
const RIM = 0.06;
/** Room around the rim, so nothing touches the edge. */
const PAD = RIM * 1.3;
/** The outline is traced at this size (longer side, px) … */
const MASK = 260;
/** … the face drawn at most at this one. */
const FACE = 1024;
const SHADOW_SCALE = 1.4;

const canvas = (width: number, height: number) => {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(width));
  c.height = Math.max(1, Math.round(height));
  return c;
};

const context = (c: HTMLCanvasElement) => {
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("No 2D canvas");
  return ctx;
};

const load = async (src: string) => {
  const image = new Image();
  image.decoding = "async";
  image.src = src;
  await image.decode();
  return image;
};

/**
 * The picture grown by `radius`: drawn again and again around three
 * circles – an outer one for the rim's edge, two inner ones so small
 * pieces are filled, not ringed.
 */
const drawGrown = (
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  for (const [share, count] of [
    [1, 32],
    [0.66, 20],
    [0.33, 12],
  ] as const) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      ctx.drawImage(
        image,
        x + Math.cos(a) * radius * share,
        y + Math.sin(a) * radius * share,
        width,
        height
      );
    }
  }
  ctx.drawImage(image, x, y, width, height);
};

/** A soft copy: down to a few pixels and back up – the smoothing blurs. */
const soften = (source: HTMLCanvasElement, steps: number) => {
  let current = source;
  for (let i = 0; i < steps; i++) {
    const next = canvas(current.width / 2, current.height / 2);
    const ctx = context(next);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(current, 0, 0, next.width, next.height);
    current = next;
  }
  const out = canvas(source.width, source.height);
  const ctx = context(out);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(current, 0, 0, out.width, out.height);
  return out;
};

const make = async (src: string): Promise<StickerArt> => {
  const image = await load(src);
  const iw = image.naturalWidth || 1;
  const ih = image.naturalHeight || 1;
  const long = Math.max(iw, ih);
  const pad = long * PAD;
  const fw = iw + 2 * pad;
  const fh = ih + 2 * pad;

  // The outline: the picture's shape grown by the rim, traced.
  const k = MASK / Math.max(fw, fh);
  const mask = canvas(fw * k, fh * k);
  const mctx = context(mask);
  drawGrown(mctx, image, pad * k, pad * k, iw * k, ih * k, long * RIM * k);
  const alpha = mctx.getImageData(0, 0, mask.width, mask.height).data;
  const values = new Float32Array(mask.width * mask.height);
  for (let i = 0; i < values.length; i++) values[i] = alpha[i * 4 + 3] / 255;
  const rings = outlineRings(values, mask.width, mask.height).map((ring) =>
    ring.map(([x, y]) => [x / mask.width, y / mask.width] as [number, number])
  );

  // The face: the picture on white – outside the outline nobody sees it.
  const kf = Math.min(FACE / Math.max(fw, fh), 2);
  const face = canvas(fw * kf, fh * kf);
  const fctx = context(face);
  fctx.fillStyle = "#ffffff";
  fctx.fillRect(0, 0, face.width, face.height);
  fctx.imageSmoothingQuality = "high";
  fctx.drawImage(image, pad * kf, pad * kf, iw * kf, ih * kf);

  // Flat: the grown shape in white, the picture on it.
  const kc = Math.min(FLAT / Math.max(fw, fh), 1);
  const cut = canvas(fw * kc, fh * kc);
  const cctx = context(cut);
  drawGrown(cctx, image, pad * kc, pad * kc, iw * kc, ih * kc, long * RIM * kc);
  cctx.globalCompositeOperation = "source-in";
  cctx.fillStyle = "#ffffff";
  cctx.fillRect(0, 0, cut.width, cut.height);
  cctx.globalCompositeOperation = "source-over";
  cctx.imageSmoothingQuality = "high";
  cctx.drawImage(image, pad * kc, pad * kc, iw * kc, ih * kc);
  const flat = await new Promise<string>((resolve) =>
    cut.toBlob((blob) => resolve(blob ? URL.createObjectURL(blob) : ""))
  );

  // The shadow: the grown shape in black, a little bigger canvas, softened.
  const shadow = canvas(mask.width * SHADOW_SCALE, mask.height * SHADOW_SCALE);
  const sctx = context(shadow);
  sctx.drawImage(
    mask,
    (shadow.width - mask.width) / 2,
    (shadow.height - mask.height) / 2
  );
  sctx.globalCompositeOperation = "source-in";
  sctx.fillStyle = "#000000";
  sctx.fillRect(0, 0, shadow.width, shadow.height);

  return {
    rings,
    aspect: fh / fw,
    face,
    shadow: soften(shadow, 3),
    shadowScale: SHADOW_SCALE,
    pictureShare: iw / fw,
    faceHeight: fh / ih,
    flat,
  };
};

const made = new Map<string, Promise<StickerArt>>();

/** A picture's sticker – made once per picture and page. */
export const stickerArt = (src: string) => {
  let art = made.get(src);
  if (!art) {
    art = make(src);
    made.set(src, art);
    art.catch(() => made.delete(src));
  }
  return art;
};
