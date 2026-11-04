"use client";

import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MotionProvider } from "@/components/motion";
import { StickerStage } from "@/features/stickers/sticker-stage";
import { useArrange } from "@/features/stickers/use-arrange";
import type { Move } from "@/features/transitions/frames";
import { resolveTransition } from "@/features/transitions/kinds";
import { TransitionCover } from "@/features/transitions/overlay";
import { Controls } from "./controls";
import { SlideFrame } from "./slide-frame";
import { type Onward, SlideNav } from "./slide-nav";
import { Stage } from "./stage";
import {
  backward,
  forward,
  jump,
  type Pos,
  slideFromPath,
  slideHref,
  stepsOf,
} from "./steps";
import type { DeckData } from "./types";

type Props = {
  deck: DeckData;
  /** The slide its address names. */
  start: number;
  /** Logged in: the stickers may be arranged (E). */
  canArrange: boolean;
};

/** How long a press must last to show or hide the controls (ms). */
const LONG_PRESS = 550;

const CONTROLS_KEY = "ppp:controls";

/**
 * The controls shown or not – off at first, then as this device last had
 * them (a convenience: without storage it is just off).
 */
const useControlsShown = () => {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    try {
      setShown(window.localStorage.getItem(CONTROLS_KEY) === "1");
    } catch {
      // No storage – off.
    }
  }, []);
  const set = useCallback((next: boolean | ((shown: boolean) => boolean)) => {
    setShown((current) => {
      const value = typeof next === "function" ? next(current) : next;
      try {
        window.localStorage.setItem(CONTROLS_KEY, value ? "1" : "0");
      } catch {
        // No storage – it just isn't remembered.
      }
      return value;
    });
  }, []);
  return [shown, set] as const;
};

/** Keys that go on, and back. */
const ON = new Set(["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"]);
const BACK = new Set(["ArrowLeft", "ArrowUp", "PageUp", "Backspace"]);

/**
 * A deck, played: one slide at a time on the stage, each coming in with its
 * transition. Never on its own, never by a stray click or swipe: on is the
 * slide's own button (slide-nav.tsx) or → ↓ space Enter; back its ← or
 * ← ↑ – a step back (a point, a picture, a Card's fold), else the slide
 * before. Home and End, F for full screen, H (or a long
 * press, or the mouse at the bottom edge) shows the controls, E arranges the
 * stickers (logged in). Every slide
 * has its address (`/talk`, `/talk/1` …): written as it changes, without
 * loading anew – the browser's back goes a slide back.
 */
