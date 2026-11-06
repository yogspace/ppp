"use client";

import {
  animate,
  m,
  useIsPresent,
  useMotionValue,
  usePresenceData,
  useTransform,
} from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SlideBackground } from "@/features/backdrop/slide-background";
import { CardSlide } from "@/features/cards/card-slide";
import { ScratchHint, ScratchScope } from "@/features/scratch/scratch";
import type {
  Arrangement,
  Placement,
  Shape,
} from "@/features/stickers/arrangement";
import { StickerLayer } from "@/features/stickers/sticker-layer";
import { lookVars } from "@/features/themes/theme";
import {
  frameVariants,
  type Move,
  specOf,
} from "@/features/transitions/frames";
import { SlideMoving } from "@/features/transitions/moving";
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
  onArrange?: (id: string, placement: Placement | null, shape: Shape) => void;
  /** A tap that is the slide's next step (a point shown, a picture thrown). */
  onStep: () => void;
  /** It has arrived: its transition done, nothing over it. */
  onSettled?: () => void;
  /**
   * A still (the admin's preview strip): as if forever on its way – no 3D
   * floaties, the stickers flat – light enough for many at once.
   */
  frozen?: boolean;
};

/** On a tall screen (a phone held upright) stickers are this much bigger. */
const TALL_STICKERS = 1.7;

/**
 * One slide on the stage: in its theme, over its background, its things
 * flying in once the transition brought it, its stickers on top (its
 * buttons stay on the stage, slide-nav.tsx). It comes and goes by its move
 * (transitions/frames.ts); a wipe shows it through a growing shape.
 */
export const SlideFrame = ({
  slide,
  move,
  step,
  arrangement,
  arranging,
  onArrange,
  onStep,
  onSettled,
  frozen = false,
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

  // The turn over (flip), by the browser itself on the slide's inside – on
  // the compositor, smooth while the page builds the new slide. Out: to the
  // edge, speeding up; in: from the other edge, slowing down – mirrored, so
  // the turn runs through the middle without a jolt.
  const present = useIsPresent();
  const leaving = usePresenceData() as Move | undefined;
  const inside = useRef<HTMLDivElement>(null);
  const turn = (dir: number) => `perspective(1800px) rotateY(${dir * 90}deg)`;
  // biome-ignore lint/correctness/useExhaustiveDependencies: once, coming in
  useLayoutEffect(() => {
    const half = spec.turn?.half;
    if (!(half && inside.current)) return;
    const run = inside.current.animate(
      [{ transform: turn(-own.dir) }, { transform: turn(0) }],
      {
        duration: half * 1000,
        delay: half * 1000,
        easing: "cubic-bezier(0.61, 1, 0.88, 1)",
        fill: "backwards",
      }
    );
    return () => run.cancel();
  }, []);
  // biome-ignore lint/correctness/useExhaustiveDependencies: once, going
  useLayoutEffect(() => {
    const half = leaving && specOf(leaving.kind).turn?.half;
    if (present || !(half && leaving && inside.current)) return;
    inside.current.animate(
      [{ transform: turn(0) }, { transform: turn(leaving.dir) }],
      {
        duration: half * 1000,
        easing: "cubic-bezier(0.12, 0, 0.39, 0)",
        fill: "forwards",
      }
    );
  }, [present]);

  // Still in place: its own move done, its wipe or cover gone, not leaving.
  const [landed, setLanded] = useState(false);
  const [uncovered, setUncovered] = useState(false);
  useEffect(() => {
    const wait = Math.max(
      spec.reveal?.duration ?? 0,
      spec.cover?.duration ?? 0,
      (spec.turn?.half ?? 0) * 2
    );
    const timer = window.setTimeout(() => setUncovered(true), wait * 1000);
    return () => window.clearTimeout(timer);
  }, [spec.reveal, spec.cover, spec.turn]);
  const still = present && landed && uncovered && !frozen;
  // biome-ignore lint/correctness/useExhaustiveDependencies: once, when still
  useEffect(() => {
    if (still) onSettled?.();
  }, [still]);

  return (
    <m.section
      animate="center"
      aria-roledescription="slide"
      className="slide absolute inset-0"
      custom={own}
      data-font={slide.look.font}
      exit="exit"
      initial="enter"
      onAnimationComplete={(name) => name === "center" && setLanded(true)}
      style={{ ...lookVars(slide.look), clipPath }}
      variants={frameVariants}
    >
      <SlideMoving.Provider value={!still}>
        {/* The slide's inside: cut to its edges; what turns in a flip. */}
        <div className="absolute inset-0 overflow-hidden" ref={inside}>
          <ScratchScope>
            <SlideBackground look={slide.look} />
            <EnterDelay.Provider value={spec.settle}>
              {slide.design === "card" ? (
                <CardSlide
                  arrangement={arrangement}
                  arranging={arranging}
                  onArrange={onArrange}
                  onStep={onStep}
                  slide={slide}
                  step={step}
                />
              ) : (
                <>
                  <SlideView onForward={onStep} slide={slide} step={step} />
                  <StickerLayer
                    arrangement={arrangement}
                    arranging={arranging}
                    delay={spec.settle + 0.45}
                    onArrange={onArrange}
                    scale={height > width ? TALL_STICKERS : 1}
                    shape={height > width ? "tall" : "wide"}
                    stickers={slide.stickers}
                  />
                </>
              )}
            </EnterDelay.Provider>
            {/* Foil still on somewhere: “rub to reveal” (the card has its own). */}
            {slide.design !== "card" && (
              <ScratchHint delay={spec.settle + 1.4} />
            )}
          </ScratchScope>
        </div>
      </SlideMoving.Provider>
    </m.section>
  );
};
