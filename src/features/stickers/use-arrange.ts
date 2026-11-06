"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Arrangement, Placement, Placements, Shape } from "./arrangement";

export type SaveState = "idle" | "saving" | "saved" | "failed";

/**
 * Arranging a deck's stickers on the page: the arrangement as it
 * stands here (so a slide shown again keeps it), each move sent to the
 * arrange endpoint – a sticker's moves in quick succession as one.
 */
export const useArrange = (
  collection: "decks",
  id: string,
  initial: Arrangement
) => {
  const [arrangement, setArrangement] = useState(initial);
  const [state, setState] = useState<SaveState>("idle");
  const timers = useRef(new Map<string, number>());

  // A refresh from the server (the live preview) brings the stored one.
  useEffect(() => setArrangement(initial), [initial]);

  const arrange = useCallback(
    (sticker: string, placement: Placement | null, shape: Shape = "wide") => {
      setArrangement((current) => {
        const own: Placements = { ...current[sticker] };
        if (placement) own[shape] = placement;
        else delete own[shape];
        const next = { ...current };
        if (own.wide || own.tall) next[sticker] = own;
        else delete next[sticker];
        return next;
      });
      const key = `${sticker}:${shape}`;
      window.clearTimeout(timers.current.get(key));
      timers.current.set(
        key,
        window.setTimeout(async () => {
          setState("saving");
          try {
            const response = await fetch(`/api/${collection}/${id}/arrange`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sticker, placement, shape }),
            });
            setState(response.ok ? "saved" : "failed");
          } catch {
            setState("failed");
          }
        }, 300)
      );
    },
    [collection, id]
  );

  return { arrangement, arrange, state };
};
