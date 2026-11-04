import type { TargetAndTransition, Transition, Variants } from "motion/react";
import type { TransitionKind } from "./kinds";
import type { RevealKind } from "./reveal";

/**
 * A move from one slide to the next: how (the new slide's transition),
 * which way (1 on, -1 back) and a count, so every move is a new one.
 */
export type Move = { kind: TransitionKind; dir: 1 | -1; n: number };

type Spec = {
  /** Where the new slide starts. */
  from?: (dir: number) => TargetAndTransition;
  /** How it gets to its place. */
  in?: Transition;
  /** Its own way to its place (keyframes) instead of straight there. */
  land?: TargetAndTransition;
  /** Where the old slide goes, and how – it stays until it is there. */
  out: (dir: number) => TargetAndTransition;
  /** The old slide stays on top (it leaves, revealing the new). */
  oldOnTop?: boolean;
  /** A wipe: the new slide shows through a growing shape, this long (s). */
  reveal?: { kind: RevealKind; duration: number };
  /** Something covers the change (overlay.tsx); slides swap at `mid` (s). */
  cover?: { duration: number; mid: number };
  /** When the new slide's own things start flying in (s). */
  settle: number;
};

const spring = (stiffness: number, damping: number, extra?: object) =>
  ({ type: "spring", stiffness, damping, ...extra }) as const;

/** Stays as it is for `duration`, then goes – under a wipe or a cover. */
const hold = (duration: number, at = 0.98): TargetAndTransition => ({
  opacity: [1, 1, 0],
  transition: { duration, times: [0, at, 1] },
});

