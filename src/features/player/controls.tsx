"use client";

import { AnimatePresence, m } from "motion/react";
import { type RefObject, useEffect, useRef, useState } from "react";
import type { SaveState } from "@/features/stickers/use-arrange";
import { cn } from "@/lib/cn";
import { usePlayer, usePlayerState } from "./store";

const SPRING = { type: "spring", stiffness: 500, damping: 30 } as const;

const Icon = ({ d }: { d: string }) => (
  <svg
    aria-hidden
    className="size-5"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2.2"
    viewBox="0 0 24 24"
  >
    <path d={d} />
  </svg>
);

const button =
  "grid size-11 place-items-center rounded-full transition-[scale,background-color] duration-200 ease-spring hover:bg-white/15 active:scale-90 disabled:opacity-30";

/** The mouse this close to the bottom edge (px) … */
const DOCK_IN = 56;
/** … and this close beside the controls (px) brings them up; */
const DOCK_BESIDE = 72;
/** this far up (px) – or out of the window – sends them away again, */
const DOCK_OUT = 140;
/** a moment later (ms) – no flicker. */
const DOCK_LINGER = 450;

/**
 * Like macOS's dock: the mouse right at the bottom edge, below the controls
 * (give or take a little), brings them up; moving away lets them go again a
 * moment later. Only a mouse – a finger has the long press.
 */
const useDock = (ref: RefObject<HTMLElement | null>) => {
  const [up, setUp] = useState(false);
  useEffect(() => {
    let timer = 0;
    const away = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setUp(false), DOCK_LINGER);
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const fromBottom = window.innerHeight - event.clientY;
      const half = (ref.current?.offsetWidth ?? 320) / 2 + DOCK_BESIDE;
      const beside = Math.abs(event.clientX - window.innerWidth / 2) <= half;
      if (fromBottom <= DOCK_IN && beside) {
        window.clearTimeout(timer);
        setUp(true);
      } else if (fromBottom > DOCK_OUT || !beside) {
        away();
      }
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", away);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", away);
    };
  }, [ref]);
  return up;
};

type Props = {
  canArrange: boolean;
  saveState: SaveState;
};

/**
 * The deck's controls: a dot per slide (the current one a pill), full
 * screen – and, logged in, arranging – with a thin bar along the
 * bottom showing how far along it is. Out of sight until asked for – the
 * mouse at the bottom edge, H, or a long press: the slides alone on the
 * screen.
 */
export const Controls = ({ canArrange, saveState }: Props) => {
  const player = usePlayer();
  // Pinned up (H, a long press) – else they come up like a dock.
  const { pos, arranging, controls: asked } = usePlayerState();
  const { dock } = player.deck;
  const count = player.deck.slides.length;
  const slide = pos.slide;
  const [fullscreen, setFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);
  useEffect(() => {
    setCanFullscreen(Boolean(document.fullscreenEnabled));
    const change = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", change);
    return () => document.removeEventListener("fullscreenchange", change);
  }, []);
  const dockRef = useRef<HTMLElement>(null);
  const docked = useDock(dockRef);
  // Logged in, there's a dock even where the deck has none (to review and
  // arrange); for visitors only where it has one.
  const shown = (dock || canArrange) && (asked || docked || arranging);

  return (
    <>
      {/* Only while the controls show: a strip at the screen's edge is what
          Safari (iOS 26) would tint its bottom bar from. */}
      {shown && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-[3px] bg-black/5"
        >
          <m.i
            animate={{ scaleX: count > 1 ? slide / (count - 1) : 1 }}
            className="block h-full origin-left bg-(--accent)"
            initial={false}
            transition={SPRING}
          />
        </div>
      )}

      <AnimatePresence>
        {arranging && (
          <m.div
            animate={{ y: 0, opacity: 1 }}
            className="fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-40 flex justify-center px-4"
            exit={{ y: -30, opacity: 0 }}
            initial={{ y: -30, opacity: 0 }}
            transition={SPRING}
          >
            <p className="rounded-full bg-neutral-950/85 px-4 py-2 text-center text-sm text-white shadow-lg backdrop-blur">
              Arranging – drag the stickers where they belong · double-click
              puts one back ·{" "}
              <span className="opacity-70">
                {saveState === "saving"
                  ? "saving…"
                  : saveState === "saved"
                    ? "saved ✓"
                    : saveState === "failed"
                      ? "couldn't save ✗"
                      : "E when done"}
              </span>
            </p>
          </m.div>
        )}
      </AnimatePresence>

      {(dock || canArrange) && (
        <m.nav
          animate={
            shown
              ? { y: 0, opacity: 1, visibility: "visible" }
              : {
                  y: 24,
                  opacity: 0,
                  // Gone once faded: a hidden dark pill at the screen's edge
                  // would still tint Safari's bottom bar (iOS 26). Still
                  // measured where it would be (useDock).
                  transitionEnd: { visibility: "hidden" },
                }
          }
          aria-label="Slides"
          className={cn(
            "fixed bottom-[max(0.9rem,env(safe-area-inset-bottom))] left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full bg-neutral-950/80 p-1 text-white shadow-[0_0.5rem_1.5rem_-0.5rem_rgb(0_0_0/0.5)] backdrop-blur",
            { "pointer-events-none": !shown }
          )}
          data-controls
          initial={false}
          ref={dockRef}
          transition={SPRING}
        >
          {count <= 24 ? (
            <div className="flex items-center gap-1.5 px-1">
              {Array.from({ length: count }, (_, i) => (
                <button
                  aria-current={i === slide ? "step" : undefined}
                  aria-label={`Slide ${i + 1}`}
                  className="relative grid h-11 w-3 place-items-center"
                  key={i}
                  onClick={() => player.to(i)}
                  type="button"
                >
                  {i === slide ? (
                    <m.i
                      className="block h-2.5 w-5 rounded-full bg-white"
                      layoutId="current-dot"
                      transition={SPRING}
                    />
                  ) : (
                    <i className="block size-2 rounded-full bg-white/40 transition-[scale] duration-200 ease-spring hover:scale-150" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <span className="px-2 text-sm tabular-nums">
              {slide + 1} / {count}
            </span>
          )}
          {canFullscreen && (
            <button
              aria-label={fullscreen ? "Leave full screen" : "Full screen"}
              className={button}
              onClick={() =>
                fullscreen
                  ? document.exitFullscreen()
                  : document.documentElement.requestFullscreen()
              }
              type="button"
            >
              <Icon
                d={
                  fullscreen
                    ? "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"
                    : "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
                }
              />
            </button>
          )}
          {canArrange && (
            <button
              aria-label="Arrange stickers"
              aria-pressed={arranging}
              className={cn(button, {
                "bg-white text-neutral-950 hover:bg-white": arranging,
              })}
              onClick={player.toggleArranging}
              type="button"
            >
              <Icon d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" />
            </button>
          )}
        </m.nav>
      )}
    </>
  );
};
