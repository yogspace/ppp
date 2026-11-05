"use client";

import { AnimatePresence, m, useIsPresent } from "motion/react";
import type { ThemeLook } from "@/features/themes/theme";
import { isDark } from "@/features/themes/theme";
import { cn } from "@/lib/cn";
import { useOnward, usePlayer, usePlayerState } from "./store";

/**
 * Where the slide's button leads: on to the next slide, to the next point
 * of a List, back to the start at the end – or nowhere (a deck of one).
 */
export type Onward = "next" | "point" | "again" | null;

/** What the button is called for screen readers. */
const NAMES: Record<Exclude<Onward, null>, string> = {
  next: "Next",
  point: "Next step",
  again: "Again from the start",
};

const SPRING = { type: "spring", stiffness: 420, damping: 15 } as const;

/** A way that waits (the slide still on its way): dimmed, pressed in. */
const waitStyle = (waiting: boolean) =>
  ({
    display: "inline-block",
    opacity: waiting ? 0.5 : 1,
    scale: waiting ? 0.88 : 1,
    transition: waiting
      ? "opacity 0.15s ease, scale 0.15s ease"
      : "opacity 0.25s ease, scale 0.35s cubic-bezier(0.3, 1.6, 0.5, 1)",
  }) as const;
const ICON_SPRING = { type: "spring", stiffness: 500, damping: 18 } as const;

/** › a step, → on to the next slide, ↺ again from the start. */
const Icon = ({ onward }: { onward: Exclude<Onward, null> }) => (
  <svg
    aria-hidden
    className={cn("size-[1.1em]", {
      "animate-[nudge-right_3.4s_ease-in-out_2.5s_infinite]": onward === "next",
    })}
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2.8"
    viewBox="0 0 24 24"
  >
    <path
      d={
        onward === "again"
          ? "M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5"
          : onward === "point"
            ? "M10 6.5l5.5 5.5-5.5 5.5"
            : "M5 12h13M13 6l6 6-6 6"
      }
    />
  </svg>
);

type Props = {
  look: ThemeLook;
  /**
   * Words on the button on to the next slide (the deck's, or the slide's
   * own) – empty: just an arrow. Steps and the way back to the start are
   * arrows always.
   */
  label: string;
};

/**
 * A slide's own way on and back, in its theme – a sticker-like button in
 * the accent, bobbing a little: › a step (a ring filling up), → on (with the
 * deck's or slide's words, if it has some), ↺ at the end – and a small
 * round ←. Bigger on the first slide. A deck never moves on by itself; this
 * or the keys do. Where it is and what it does: the player (store.ts).
 */