const SPECS: Record<TransitionKind, Spec> = {
  swipe: {
    from: (dir) => ({ x: `${dir * 100}%`, rotate: dir * 3 }),
    in: spring(210, 27),
    out: (dir) => ({
      x: `${-dir * 100}%`,
      rotate: -dir * 3,
      transition: spring(210, 27),
    }),
    settle: 0.25,
  },
  boing: {
    from: () => ({ y: "-110%", scaleY: 1.12, scaleX: 0.92 }),
    in: spring(240, 10, { mass: 1.1 }),
    out: () => ({
      y: "18%",
      scaleY: 0.55,
      scaleX: 1.12,
      opacity: 0,
      originY: 1,
      transition: { duration: 0.42, ease: [0.55, 0, 0.8, 0.4] },
    }),
    settle: 0.4,
  },
  pop: {
    from: (dir) => ({ scale: 0, rotate: -dir * 14 }),
    in: spring(380, 15, { delay: 0.2 }),
    out: (dir) => ({
      scale: 0,
      rotate: dir * 14,
      transition: { duration: 0.24, ease: "backIn" },
    }),
    settle: 0.4,
  },
  toss: {
    from: () => ({ scale: 0.92 }),
    in: spring(200, 20, { delay: 0.15 }),
    out: (dir) => ({
      x: `${dir * 75}%`,
      y: "-55%",
      rotate: dir * 55,
      scale: 0.3,
      opacity: [1, 1, 0],
      transition: {
        duration: 0.6,
        ease: [0.5, 0, 0.75, 0],
        times: [0, 0.75, 1],
      },
    }),
    oldOnTop: true,
    settle: 0.3,
  },
  flip: {
    from: (dir) => ({ rotateY: -dir * 90, transformPerspective: 1800 }),
    // Turns on where the old one stopped, and lands – no wobble.
    in: { duration: 0.36, ease: [0.15, 0.75, 0.3, 1], delay: 0.29 },
    out: (dir) => ({
      rotateY: dir * 90,
      transformPerspective: 1800,
      opacity: [1, 1, 0],
      transition: { duration: 0.3, ease: "easeIn", times: [0, 0.97, 1] },
    }),
    settle: 0.45,
  },
  hinge: {
    from: () => ({ scale: 0.95 }),
    in: spring(200, 20, { delay: 0.75 }),
    out: () => ({
      originX: 0,
      originY: 0,
      rotate: [0, 80, 64, 76, 70, 72],
      y: ["0%", "0%", "0%", "0%", "0%", "160%"],
      transition: {
        duration: 1.25,
        times: [0, 0.28, 0.42, 0.54, 0.64, 1],
        ease: "easeInOut",
      },
    }),
    oldOnTop: true,
    settle: 0.8,
  },
  jelly: {
    from: () => ({ scaleX: 0.2, scaleY: 1.6, opacity: 0 }),
    land: {
      scaleX: [0.2, 1.25, 0.86, 1.07, 0.97, 1],
      scaleY: [1.6, 0.76, 1.14, 0.95, 1.02, 1],
      opacity: 1,
      transition: { duration: 0.95, opacity: { duration: 0.15 } },
    },
    out: () => ({
      opacity: 0,
      scale: 0.92,
      transition: { duration: 0.22 },
    }),
    settle: 0.35,
  },
  zoom: {
    from: () => ({ scale: 0.25, opacity: 0 }),
    in: { ...spring(200, 22), opacity: { duration: 0.3 } },
    out: () => ({
      scale: 3.4,
      opacity: 0,
      transition: { duration: 0.45, ease: "easeIn" },
    }),
    oldOnTop: true,
    settle: 0.3,
  },
  blob: {
    from: () => ({ opacity: 0 }),
    in: { opacity: { duration: 0, delay: 0.46 } },
    out: () => hold(0.47),
    cover: { duration: 1.05, mid: 0.46 },
    settle: 0.6,
  },
  confetti: {
    from: () => ({ opacity: 0, scale: 0.96 }),
    in: { opacity: { duration: 0.35, delay: 0.12 }, scale: spring(200, 18) },
    out: () => ({ opacity: 0, transition: { duration: 0.35, delay: 0.12 } }),
    cover: { duration: 1.9, mid: 0.3 },
    settle: 0.35,
  },
  curtain: {
    from: () => ({ opacity: 0 }),
    in: { opacity: { duration: 0, delay: 0.62 } },
    out: () => hold(0.63),
    cover: { duration: 1.5, mid: 0.62 },
    settle: 0.85,
  },
  fade: {
    from: () => ({ opacity: 0 }),
    in: { duration: 0.5 },
    out: () => ({ opacity: 0, transition: { duration: 0.5 } }),
    settle: 0.2,
  },
  cut: {
    in: { duration: 0 },
    out: () => ({ opacity: 0, transition: { duration: 0 } }),
    settle: 0,
  },
  spinner: {
    from: () => ({ rotate: -720, scale: 0 }),
    in: { duration: 1.1, ease: [0.2, 0.7, 0.3, 1] },
    out: () => hold(1.1),
    settle: 0.95,
  },
  checkerboard: {
    out: () => hold(1.2),
    reveal: { kind: "checkerboard", duration: 1.2 },
    settle: 0.8,
  },
  blinds: {
    out: () => hold(0.9),
    reveal: { kind: "blinds", duration: 0.9 },
    settle: 0.6,
  },
  dissolve: {
    out: () => hold(1.1),
    reveal: { kind: "dissolve", duration: 1.1 },
    settle: 0.7,
  },
  star: {
    out: () => hold(1),
    reveal: { kind: "star", duration: 1 },
    settle: 0.6,
  },
  heart: {
    out: () => hold(1),
    reveal: { kind: "heart", duration: 1 },
    settle: 0.6,
  },
  clock: {
    out: () => hold(1),
    reveal: { kind: "clock", duration: 1 },
    settle: 0.6,
  },
};

export const specOf = (kind: TransitionKind) => SPECS[kind];

/** At rest: whatever a transition changed, back. */
const REST = {
  x: "0%",
  y: "0%",
  scale: 1,
  scaleX: 1,
  scaleY: 1,
  rotate: 0,
  rotateY: 0,
  opacity: 1,
};

/**
 * A slide's frame: `enter` where it starts, `center` at rest, `exit` where
 * it goes – each by the move it is given (AnimatePresence hands a leaving
 * slide the move that sends it away).
 */
export const frameVariants: Variants = {
  enter: (move: Move) => ({
    ...specOf(move.kind).from?.(move.dir),
    zIndex: 1,
  }),
  center: (move: Move) => {
    const spec = specOf(move.kind);
    return {
      ...REST,
      zIndex: 1,
      transition: spec.in ?? { duration: 0 },
      ...spec.land,
    };
  },
  exit: (move: Move) => {
    const spec = specOf(move.kind);
    const out = spec.out(move.dir);
    return {
      ...out,
      zIndex: spec.oldOnTop ? 2 : 0,
      transition: {
        ...(out.transition as object),
        zIndex: { duration: 0 },
        originX: { duration: 0 },
        originY: { duration: 0 },
      },
    };
  },
};
