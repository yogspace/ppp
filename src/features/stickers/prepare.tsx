"use client";

import { useEffect } from "react";
import type { SlideData } from "@/features/player/types";
import { stickerArt } from "./art";
import { useStickerStage } from "./sticker-stage";

/** Later, when the page has nothing else to do (Safari: in a moment). */
const idle = (run: () => void) => {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(run, { timeout: 1500 });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(run, 250);
  return () => clearTimeout(id);
};

/**
 * The stickers of the slides around this one made ahead – cut out, outlined,
 * their 3D shape built – one at a time while nothing moves. Else all that
 * work lands on the first frames of the next transition, and it jerks.
 */
export const PrepareStickers = ({
  slides,
}: {
  slides: (SlideData | undefined)[];
}) => {
  const stage = useStickerStage();
  const sources = [
    ...new Set(
      slides.flatMap((slide) => slide?.stickers.map((s) => s.picture.src) ?? [])
    ),
  ];
  const key = sources.join("|");
  // biome-ignore lint/correctness/useExhaustiveDependencies: by the sources (key)
  useEffect(() => {
    if (!(stage.ready && sources.length)) return;
    let on = true;
    let cancel: () => void = () => undefined;
    const next = (i: number) => {
      if (!on || i >= sources.length) return;
      cancel = idle(() => {
        stickerArt(sources[i])
          .then((art) => {
            if (on) stage.prepare(art);
          })
          .catch(() => undefined)
          .finally(() => next(i + 1));
      });
    };
    next(0);
    return () => {
      on = false;
      cancel();
    };
  }, [stage, key]);
  return null;
};
