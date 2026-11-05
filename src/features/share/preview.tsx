import fs from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import type { Picture } from "@/features/media/picture";
import { POSTER_DIR } from "@/features/media/video";
import type { DeckData, SlideData } from "@/features/player/types";
import { scratchParts } from "@/features/scratch/parse";
import { defaultPlacement } from "@/features/stickers/arrangement";
import type { Font, ThemeLook } from "@/features/themes/theme";
import { MEDIA_DIR } from "@/lib/media-dir";

/**
 * A slide's share preview (the picture a messenger shows with its link):
 * the slide, drawn anew – its color and background, its words in its
 * font, its stickers with their white rim where they lie. Secrets
 * (`||…||`) stay covered.
 */

export const PREVIEW = { width: 1200, height: 630 };

const OG_FONTS: Record<
  Font,
  { file: string; name: string; weight: 400 | 700 }
> = {
  grotesk: { file: "Switzer-Bold.otf", name: "Switzer", weight: 700 },
  rounded: { file: "Pally-Bold.otf", name: "Pally", weight: 700 },
  serif: { file: "Gambarino-Regular.otf", name: "Gambarino", weight: 400 },
};

const fontOf = async (font: Font) => {
  const spec = OG_FONTS[font];
  try {
    const data = await fs.readFile(
      path.join(process.cwd(), "og-fonts", spec.file)
    );
    return [
      { name: spec.name, data, weight: spec.weight, style: "normal" as const },
    ];
  } catch {
    return [];
  }
};

/** What a slide says, big – its own words, or the deck's title. */
const wordsOf = (slide: SlideData | undefined, title: string) => {
  if (!slide) return title;
  switch (slide.design) {
    case "poster":
      return slide.text;
    case "cover":
      return slide.title;
    case "quote":
      return slide.quote;
    case "card":
      return slide.to ? `For ${slide.to}` : slide.headline || title;
    case "scratch":
      return slide.heading || title;
    case "link":
      return slide.heading || slide.title;
    case "words":
    case "list":
    case "split":
    case "gallery":
      return slide.heading || title;
    default:
      return title;
  }
};

/** Secrets as a silver bar of the same length. */
const covered = (text: string) =>
  scratchParts(text)
    .map((part) =>
      part.secret ? "▒".repeat(Math.max(3, part.text.length)) : part.text
    )
    .join("");

/** The outline grown by `r` px – round-ish: square and cross steps by turns. */
const grow = (mask: Uint8Array, w: number, h: number, r: number) => {
  let cur = mask;
  for (let k = 0; k < r; k++) {
    const next = new Uint8Array(w * h);
    const diag = k % 2 === 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const l = x > 0;
        const rt = x < w - 1;
        const u = y > 0;
        const d = y < h - 1;
        next[i] =
          cur[i] ||
          (l && cur[i - 1]) ||
          (rt && cur[i + 1]) ||
          (u && cur[i - w]) ||
          (d && cur[i + w]) ||
          (diag &&
            ((l && u && cur[i - w - 1]) ||
              (rt && u && cur[i - w + 1]) ||
              (l && d && cur[i + w - 1]) ||
              (rt && d && cur[i + w + 1])))
            ? 1
            : 0;
      }
    }
    cur = next;
  }
  return cur;
};

