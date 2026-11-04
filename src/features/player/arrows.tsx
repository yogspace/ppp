"use client";

import { AnimatePresence, m } from "motion/react";
import type { ThemeLook } from "@/features/themes/theme";

const SPRING = { type: "spring", stiffness: 520, damping: 22 } as const;

const Arrow = ({
  label,
  side,
  look,
  onClick,
}: {
  label: string;
  side: "left" | "right";
  look: ThemeLook;
  onClick: () => void;
}) => (
  <m.button
    animate={{ scale: 1, opacity: 1, rotate: 0 }}
    aria-label={label}
    className="pointer-events-auto grid size-14 place-items-center rounded-full shadow-[0_0.5rem_1.2rem_-0.4rem_rgb(0_0_0/0.45)] transition-[background-color,color] duration-500"
    exit={{ scale: 0, opacity: 0, rotate: side === "right" ? 30 : -30 }}
    initial={{ scale: 0, opacity: 0, rotate: side === "right" ? -30 : 30 }}
    onClick={onClick}
    style={{ background: look.text, color: look.bg }}
    transition={SPRING}
    type="button"
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.85 }}
  >
    <svg
      aria-hidden
      className={
        side === "right"
          ? "size-6 animate-[nudge-right_3.4s_ease-in-out_2.5s_infinite]"
          : "size-6"
      }
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.6"
      viewBox="0 0 24 24"
    >
      <path
        d={
          side === "right" ? "M5 12h13M13 6l6 6-6 6" : "M19 12H6M11 6l-6 6 6 6"
        }
      />
    </svg>
  </m.button>
);

/**
 * The way on and back, always there: a round arrow in each bottom corner,
 * in the slide's colors – the right one nudging now and then. No arrow back
 * on the first slide, none on at the end. A deck never moves on by itself.
 */
export const Arrows = ({
  canBack,
  canOn,
  look,
  onBack,
  onOn,
}: {
  canBack: boolean;
  canOn: boolean;
  look: ThemeLook;
  onBack: () => void;
  onOn: () => void;
}) => (
  <div
    className="pointer-events-none fixed inset-x-[max(1rem,env(safe-area-inset-left))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex justify-between"
    data-controls
  >
    <span className="size-14">
      <AnimatePresence>
        {canBack && (
          <Arrow label="Back" look={look} onClick={onBack} side="left" />
        )}
      </AnimatePresence>
    </span>
    <span className="size-14">
      <AnimatePresence>
        {canOn && (
          <Arrow label="Next" look={look} onClick={onOn} side="right" />
        )}
      </AnimatePresence>
    </span>
  </div>
);