export const DeckPlayer = ({ deck, start, canArrange }: Props) => {
  const { slides } = deck;
  const steps = useMemo(() => slides.map(stepsOf), [slides]);
  const [pos, setPos] = useState<Pos>({ slide: start, step: 0 });
  const posRef = useRef(pos);
  // How far the deck got: every slide before it was seen already.
  const [furthest, setFurthest] = useState(start);
  const [move, setMove] = useState<Move>({ kind: "fade", dir: 1, n: 0 });
  const [arranging, setArranging] = useState(false);
  const [controls, setControls] = useControlsShown();
  const { arrangement, arrange, state } = useArrange(
    "decks",
    deck.id,
    deck.arrangement
  );

  const goTo = useCallback(
    (next: Pos, { history = "push" }: { history?: "push" | "none" } = {}) => {
      const current = posRef.current;
      if (next.slide === current.slide && next.step === current.step) return;
      if (next.slide !== current.slide) {
        setMove((m) => ({
          kind: resolveTransition(
            slides[next.slide]?.transition,
            deck.transition,
            Math.random()
          ),
          dir: next.slide > current.slide ? 1 : -1,
          n: m.n + 1,
        }));
        if (history === "push") {
          window.history.pushState(null, "", slideHref(deck.slug, next.slide));
        }
      }
      posRef.current = next;
      setPos(next);
      setFurthest((f) => Math.max(f, next.slide));
    },
    [slides, deck.transition, deck.slug]
  );

  const next = useCallback(
    () => goTo(forward(steps, posRef.current)),
    [goTo, steps]
  );
  const prev = useCallback(
    () => goTo(backward(steps, posRef.current)),
    [goTo, steps]
  );
  const to = useCallback(
    (slide: number) => goTo(jump(steps, slide)),
    [goTo, steps]
  );

  // The browser's back and forward: to the slide its address names.
  useEffect(() => {
    const pop = () => {
      const slide = slideFromPath(
        window.location.pathname,
        deck.slug,
        slides.length
      );
      if (slide !== null) goTo(jump(steps, slide), { history: "none" });
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, [deck.slug, slides.length, goTo, steps]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      // A focused button takes its own Enter and space.
      if (
        target?.closest("button") &&
        (event.key === "Enter" || event.key === " ")
      ) {
        return;
      }
      if (ON.has(event.key)) {
        event.preventDefault();
        next();
      } else if (BACK.has(event.key)) {
        event.preventDefault();
        prev();
      } else if (event.key === "Home") {
        to(0);
      } else if (event.key === "End") {
        to(slides.length - 1);
      } else if (event.key === "f" || event.key === "F") {
        if (document.fullscreenElement) document.exitFullscreen();
        else
          document.documentElement.requestFullscreen?.().catch(() => undefined);
      } else if ((event.key === "e" || event.key === "E") && canArrange) {
        setArranging((a) => !a);
      } else if (event.key === "h" || event.key === "H") {
        setControls((shown) => !shown);
      } else if (event.key === "Escape") {
        setArranging(false);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [next, prev, to, slides.length, canArrange, setControls]);

  // A tap, a click or a swipe on the slide go nowhere – the slide's own
  // buttons and the keys do. A long press (no keyboard on a phone) shows or
  // hides the controls; not on a sticker (it is thrown), a button or a link.
  const down = useRef<{
    id: number;
    x: number;
    y: number;
    timer: number;
    held: boolean;
  } | null>(null);
  const onPointerDown = (event: React.PointerEvent) => {
    if (event.button > 0) return;
    const target = event.target as Element;
    if (target.closest("a, button, [data-sticker], [data-controls]")) return;
    const start = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      held: false,
      timer: window.setTimeout(() => {
        start.held = true;
        setControls((shown) => !shown);
      }, LONG_PRESS),
    };
    down.current = start;
  };
  const onPointerMove = (event: React.PointerEvent) => {
    const start = down.current;
    if (start?.id !== event.pointerId) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 12) {
      window.clearTimeout(start.timer);
    }
  };
  const onPointerUp = () => {
    const start = down.current;
    down.current = null;
    if (start) window.clearTimeout(start.timer);
  };

  const slide = slides[pos.slide];
  if (!slide) return null;
  // The way on shows once the slide is played through – points shown, stack
  // thrown, Card opened – or at once on a slide seen before.
  const ready = pos.slide < furthest || pos.step >= (steps[pos.slide] ?? 0);
  // Where the slide's own button leads.
  const onward: Onward =
    pos.step < (steps[pos.slide] ?? 0)
      ? "point"
      : pos.slide < slides.length - 1
        ? "next"
        : slides.length > 1
          ? "again"
          : null;

  return (
    <MotionProvider>
      <StickerStage>
        <main
          className="fixed inset-0 grid touch-none place-items-center overflow-hidden"
          onContextMenu={(event) => event.preventDefault()}
          onPointerCancel={() => {
            if (down.current) window.clearTimeout(down.current.timer);
            down.current = null;
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{
            background: slide.look.bg,
            transition: "background-color 0.6s ease",
          }}
        >
          <h1 className="sr-only">{deck.title}</h1>
          <Stage>
            <AnimatePresence custom={move}>
              <SlideFrame
                arrangement={arrangement}
                arranging={arranging}
                key={slide.id}
                move={move}
                onArrange={canArrange ? arrange : undefined}
                onStep={next}
                slide={slide}
                step={pos.step}
              />
            </AnimatePresence>
            <TransitionCover key={move.n} look={slide.look} move={move} />
            {/* The ways on and back stay on the stage, slide after slide. */}
            <SlideNav
              back={pos.slide > 0 || pos.step > 0}
              delay={move.n === 0 ? 1.2 : 0.3}
              label={slide.nextLabel || deck.nextLabel}
              look={slide.look}
              onBack={prev}
              onOn={onward === "again" ? () => to(0) : next}
              onward={onward}
              ready={ready}
            />
          </Stage>
        </main>
        <Controls
          arranging={arranging}
          canArrange={canArrange}
          count={slides.length}
          dock={deck.dock}
          onArrange={() => setArranging((a) => !a)}
          onJump={to}
          saveState={state}
          shown={controls}
          slide={pos.slide}
        />
      </StickerStage>
    </MotionProvider>
  );
};
