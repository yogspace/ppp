"use client";

import { animate, m, useMotionValue, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { SlideBackground } from "@/features/backdrop/slide-background";
import { CardSlide } from "@/features/cards/card-slide";
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
import { type Onward, SlideNav } from "./slide-nav";
import { SlideView } from "./slide-view";
import { useStageSize } from "./stage";
import { stepsOf } from "./steps";
import type { SlideData } from "./types";

type Props = {
  slide: SlideData;
  /** The move that brought it – kept; a leaving slide is handed the next. */
  move: Move;
  step: number;
  arrangement: Arrangement;
  arranging: boolean;
  onArrange?: (id: string, placement: Placement | null) => void;
  /** Its button's way on, and whether there is a way back. */
  onward: Onward;
  /** Been here before (the deck went past it): its buttons show at once. */
  seen: boolean;
  back: boolean;
  onOn: () => void;
  onBack: () => void;
};

/** On a tall screen (a phone held upright) stickers are this much bigger. */
const TALL_STICKERS = 1.7;

/**
 * One slide on the stage: in its theme, over its background, its things
 * flying in once the transition brought it, its stickers on top, its own
 * button on (slide-nav.tsx). It comes and goes by its move
 * (transitions/frames.ts); a wipe shows it through a growing shape.
 */
export const SlideFrame = ({
  slide,
  move,
  step,
  arrangement,
  arranging,
  onArrange,
  onward,
  seen,
  back,
  onOn,
  onBack,
}: Props) => {
  const [own] = useState(move);
  // A slide that wants to be played with – a List point by point, a stack
  // thrown away, a Card opened – shows its ways on and back once that is
  // done, and keeps them then.
  const steps = stepsOf(slide);
  const [done, setDone] = useState(
    seen || (slide.design !== "card" && steps === 0)
  );
  useEffect(() => {
    if (steps > 0 && step >= steps) setDone(true);
  }, [step, steps]);
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
        {slide.design === "card" ? (
          <CardSlide
            arrangement={arrangement}
            arranging={arranging}
            onArrange={onArrange}
            onOpened={() => setDone(true)}
            slide={slide}
          />
        ) : (
          <>
            <SlideView onForward={onOn} slide={slide} step={step} />
            <StickerLayer
              arrangement={arrangement}
              arranging={arranging}
              delay={spec.settle + 0.45}
              onArrange={onArrange}
              scale={height > width ? TALL_STICKERS : 1}
              stickers={slide.stickers}
            />
          </>
        )}
        <SlideNav
          back={back}
          delay={seen ? spec.settle - 0.6 : spec.settle}
          look={slide.look}
          onBack={onBack}
          onOn={onOn}
          onward={onward}
          point={slide.design === "gallery" ? "next picture" : "next point"}
          ready={done}
        />
      </EnterDelay.Provider>
    </m.section>
  );
};
