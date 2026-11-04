"use client";

import { useRef } from "react";
import type { StickerData } from "@/features/player/types";
import type { Arrangement, Placement } from "./arrangement";
import { Sticker } from "./sticker";

type Props = {
  stickers: StickerData[];
  arrangement: Arrangement;
  /** A square sticker's default width, as a share of the stage's. */
  size?: number;
  arranging?: boolean;
  hidden?: boolean;
  /** Seconds before they fly in, one after another. */
  delay?: number;
  /** Bigger than placed (a phone held upright) – where they sit stays. */
  scale?: number;
  onArrange?: (id: string, placement: Placement | null) => void;
};

/**
 * A slide's or card's stickers, over its words – the layer is the stage
 * their places are measured on.
 */
export const StickerLayer = ({
  stickers,
  arrangement,
  size = 0.15,
  arranging = false,
  hidden = false,
  delay = 0.4,
  scale = 1,
  onArrange,
}: Props) => {
  const layerRef = useRef<HTMLDivElement>(null);
  if (!stickers.length) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20" ref={layerRef}>
      {stickers.map((sticker, index) => (
        <Sticker
          arranging={arranging}
          delay={delay}
          hidden={hidden}
          index={index}
          key={sticker.id}
          layerRef={layerRef}
          onArrange={onArrange}
          scale={scale}
          size={size}
          sticker={sticker}
          stored={arrangement[sticker.id] ?? null}
        />
      ))}
    </div>
  );
};
