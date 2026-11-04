import { useEffect } from "react";
import { isDark } from "@/features/themes/theme";

/**
 * The page's own color follows the slide – html, body, `theme-color` and
 * `color-scheme` (as in the portfolio): Safari on an iPhone tints its bars
 * above and below from them, so they match the slide instead of a white
 * strip.
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
    // Back from another tab or the back/forward cache: Safari looks again.
    document.addEventListener("visibilitychange", apply);
    window.addEventListener("pageshow", apply);
    return () => {
      document.removeEventListener("visibilitychange", apply);
      window.removeEventListener("pageshow", apply);
    };
  }, [color]);
};