/** A sticker as a PNG with its white die-cut rim – a data URL – or null. */
const stickerPng = async (src: string, box: number) => {
  try {
    const file = path.join(
      MEDIA_DIR,
      "stickers",
      path.basename(src.split("?")[0])
    );
    const pad = Math.max(6, Math.round(box * 0.07));
    const inner = box - 2 * pad;
    const art = await sharp(file)
      .resize(inner, inner, { fit: "inside" })
      .extend({
        top: pad,
        bottom: pad,
        left: pad,
        right: pad,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = art.info;
    const mask = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) mask[i] = art.data[i * 4 + 3] > 60 ? 1 : 0;
    // The rim: the outline grown, its edge softened a touch.
    const grown = grow(mask, w, h, Math.round(pad * 0.75));
    const soft = await sharp(Buffer.from(grown.map((v) => v * 255)), {
      raw: { width: w, height: h, channels: 1 },
    })
      .blur(1)
      .extractChannel(0)
      .raw()
      .toBuffer();
    const out = Buffer.alloc(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      const a = art.data[i * 4 + 3] / 255;
      const rim = soft[i] / 255;
      for (let c = 0; c < 3; c++) {
        out[i * 4 + c] = Math.round(art.data[i * 4 + c] * a + 255 * (1 - a));
      }
      out[i * 4 + 3] = Math.round(255 * Math.max(a, rim));
    }
    const png = await sharp(out, { raw: { width: w, height: h, channels: 4 } })
      .png()
      .toBuffer();
    return {
      src: `data:image/png;base64,${png.toString("base64")}`,
      aspect: w / h,
    };
  } catch {
    return null;
  }
};

/** A hex color, see-through – the renderer knows no color-mix(). */
const fade = (hex: string, alpha: number) => {
  const h = hex.length === 4 ? hex.replace(/[0-9a-f]/gi, "$&$&") : hex;
  const [r, g, b] = [1, 3, 5].map((i) =>
    Number.parseInt(h.slice(i, i + 2), 16)
  );
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** The background's pattern, as CSS the renderer understands. */
const patternOf = (look: ThemeLook) => {
  if (look.background === "dots") {
    return {
      backgroundImage: `radial-gradient(circle, ${fade(look.text, 0.22)} 2.5px, transparent 3px)`,
      backgroundSize: "34px 34px",
    };
  }
  return {};
};

/**
 * As big as the words fit the picture's middle (about 1020 × 470 px): by the
 * room they need – a letter is about 0.58 of the size wide – and never
 * wider than their longest line or word allows.
 */
const fontSizeFor = (
  text: string,
  width = 1020,
  height = 470,
  /** A letter's width, a share of the size – wider in bold capitals. */
  letter = 0.58
) => {
  const chars = Math.max(1, text.replace(/\s+/g, " ").length);
  const longest = Math.max(1, ...text.split(/\s+/).map((word) => word.length));
  const byArea = Math.sqrt((width * height) / (chars * letter)) * 0.9;
  const byWord = width / (longest * letter * 1.05);
  return Math.round(Math.max(44, Math.min(170, byArea, byWord)));
};

/** The slide's photo, if it shows one – never what a scratch ticket hides. */
const photoOf = (slide: SlideData | undefined): Picture | null => {
  switch (slide?.design) {
    case "picture":
    case "split":
      return slide.image;
    case "gallery":
      return slide.pictures[0]?.picture ?? null;
    case "list":
      return slide.items.find((item) => item.picture)?.picture ?? null;
    default:
      return null;
  }
};

/** A photo (a video: its poster) as a JPEG within `w` × `h` – or null. */
const photoJpeg = async (picture: Picture, w: number, h: number) => {
  const source = picture.video ? picture.poster : picture.src;
  if (!source) return null;
  const name = path.basename(source.split("?")[0]);
  const file = picture.video
    ? path.join(POSTER_DIR, name)
    : path.join(MEDIA_DIR, "media", name);
  try {
    const { data, info } = await sharp(file)
      .resize(w, h, { fit: "inside" })
      .jpeg({ quality: 84 })
      .toBuffer({ resolveWithObject: true });
    return {
      src: `data:image/jpeg;base64,${data.toString("base64")}`,
      width: info.width,
      height: info.height,
    };
  } catch {
    return null;
  }
};

export const sharePreview = async (deck: DeckData, index = 0) => {
  const slide = deck.slides[index] ?? deck.slides[0];
  const look = slide?.look;
  if (!look) {
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", background: "#efeff5" }} />,
      PREVIEW
    );
  }
  const picture = photoOf(slide);
  const alone = slide?.design === "picture";
  const photo = picture
    ? await photoJpeg(picture, alone ? 620 : 470, alone ? 440 : 420)
    : null;
  // A picture slide: its photo, its caption on the polaroid; with words: the
  // words on the left, the photo on the right.
  const caption =
    alone && slide?.design === "picture" ? covered(slide.caption) : "";
  const text = photo && alone ? "" : covered(wordsOf(slide, deck.title)).trim();
  const caps = look.caps && look.font === "grotesk";
  const letter = caps ? 0.74 : 0.58;
  const size = photo
    ? fontSizeFor(text, 480, 420, letter)
    : fontSizeFor(text, 1020, 470, letter);
  const fonts = await fontOf(look.font);
  const family = OG_FONTS[look.font].name;
  const stickers = (
    await Promise.all(
      (slide?.stickers ?? []).slice(0, 8).map(async (sticker, i) => {
        const aspect = sticker.picture.width / sticker.picture.height || 1;
        // Along the edges: the words lie elsewhere here than on the slide.
        const place = defaultPlacement(i, aspect, 0.15, "edges");
        const w = place.w * PREVIEW.width * 1.18;
        const png = await stickerPng(
          sticker.picture.src,
          Math.round(Math.max(w, w / aspect) * 1.5)
        );
        if (!png) return null;
        const h = w / png.aspect;
        return {
          png,
          x: place.x * PREVIEW.width - w / 2,
          y: place.y * PREVIEW.height - h / 2,
          w,
          h,
          r: place.r,
        };
      })
    )
  ).filter((s) => s !== null);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        background: look.bg,
        color: look.text,
        ...(fonts.length ? { fontFamily: family } : {}),
        ...patternOf(look),
      }}
    >
      {look.background === "lines" && (
        <div
          style={{
            position: "absolute",
            inset: 28,
            border: `2px solid ${fade(look.text, 0.18)}`,
            borderRadius: 6,
            display: "flex",
          }}
        />
      )}
      {text && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: photo ? "flex-start" : "center",
            textAlign: photo ? "left" : "center",
            ...(photo ? { width: 600 } : {}),
            padding: photo ? "0 30px 0 90px" : "0 90px",
            fontSize: size,
            lineHeight: 0.95,
            letterSpacing: look.font === "serif" ? 0 : "-0.02em",
            textTransform: caps ? "uppercase" : "none",
          }}
        >
          {text
            .split("\n")
            .filter(Boolean)
            .map((line) => (
              <span key={line} style={{ display: "flex" }}>
                {line}
              </span>
            ))}
        </div>
      )}
      {photo && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: "#ffffff",
            padding: 14,
            paddingBottom: caption ? 10 : 14,
            borderRadius: 10,
            marginRight: alone ? 0 : 70,
            transform: "rotate(-2.5deg)",
            boxShadow: "0 18px 40px -16px rgba(0,0,0,0.55)",
          }}
        >
          <img
            alt=""
            height={photo.height}
            src={photo.src}
            style={{ borderRadius: 4 }}
            width={photo.width}
          />
          {caption && (
            <span
              style={{
                display: "flex",
                maxWidth: photo.width,
                marginTop: 10,
                fontSize: 30,
                color: "#262626",
                textAlign: "center",
              }}
            >
              {caption}
            </span>
          )}
        </div>
      )}
      {stickers.map((s, i) => (
        <img
          alt=""
          height={s.h}
          key={i}
          src={s.png.src}
          style={{
            position: "absolute",
            left: s.x,
            top: s.y,
            transform: `rotate(${s.r}deg)`,
            filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.28))",
          }}
          width={s.w}
        />
      ))}
    </div>,
    { ...PREVIEW, fonts }
  );
};
