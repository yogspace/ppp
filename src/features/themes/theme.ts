import type { CSSProperties } from "react";

/**
 * A theme: the look of a slide or a card – its colors, its font and what lies
 * behind it. Made in the admin (Themes), picked per deck, slide or card.
 * Shared by the collection (the options) and the pages (the values).
 */

export const FONTS = {
  grotesk: {
    label: "Grotesk (Switzer)",
    family: '"Switzer", "Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  rounded: {
    label: "Rounded (Pally)",
    family: '"Pally", ui-rounded, system-ui, sans-serif',
  },
  serif: {
    label: "Serif (Gambarino)",
    family: '"Gambarino", Georgia, "Times New Roman", serif',
  },
} as const;

export type Font = keyof typeof FONTS;

export const BACKGROUNDS = {
  plain: "Plain – just the color",
  lines: "Lines – a thin frame, like a sketchbook",
  dots: "Dots – a drifting dot grid",
  floaties: "Floaties – glossy 3D shapes floating around",
  picture: "Picture or video – full-bleed",
} as const;

export type Background = keyof typeof BACKGROUNDS;

export type ThemeLook = {
  /** Stable per theme – a new one crossfades the backdrop. */
  key: string;
  bg: string;
  text: string;
  accent: string;
  /** A card's sheet and the words on it. */
  paper: string;
  paperText: string;
  font: Font;
  caps: boolean;
  background: Background;
  picture: { src: string; video: boolean } | null;
  grain: boolean;
};

/** Without a theme: pale lilac paper, navy ink – the poster look. */
export const DEFAULT_LOOK: ThemeLook = {
  key: "default",
  bg: "#efeff5",
  text: "#0b1533",
  accent: "#ff5c8a",
  paper: "#fffcf5",
  paperText: "#0b1533",
  font: "grotesk",
  caps: true,
  background: "lines",
  picture: null,
  grain: false,
};

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export const isHex = (value: unknown): value is string =>
  typeof value === "string" && HEX.test(value);

/** The color, or the fallback when it isn't one. */
export const hexOr = (value: unknown, fallback: string) =>
  isHex(value) ? value : fallback;

/** Relative luminance (WCAG) of a hex color, 0 … 1. */
export const luminance = (hex: string) => {
  const full =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex;
  const channel = (i: number) => {
    const c = Number.parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
};

/** A dark color – white things on it, `color-scheme: dark`. */
export const isDark = (hex: string) => luminance(hex) < 0.22;

/** A look as CSS custom properties – set on whatever wears it. */
export const lookVars = (look: ThemeLook) =>
  ({
    "--bg": look.bg,
    "--ink": look.text,
    "--accent": look.accent,
    "--paper": look.paper,
    "--paper-ink": look.paperText,
    "--font": FONTS[look.font].family,
    "--caps": look.caps ? "uppercase" : "none",
    colorScheme: isDark(look.bg) ? "dark" : "light",
  }) as CSSProperties;
