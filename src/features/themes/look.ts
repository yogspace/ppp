import { pictureOf } from "@/features/media/picture";
import type { Theme } from "@/payload-types";
import {
  BACKGROUNDS,
  type Background,
  DEFAULT_LOOK,
  FONTS,
  type Font,
  hexOr,
  type ThemeLook,
} from "./theme";

/**
 * A theme from the database (populated, or just its id when depth ran out)
 * as the pages wear it – anything missing or broken from the fallback. A
 * picture background without its picture is plain.
 */
export const lookOf = (
  theme: Theme | string | null | undefined,
  fallback: ThemeLook = DEFAULT_LOOK
): ThemeLook => {
  if (!theme || typeof theme === "string") return fallback;
  const picture =
    theme.background === "picture" ? pictureOf(theme.picture) : null;
  const background: Background =
    theme.background in BACKGROUNDS &&
    (theme.background !== "picture" || picture)
      ? (theme.background as Background)
      : "plain";
  return {
    key: theme.id,
    bg: hexOr(theme.bg, fallback.bg),
    text: hexOr(theme.text, fallback.text),
    accent: hexOr(theme.accent, fallback.accent),
    paper: hexOr(theme.paper, fallback.paper),
    paperText: hexOr(theme.paperText, fallback.paperText),
    font: theme.font in FONTS ? (theme.font as Font) : fallback.font,
    caps: theme.caps ?? fallback.caps,
    background,
    picture: picture && { src: picture.src, video: picture.video },
    grain: theme.grain ?? false,
  };
};
