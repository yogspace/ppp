"use client";

import { useRef } from "react";
import type { StickerData } from "@/features/player/types";
import {
  type Arrangement,
  type Placement,
  placementFor,
  type Shape,
  type Spots,
} from "./arrangement";
import { Sticker } from "./sticker";

type Props = {
  stickers: StickerData[];
  arrangement: Arrangement;
  /** A square sticker's default width, as a share of the stage's. */
  size?: number;
  /** Where they sit by default: over the slide, or along its edges. */
  spots?: Spots;
  arranging?: boolean;
  hidden?: boolean;
  /** Seconds before they fly in, one after another. */
  delay?: number;
  /** Bigger than placed (a phone held upright) – where they sit stays. */
  scale?: number;
  /**
   * The stage's shape: each sticker lies where it was arranged for it (an
   * upright one, without its own place, where it lies across).
   */
  shape?: Shape;
  onArrange?: (id: string, placement: Placement | null, shape: Shape) => void;
};

/**
 * A slide's or card's stickers, over its words – the layer is the stage
 * their places are measured on.
 */
export const StickerLayer = ({
  stickers,
  arrangement,
  size = 0.15,
  spots = "slide",
  arranging = false,
  hidden = false,
  delay = 0.4,
  scale = 1,
  shape = "wide",
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
          onArrange={
            onArrange && ((id, placement) => onArrange(id, placement, shape))
          }
          scale={scale}
          size={size}
          spots={spots}
          sticker={sticker}
          stored={placementFor(arrangement[sticker.id], shape)}
        />
      ))}
    </div>
  );
};
