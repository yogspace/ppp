"use client";

import { domMax, LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Motion (motion.dev) for everything that flies – slides, words, stickers.
 *
 * Only `m.*` components, never `motion.*`: `LazyMotion` brings the features
 * once, and `strict` makes a stray `motion.*` throw. Whoever asked for less
 * motion gets none of the transforms – opacity still fades.
 */
export const MotionProvider = ({ children }: { children: ReactNode }) => (
  <LazyMotion features={domMax} strict>
    <MotionConfig reducedMotion="user">{children}</MotionConfig>
  </LazyMotion>
);
