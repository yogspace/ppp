"use client";

import { AnimatePresence, m, useIsPresent } from "motion/react";
import type { ThemeLook } from "@/features/themes/theme";
import { isDark } from "@/features/themes/theme";
import { cn } from "@/lib/cn";

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

type Props = {
  look: ThemeLook;
  onward: Onward;
  /**
   * Words on the button on to the next slide (the deck's, or the slide's
   * own) – empty: just an arrow. Steps and the way back to the start are
   * arrows always.
   */
  label: string;
  back: boolean;
  /**
   * The slide was played through – its points shown, its stack thrown, its
   * Card opened: the way on may come (and stays). The way back is always
   * there, past the first slide.
   */
  ready: boolean;
  /** Seconds after the slide arrived. */
  delay: number;
  onOn: () => void;
  onBack: () => void;
};

/**
 * A slide's own way on and back – part of the slide, in its theme, flying in
 * and out with it: a sticker-like button in the accent, bobbing a little –
 * an arrow (with the deck's or slide's words, if it has some), ↺ at the
 * end – and a small round ←. A deck never moves on by itself; this or the
 * keys do.
 */
export const SlideNav = ({
  look,
  onward,
  label,
  back,
  ready,
  delay,
  onOn,
  onBack,
}: Props) => {
  // A leaving slide's buttons go along, but no longer work.
  const present = useIsPresent();
  const ink = isDark(look.accent) ? "#ffffff" : "#111111";
  const words = onward === "next" ? label : "";
  return (
    <div
      className="pointer-events-none absolute inset-x-[3cqmin] bottom-[3cqmin] z-30 flex items-end justify-between"
      data-controls
    >
      <span>
        <AnimatePresence>
          {back && (
            <m.button
              animate={{ scale: 1, opacity: 1 }}
              aria-label="Back"
              className="pointer-events-auto grid size-[max(44px,6cqmin)] place-items-center rounded-full backdrop-blur-sm"
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
              whileTap={{ scale: 0.85 }}
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
      <span className="animate-[bob_2.6s_ease-in-out_infinite]">
        <AnimatePresence mode="popLayout">
          {onward && ready && (
            <m.button
              animate={{ scale: 1, rotate: -3, opacity: 1 }}
              aria-label={words ? undefined : NAMES[onward]}
              className={cn(
                "copy pointer-events-auto inline-flex items-center justify-center gap-[0.45em] rounded-full border-[max(3px,0.45cqmin)] border-white text-[max(16px,2.4cqmin)] leading-none font-semibold shadow-[0_0.8cqmin_1.6cqmin_-0.4cqmin_rgb(0_0_0/0.35)]",
                words
                  ? "px-[max(18px,2.6cqmin)] py-[max(9px,1.3cqmin)]"
                  : "size-[max(48px,6.6cqmin)]"
              )}
              disabled={!present}
              exit={{ scale: 0, rotate: 12, opacity: 0 }}
              initial={{ scale: 0, rotate: -20, opacity: 0 }}
              key={onward === "again" ? "again" : "on"}
              onClick={onOn}
              style={{ background: look.accent, color: ink }}
              transition={{ ...SPRING, delay: delay + 0.8 }}
              type="button"
              whileHover={{ scale: 1.07, rotate: 0 }}
              whileTap={{ scale: 0.9 }}
            >
              {words}
              <svg
                aria-hidden
                className={
                  onward === "again"
                    ? "size-[1.1em]"
                    : "size-[1.1em] animate-[nudge-right_3.4s_ease-in-out_2.5s_infinite]"
                }
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
                      : "M5 12h13M13 6l6 6-6 6"
                  }
                />
              </svg>
            </m.button>
          )}
        </AnimatePresence>
      </span>
    </div>
  );
};
