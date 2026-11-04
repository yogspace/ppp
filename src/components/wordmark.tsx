"use client";

import { m } from "motion/react";
import { MotionProvider } from "./motion";

/** “ppp” – its letters drop in, bounce, and hop when touched. */
export const Wordmark = ({ className }: { className?: string }) => (
  <MotionProvider>
    <span aria-label="ppp" className={className} role="img">
      {["p", "p", "p"].map((letter, i) => (
        <m.span
          animate={{ y: "0em", rotate: [-8, 6, -4][i], opacity: 1 }}
          aria-hidden
          className="inline-block cursor-default"
          initial={{ y: "-0.8em", rotate: 30, opacity: 0 }}
          key={i}
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 12,
            delay: 0.15 + i * 0.12,
          }}
          whileHover={{ y: "-0.12em", rotate: 0, scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
        >
          {letter}
        </m.span>
      ))}
    </span>
  </MotionProvider>
);
