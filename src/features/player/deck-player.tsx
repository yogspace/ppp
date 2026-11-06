"use client";

import { AnimatePresence, MotionGlobalConfig } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useSnapshot } from "valtio";
import { MotionProvider } from "@/components/motion";
import { AroundStage } from "@/features/backdrop/slide-background";
import { picturesIn, preload } from "@/features/media/preload";
import { PrepareStickers } from "@/features/stickers/prepare";
import { StickerCanvas, StickerStage } from "@/features/stickers/sticker-stage";
import { useArrange } from "@/features/stickers/use-arrange";
import { TransitionCover } from "@/features/transitions/overlay";
import { Controls } from "./controls";
import { useDocumentColor } from "./document-color";
import { SlideFrame } from "./slide-frame";
import { SlideNav } from "./slide-nav";
import { Stage } from "./stage";
import { slideFromPath } from "./steps";
import { createPlayer, PlayerContext } from "./store";
import type { DeckData } from "./types";

type Props = {
  deck: DeckData;
  /** The slide its address names. */
  start: number;
  /** Logged in: the stickers may be arranged (E). */
  canArrange: boolean;
  /**
   * Just a picture of the slide (`?still` – the admin's preview strip):
   * played through, nothing moving, no buttons, no 3D.
   */
  still?: boolean;
};

/** How long a press must last to show or hide the controls (ms). */
const LONG_PRESS = 550;

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
 * loading anew – the browser's back goes a slide back. Its state and what
 * moves it: the player's store (store.ts), shared with its buttons and dock.
 */
export const DeckPlayer = ({
  deck,
  start,
  canArrange,
  still = false,
}: Props) => {
  // A still: every animation at its end at once.
  if (still) MotionGlobalConfig.skipAnimations = true;
  const [player] = useState(() => createPlayer(deck, start, still));
  // Saved anew in the admin (the page refreshes): the new slides, same place.
  player.update(deck);
  const { pos, move, arranging } = useSnapshot(player.state);
  const { slides } = deck;
  const { arrangement, arrange, state } = useArrange(
    "decks",
    deck.id,
    deck.arrangement
  );

  // Logged in, the dock is up – to go through the slides and arrange.
  useEffect(() => player.remember(canArrange), [player, canArrange]);

  // The browser's back and forward: to the slide its address names.
  useEffect(() => {
    const pop = () => {
      const slide = slideFromPath(
        window.location.pathname,
        player.deck.slug,
        player.deck.slides.length
      );
      if (slide !== null) player.jumpTo(slide);
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, [player]);

  // This slide's pictures (a List's change with each point) and the next
  // slide's, loaded ahead: there the moment they show.
  useEffect(() => {
    preload([
      ...picturesIn(slides[pos.slide]),
      ...picturesIn(slides[pos.slide + 1]),
    ]);
  }, [slides, pos.slide]);

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
        player.next();
      } else if (BACK.has(event.key)) {
        event.preventDefault();
        player.prev();
      } else if (event.key === "Home") {
        player.to(0);
      } else if (event.key === "End") {
        player.to(player.deck.slides.length - 1);
      } else if (event.key === "f" || event.key === "F") {
        if (document.fullscreenElement) document.exitFullscreen();
        else
          document.documentElement.requestFullscreen?.().catch(() => undefined);
      } else if ((event.key === "e" || event.key === "E") && canArrange) {
        player.toggleArranging();
      } else if (event.key === "h" || event.key === "H") {
        player.toggleControls();
      } else if (event.key === "Escape") {
        player.stopArranging();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [player, canArrange]);

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
        player.toggleControls();
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
  useDocumentColor(slide?.look.bg ?? "#efeff5");
  if (!slide) return null;

  return (
    <PlayerContext.Provider value={player}>
      <MotionProvider>
        <StickerStage off={still}>
          <main
            // In the flow, not fixed: Safari (iOS 26) tints its bars from a
            // fixed element at the screen's edge and keeps that color – the
            // page's own color (document-color.ts) must decide.
            className="relative grid h-dvh w-full touch-none place-items-center overflow-hidden"
            onContextMenu={(event) => event.preventDefault()}
            onPointerCancel={() => {
              if (down.current) window.clearTimeout(down.current.timer);
              down.current = null;
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <h1 className="sr-only">{deck.title}</h1>
            <AroundStage>
              <Stage
                above={
                  <>
                    <TransitionCover
                      key={move.n}
                      layer="above"
                      look={slide.look}
                      move={move}
                    />
                    {/* The ways on and back stay on the stage, slide after slide. */}
                    {!still && (
                      <SlideNav
                        label={slide.nextLabel || deck.nextLabel}
                        look={slide.look}
                      />
                    )}
                  </>
                }
              >
                <AnimatePresence custom={move}>
                  <SlideFrame
                    arrangement={arrangement}
                    arranging={arranging}
                    frozen={still}
                    key={slide.id}
                    move={move}
                    onArrange={canArrange ? arrange : undefined}
                    onSettled={player.settle}
                    onStep={player.next}
                    slide={slide}
                    step={pos.step}
                  />
                </AnimatePresence>
                <TransitionCover key={move.n} look={slide.look} move={move} />
              </Stage>
            </AroundStage>
            {!still && (
              <>
                <StickerCanvas />
                <PrepareStickers
                  slides={[slides[pos.slide + 1], slides[pos.slide - 1]]}
                />
              </>
            )}
          </main>
          {!still && <Controls canArrange={canArrange} saveState={state} />}
        </StickerStage>
      </MotionProvider>
    </PlayerContext.Provider>
  );
};
