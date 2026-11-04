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

/** Keys that go on, and back. */
const ON = new Set(["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"]);
const BACK = new Set(["ArrowLeft", "ArrowUp", "PageUp", "Backspace"]);

/**
 * A deck, played: one slide at a time on the stage, each coming in with its
 * transition. On: → ↓ space, a click or tap on the right, a swipe to the
 * left. Back: ← ↑, a click or tap on the left, a swipe to the right. Home and
 * End, F for full screen, E arranges the stickers (logged in). Every slide
 * has its address (`/talk`, `/talk/1` …): written as it changes, without
 * loading anew – the browser's back goes a slide back.
 */
export const DeckPlayer = ({ deck, start, canArrange }: Props) => {
  const { slides } = deck;
  const steps = useMemo(() => slides.map(stepsOf), [slides]);
  const [pos, setPos] = useState<Pos>({ slide: start, step: 0 });
  const posRef = useRef(pos);
  const [move, setMove] = useState<Move>({ kind: "fade", dir: 1, n: 0 });
  const [arranging, setArranging] = useState(false);
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
      } else if (event.key === "Escape") {
        setArranging(false);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [next, prev, to, slides.length, canArrange]);

  // A tap or click: on the right on, on the left back; a swipe the same.
  // Not on a sticker (it is thrown), a button or a link.
  const down = useRef<{ id: number; x: number; y: number } | null>(null);
  const onPointerDown = (event: React.PointerEvent) => {
    if (event.button > 0) return;
    const target = event.target as Element;
    if (target.closest("a, button, [data-sticker], [data-controls]")) return;
    down.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event: React.PointerEvent) => {
    const start = down.current;
    down.current = null;
    if (start?.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      if (dx < 0) next();
      else prev();
      return;
    }
    if (Math.hypot(dx, dy) > 12 || arranging) return;
    if (event.clientX < window.innerWidth * 0.3) prev();
    else next();
  };

  const slide = slides[pos.slide];
  if (!slide) return null;

  return (
    <MotionProvider>
      <StickerStage>
        <main
          className="fixed inset-0 grid touch-none place-items-center overflow-hidden select-none"
          onPointerCancel={() => {
            down.current = null;
          }}
          onPointerDown={onPointerDown}
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
                slide={slide}
                step={pos.step}
              />
            </AnimatePresence>
            <TransitionCover key={move.n} look={slide.look} move={move} />
          </Stage>
        </main>
        <Controls
          arranging={arranging}
          canArrange={canArrange}
          count={slides.length}
          onArrange={() => setArranging((a) => !a)}
          onJump={to}
          onNext={next}
          onPrev={prev}
          saveState={state}
          slide={pos.slide}
        />
      </StickerStage>
    </MotionProvider>
  );
};