export const SlideNav = ({ look, label }: Props) => {
  const player = usePlayer();
  const { pos, move, settled } = usePlayerState();
  const { onward, progress } = useOnward();
  const back = pos.slide > 0 || pos.step > 0;
  const first = pos.slide === 0;
  // Mid-transition the ways to another slide wait (a click is kept):
  // pressed in a little until the slide has arrived.
  const waitBack = !settled && pos.step === 0;
  const waitOn = !settled && onward !== "point";
  // Seconds after the slide arrived: the very first one takes its time.
  const delay = move.n === 0 ? 1.2 : 0.3;
  const onBack = player.prev;
  const onOn = onward === "again" ? () => player.to(0) : player.next;
  // A leaving slide's buttons go along, but no longer work.
  const present = useIsPresent();
  const ink = isDark(look.accent) ? "#ffffff" : "#111111";
  const words = onward === "next" ? label : "";
  return (
    <div
      className="pointer-events-none absolute inset-x-[3cqmin] bottom-[3cqmin] z-30 flex items-end justify-between"
      data-controls
    >
      {/* Waiting for the slide to arrive: pressed in a little, then back. */}
      <span style={waitStyle(waitBack)}>
        <AnimatePresence>
          {back && (
            <m.button
              animate={{ scale: 1, opacity: 1 }}
              aria-label="Back"
              className="pointer-events-auto grid size-[max(44px,6cqmin)] cursor-pointer place-items-center rounded-full backdrop-blur-sm"
              disabled={!present}
              exit={{ scale: 0, opacity: 0 }}
              initial={{ scale: 0, opacity: 0 }}
              onClick={onBack}
              style={{
                background: `color-mix(in oklab, ${look.text} 10%, transparent)`,
                color: look.text,
              }}
              transition={{ ...SPRING, delay: delay + 0.4 }}
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg
                aria-hidden
                className="size-[45%]"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.6"
                viewBox="0 0 24 24"
              >
                <path d="M19 12H6M11 6l-6 6 6 6" />
              </svg>
            </m.button>
          )}
        </AnimatePresence>
      </span>
      <span
        className="animate-[bob_2.6s_ease-in-out_infinite]"
        style={waitStyle(waitOn)}
      >
        <AnimatePresence mode="popLayout">
          {onward && (
            <m.button
              animate={{ scale: 1, rotate: -3, opacity: 1 }}
              aria-label={words ? undefined : NAMES[onward]}
              className={cn(
                "copy pointer-events-auto relative inline-flex cursor-pointer items-center justify-center gap-[0.45em] rounded-full border-[max(3px,0.45cqmin)] border-white text-[max(16px,2.4cqmin)] leading-none font-semibold shadow-[0_0.8cqmin_1.6cqmin_-0.4cqmin_rgb(0_0_0/0.35)]",
                {
                  // The first slide: bigger, there's nothing else to do yet.
                  "text-[max(22px,3.6cqmin)]": first,
                  "px-[max(18px,2.6cqmin)] py-[max(9px,1.3cqmin)]": words,
                  "size-[max(48px,6.6cqmin)]": !words && !first,
                  "size-[max(68px,10cqmin)]": !words && first,
                }
              )}
              disabled={!present}
              exit={{ scale: 0, rotate: 12, opacity: 0 }}
              initial={{ scale: 0, rotate: -20, opacity: 0 }}
              key={onward === "again" ? "again" : "on"}
              // Round while it steps, wider when the next slide has words.
              layout
              onClick={onOn}
              style={{ background: look.accent, color: ink }}
              transition={{
                ...SPRING,
                delay: delay + 0.8,
                layout: { type: "spring", stiffness: 420, damping: 32 },
              }}
              type="button"
              whileHover={{ scale: 1.1, rotate: 0 }}
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence initial={false} mode="popLayout">
                {words && (
                  <m.span
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    initial={{ opacity: 0, x: -8 }}
                    key="words"
                    layout="position"
                  >
                    {words}
                  </m.span>
                )}
              </AnimatePresence>
              <AnimatePresence initial={false} mode="popLayout">
                <m.span
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  className="relative grid place-items-center"
                  exit={{ scale: 0.3, rotate: -90, opacity: 0 }}
                  initial={{ scale: 0.3, rotate: 90, opacity: 0 }}
                  key={onward}
                  layout="position"
                  transition={ICON_SPRING}
                >
                  <Icon onward={onward} />
                </m.span>
              </AnimatePresence>
              {/* While it steps: how far, a ring filling up – full, it goes,
                  and the arrow on to the next slide comes. */}
              <AnimatePresence initial={false}>
                {onward === "point" && (
                  <m.svg
                    aria-hidden
                    className="pointer-events-none absolute inset-[11%] -rotate-90"
                    exit={{ opacity: 0, scale: 1.25 }}
                    key="ring"
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      fill="none"
                      r="46"
                      stroke="currentColor"
                      strokeOpacity="0.22"
                      strokeWidth="7"
                    />
                    <m.circle
                      animate={{ pathLength: Math.max(progress, 0.001) }}
                      cx="50"
                      cy="50"
                      fill="none"
                      initial={false}
                      r="46"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="7"
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 24,
                      }}
                    />
                  </m.svg>
                )}
              </AnimatePresence>
            </m.button>
          )}
        </AnimatePresence>
      </span>
    </div>
  );
};
