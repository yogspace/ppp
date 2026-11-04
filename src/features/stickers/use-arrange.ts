"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Arrangement, Placement } from "./arrangement";

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
    (sticker: string, placement: Placement | null) => {
      setArrangement((current) => {
        const next = { ...current };
        if (placement) next[sticker] = placement;
        else delete next[sticker];
        return next;
      });
      window.clearTimeout(timers.current.get(sticker));
      timers.current.set(
        sticker,
        window.setTimeout(async () => {
          setState("saving");
          try {
            const response = await fetch(`/api/${collection}/${id}/arrange`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sticker, placement }),
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
