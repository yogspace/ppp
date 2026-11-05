import { useEffect } from "react";
import { isDark } from "@/features/themes/theme";

/** A hex one step off (its last digit) – not to be seen, but a change. */
const nudge = (hex: string) => {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const d = Number.parseInt(hex.slice(-1), 16);
  return hex.slice(0, -1) + (d === 0 ? 1 : d - 1).toString(16);
};

/**
 * Safari redraws its bars only when `theme-color` really changes: set to a
 * near twin, then back on the next frames (as in the portfolio).
 */
const refreshThemeColor = () => {
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]'
  );
  if (!meta) return;
  const real = meta.content;
  const near = nudge(real);
  if (near === real) return;
  meta.content = near;
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      meta.content = real;
    })
  );
};

/**
 * The page's own color follows the slide – html, body, `theme-color` and
 * `color-scheme` (as in the portfolio): Safari on an iPhone tints its bars
 * above and below from them, so they match the slide. Nothing fixed over
 * the page may carry a color of its own (the player's <main> is clear):
 * Safari would take that one, once, and keep it. The body glides to the new
 * color (styles.css); once there, Safari is nudged to look again.
 */
export const useDocumentColor = (color: string) => {
  useEffect(() => {
    const scheme = isDark(color) ? "dark" : "light";
    const apply = () => {
      const html = document.documentElement;
      html.style.backgroundColor = color;
      html.style.colorScheme = scheme;
      document.body.style.backgroundColor = color;
      for (const [name, content] of [
        ["theme-color", color],
        ["color-scheme", scheme],
      ] as const) {
        let meta = document.querySelector<HTMLMetaElement>(
          `meta[name="${name}"]`
        );
        if (!meta) {
          meta = document.createElement("meta");
          meta.name = name;
          document.head.appendChild(meta);
        }
        meta.content = content;
      }
    };
    apply();
    const settled = window.setTimeout(refreshThemeColor, 700);
    // Back from another tab or the back/forward cache: Safari looks again.
    document.addEventListener("visibilitychange", apply);
    window.addEventListener("pageshow", apply);
    return () => {
      window.clearTimeout(settled);
      document.removeEventListener("visibilitychange", apply);
      window.removeEventListener("pageshow", apply);
    };
  }, [color]);
};
