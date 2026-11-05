"use client";

import { createContext, useContext } from "react";
import { proxy, useSnapshot } from "valtio";
import { subscribeKey } from "valtio/utils";
import type { Move } from "@/features/transitions/frames";
import { resolveTransition } from "@/features/transitions/kinds";
import type { Onward } from "./slide-nav";
import { backward, forward, jump, type Pos, slideHref, stepsOf } from "./steps";
import type { DeckData } from "./types";

/**
 * A played deck's state (valtio): where it is, how it got there, whether the
 * slide has arrived, the controls and arranging – and what moves it. One
 * store per player (DeckPlayer makes it); its buttons, the dock and the keys
 * read and move it here, not through props.
 */
export type PlayerState = {
  pos: Pos;
  /** The move that brought the slide – its transition, its way. */
  move: Move;
  /** The slide has arrived (its transition done): on to another may go. */
  settled: boolean;
  /** Arranging the stickers (logged in, E). */
  arranging: boolean;
  /** The controls pinned up (H, a long press) – remembered on this device. */
  controls: boolean;
};

/** Longest a slide may take to arrive before the next move goes anyway (ms). */
const SETTLE_AT_MOST = 1600;
const CONTROLS_KEY = "ppp:controls";

export const createPlayer = (initial: DeckData, start: number) => {
  let deck = initial;
  let steps = deck.slides.map(stepsOf);
  const state = proxy<PlayerState>({
    pos: { slide: start, step: 0 },
    move: { kind: "fade", dir: 1, n: 0 },
    settled: true,
    arranging: false,
    controls: false,
  });
  // A move to another slide asked for mid-transition: the last one waits.
  let pending: (() => Pos) | null = null;
  let timer = 0;

  /** Straight there – `history: "none"` when the browser went there itself. */
  const goTo = (
    next: Pos,
    { history = "push" }: { history?: "push" | "none" } = {}
  ) => {
    const current = state.pos;
    if (next.slide === current.slide && next.step === current.step) return;
    if (next.slide !== current.slide) {
      state.settled = false;
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, SETTLE_AT_MOST);
      state.move = {
        kind: resolveTransition(
          deck.slides[next.slide]?.transition,
          deck.transition,
          Math.random()
        ),
        dir: next.slide > current.slide ? 1 : -1,
        n: state.move.n + 1,
      };
      if (history === "push") {
        window.history.pushState(null, "", slideHref(deck.slug, next.slide));
      }
    }
    state.pos = next;
  };

  /** The slide has arrived: a move that waited goes now. */
  const settle = () => {
    window.clearTimeout(timer);
    if (state.settled) return;
    state.settled = true;
    const waiting = pending;
    pending = null;
    if (waiting) goTo(waiting());
  };

  /** Now – or, to another slide while one is still arriving, once it has. */
  const ask = (target: () => Pos) => {
    if (target().slide !== state.pos.slide && !state.settled) {
      pending = target;
      return;
    }
    goTo(target());
  };

  const player = {
    state,
    goTo,
    settle,
    next: () => ask(() => forward(steps, state.pos)),
    prev: () => ask(() => backward(steps, state.pos)),
    to: (slide: number) => ask(() => jump(steps, slide)),
    /** Where the browser's address went (its back and forward). */
    jumpTo: (slide: number) => goTo(jump(steps, slide), { history: "none" }),
    toggleArranging: () => {
      state.arranging = !state.arranging;
    },
    stopArranging: () => {
      state.arranging = false;
    },
    toggleControls: () => {
      state.controls = !state.controls;
    },
    /** The deck saved anew in the admin: its slides, kept where it is. */
    update: (next: DeckData) => {
      deck = next;
      steps = deck.slides.map(stepsOf);
    },
    get deck() {
      return deck;
    },
    get steps() {
      return steps;
    },
    /**
     * The controls as this device last had them, and remembered from now
     * on (a convenience: without storage they are just off). Undone by the
     * function it returns.
     */
    remember: () => {
      try {
        state.controls = window.localStorage.getItem(CONTROLS_KEY) === "1";
      } catch {
        // No storage – off.
      }
      const stop = subscribeKey(state, "controls", (shown) => {
        try {
          window.localStorage.setItem(CONTROLS_KEY, shown ? "1" : "0");
        } catch {
          // No storage – it just isn't remembered.
        }
      });
      return () => {
        stop();
        window.clearTimeout(timer);
      };
    },
  };
  return player;
};

export type Player = ReturnType<typeof createPlayer>;

export const PlayerContext = createContext<Player | null>(null);

/** The player this is in – its state and what moves it. */
export const usePlayer = () => {
  const player = useContext(PlayerContext);
  if (!player) throw new Error("usePlayer: outside a DeckPlayer");
  return player;
};

/** The player's state, as of this render – re-rendered when it changes. */
export const usePlayerState = () => useSnapshot(usePlayer().state);

/**
 * Where the slide's own button leads, and how far through its steps it is:
 * a step (points, pictures, the card), on, again from the start – or nowhere.
 */
export const useOnward = () => {
  const player = usePlayer();
  const { pos } = useSnapshot(player.state);
  const count = player.deck.slides.length;
  const total = player.steps[pos.slide] ?? 0;
  const onward: Onward =
    pos.step < total
      ? "point"
      : pos.slide < count - 1
        ? "next"
        : count > 1
          ? "again"
          : null;
  return { onward, total, progress: total ? pos.step / total : 1 };
};
