"use client";

import { m } from "motion/react";
import { useContext } from "react";
import { EnterDelay, useFit, Words } from "@/features/player/enter";
import type { SlideData } from "@/features/player/types";
import { Confetti } from "@/features/transitions/overlay";
import { Scratch } from "./scratch";

type Of = Extract<SlideData, { design: "scratch" }>;

/** The ticket's edges: bitten out in little half circles, like a real one. */
const BITES =
  "radial-gradient(circle at 0 50%, transparent 1.3cqmin, #000 1.35cqmin) left / 51% 3.6cqmin repeat-y, radial-gradient(circle at 100% 50%, transparent 1.3cqmin, #000 1.35cqmin) right / 51% 3.6cqmin repeat-y";

/**
 * A scratch-off ticket. It flies in, a little turned; a silver window hides
 * the prize. Rubbed (or the next button: it rubs itself free), the foil
 * falls away, the ticket jumps, confetti – and the prize. One step: back
 * puts the foil on again.
 */
export const ScratchSlide = ({
  slide,
  step,
  onForward,
}: {
  slide: Of;
  step: number;
  onForward: () => void;
}) => {
  const base = useContext(EnterDelay);
  const won = step >= 1;
  const prize = useFit(slide.prize, { max: 9, wrap: true });
  return (
    <div className="absolute inset-x-[8cqmin] inset-y-[8cqmin] flex flex-col items-center justify-center gap-[3.5cqmin] tall:inset-x-[6cqmin]">
      {slide.heading && (
        <h2 className="headline text-center text-[8cqmin] tall:text-[9cqmin]">
          <Words gap={0.05} text={slide.heading} />
        </h2>
      )}
      <div className="relative w-[min(62cqw,100cqmin)] tall:w-full">
        <m.div
          animate={
            won
              ? {
                  y: [0, -18, 0, -6, 0],
                  rotate: [-2, 3, -1.5, 1, -1],
                  scale: [1, 1.06, 0.99, 1.02, 1],
                  opacity: 1,
                }
              : { y: 0, rotate: -2, scale: 1, opacity: 1 }
          }
          className="relative flex flex-col gap-[2.2cqmin] rounded-[2cqmin] bg-(--paper) px-[5cqmin] py-[3.6cqmin] text-(--paper-ink) shadow-[0_2cqmin_5cqmin_-2cqmin_rgb(0_0_0/0.45)]"
          initial={{ y: "70%", rotate: -14, scale: 0.8, opacity: 0 }}
          style={{ mask: BITES, WebkitMask: BITES }}
          transition={
            won
              ? { duration: 0.9, ease: "easeOut", delay: 0.15 }
              : {
                  type: "spring",
                  stiffness: 170,
                  damping: 16,
                  delay: base + 0.2,
                }
          }
        >
          {/* The ticket's head: what it is, and its stars. */}
          <div className="flex items-center justify-between gap-[2cqmin] font-sans text-[2.4cqmin] font-bold tracking-[0.12em] uppercase">
            <span className="rounded-full bg-(--accent) px-[1.4cqmin] py-[0.5cqmin] text-(--paper)">
              {slide.kicker || "Lucky ticket"}
            </span>
            <span aria-hidden className="text-(--accent)">
              ★ ★ ★
            </span>
          </div>
          <div
            aria-hidden
            className="border-t-[0.4cqmin] border-dashed border-current opacity-25"
          />
          {/* The window: the prize under the foil. */}
          <Scratch block onOpen={() => !won && onForward()} open={won}>
            <span
              className="flex h-[min(30cqmin,46cqh)] items-center gap-[3cqmin] rounded-[1.4cqmin] p-[2.6cqmin] tall:h-[26cqh]"
              style={{
                background:
                  "color-mix(in oklab, var(--accent) 14%, var(--paper))",
              }}
            >
              {slide.image && (
                <img
                  alt={slide.image.alt}
                  className="h-full w-auto max-w-[45%] flex-none rounded-[1cqmin] object-cover"
                  draggable={false}
                  src={slide.image.src}
                />
              )}
              <span className="relative h-full min-w-0 flex-1">
                <span className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="headline block w-full text-center whitespace-pre-line normal-case"
                    ref={prize.ref}
                    style={{ fontSize: prize.fontSize }}
                  >
                    {slide.prize}
                  </span>
                </span>
              </span>
            </span>
          </Scratch>
        </m.div>
        {/* Won: a burst over the ticket. */}
        {won && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20 [container-type:inline-size]"
          >
            <Confetti />
          </span>
        )}
      </div>
      {slide.footnote && (
        <m.p
          animate={won ? { y: 0, opacity: 1 } : { y: 12, opacity: 0 }}
          className="copy text-center text-[3.4cqmin] text-balance tall:text-[4.2cqmin]"
          initial={false}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 22,
            delay: won ? 0.6 : 0,
          }}
        >
          {slide.footnote}
        </m.p>
      )}
    </div>
  );
};
