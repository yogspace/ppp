"use client";

import { animate, m, useMotionValue, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { SlideBackground } from "@/features/backdrop/slide-background";
import type { Arrangement, Placement } from "@/features/stickers/arrangement";
import { StickerLayer } from "@/features/stickers/sticker-layer";
import { lookVars } from "@/features/themes/theme";
import {
  frameVariants,
  type Move,
  specOf,
} from "@/features/transitions/frames";
import { revealClip } from "@/features/transitions/reveal";
import { EnterDelay } from "./enter";
import { SlideView } from "./slide-view";
import { useStageSize } from "./stage";
import type { SlideData } from "./types";

type Props = {
  slide: SlideData;
  /** The move that brought it – kept; a leaving slide is handed the next. */
  move: Move;
  step: number;
  arrangement: Arrangement;
  arranging: boolean;
  onArrange?: (id: string, placement: Placement | null) => void;
};

/**
 * One slide on the stage: in its theme, over its background, its things
 * flying in once the transition brought it, its stickers on top. It comes
 * and goes by its move (transitions/frames.ts); a wipe shows it through a
 * growing shape.
 */
export const SlideFrame = ({
  slide,
  move,
  step,
  arrangement,
  arranging,
  onArrange,
}: Props) => {
  const [own] = useState(move);
  const spec = specOf(own.kind);
  const { width, height } = useStageSize();
  const progress = useMotionValue(spec.reveal ? 0 : 1);
  const clipPath = useTransform(progress, (p) =>
    spec.reveal ? revealClip(spec.reveal.kind, p, width, height) : "none"
  );
  useEffect(() => {
    if (!spec.reveal) return;
    const controls = animate(progress, 1, {
      duration: spec.reveal.duration,
      ease: spec.reveal.kind === "dissolve" ? "linear" : [0.45, 0, 0.25, 1],
    });
    return () => controls.stop();
  }, [spec.reveal, progress]);

  return (
    <m.section
      animate="center"
      aria-roledescription="slide"
      className="slide absolute inset-0 overflow-hidden"
      custom={own}
      data-font={slide.look.font}
      exit="exit"
      initial="enter"
      style={{ ...lookVars(slide.look), clipPath }}
      variants={frameVariants}
    >
      <SlideBackground look={slide.look} />
      <EnterDelay.Provider value={spec.settle}>
        <SlideView slide={slide} step={step} />
        <StickerLayer
          arrangement={arrangement}
          arranging={arranging}
          delay={spec.settle + 0.45}
          onArrange={onArrange}
          stickers={slide.stickers}
        />
      </EnterDelay.Provider>
    </m.section>
  );
};
