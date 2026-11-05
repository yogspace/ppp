"use client";

import { AnimatePresence, m } from "motion/react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/cn";
import { scratchParts } from "./parse";

/**
 * Scratched this much (a share of the foil), the rest falls away: a few
 * words soon, a ticket (the scratch slide) only when nearly all is gone.
 */
const ENOUGH = { words: 0.5, ticket: 0.8 };
/** Rubbed free by itself (the next button): this long (ms). */
const AUTO = 750;

/** The foil: silver, a sheen across, little sparkles – like a lottery ticket. */
const paintFoil = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
  ctx.globalCompositeOperation = "source-over";
  const metal = ctx.createLinearGradient(0, 0, w, h);
  metal.addColorStop(0, "#c9cad6");
  metal.addColorStop(0.45, "#eeeef4");
  metal.addColorStop(0.55, "#b7b8c6");
  metal.addColorStop(1, "#d8d9e3");
  ctx.fillStyle = metal;
  ctx.fillRect(0, 0, w, h);
  // Sparkles in a loose grid, as big as the foil allows.
  const step = Math.max(10, Math.min(h / 3, 46));
  const r = Math.max(1, step / 9);
  ctx.fillStyle = "rgb(255 255 255 / 0.85)";
  for (let y = step / 2; y < h; y += step) {
    const row = Math.round(y / step);
    for (let x = (row % 2) * (step / 2) + step / 4; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, y - r * 2);
      ctx.lineTo(x + r * 0.6, y - r * 0.6);
      ctx.lineTo(x + r * 2, y);
      ctx.lineTo(x + r * 0.6, y + r * 0.6);
      ctx.lineTo(x, y + r * 2);
      ctx.lineTo(x - r * 0.6, y + r * 0.6);
      ctx.lineTo(x - r * 2, y);
      ctx.lineTo(x - r * 0.6, y - r * 0.6);
      ctx.fill();
    }
  }
};

/** How much of the foil is gone – read on a few points, quick. */
const cleared = (c: HTMLCanvasElement | null) => {
  const ctx = c?.getContext("2d", { willReadFrequently: true });
  if (!(c?.width && ctx)) return 0;
  const { data } = ctx.getImageData(0, 0, c.width, c.height);
  let gone = 0;
  let seen = 0;
  const stride = 4 * Math.max(1, Math.floor((c.width * c.height) / 4000));
  for (let i = 3; i < data.length; i += stride) {
    seen++;
    if (data[i] < 40) gone++;
  }
  return seen ? gone / seen : 0;
};

// ── A slide's foils: what is still covered (for the hint) ────────────────

type Scope = { seal: (id: string, sealed: boolean) => void; left: number };

const ScratchScopeContext = createContext<Scope | null>(null);

/** Around a slide: knows whether any of its foils is still on. */
export const ScratchScope = ({ children }: { children: ReactNode }) => {
  const [sealed, setSealed] = useState<ReadonlySet<string>>(new Set());
  const seal = useCallback((id: string, on: boolean) => {
    setSealed((current) => {
      if (current.has(id) === on) return current;
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);
  return (
    <ScratchScopeContext.Provider value={{ seal, left: sealed.size }}>
      {children}
    </ScratchScopeContext.Provider>
  );
};

/**
 * “Rub to reveal”, a finger rubbing to and fro – while any foil on the
 * slide is still on. At the bottom, like the card's “tap to open”.
 */
export const ScratchHint = ({ delay = 1.6 }: { delay?: number }) => {
  const scope = useContext(ScratchScopeContext);
  const show = Boolean(scope?.left);
  return (
    <AnimatePresence>
      {show && (
        <m.span
          animate={{ y: 0, opacity: 1 }}
          aria-hidden
          className="pointer-events-none absolute bottom-[4cqmin] left-1/2 z-30 -translate-x-1/2"
          exit={{ y: 12, opacity: 0, transition: { duration: 0.25 } }}
          initial={{ y: 12, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 22, delay }}
        >
          <span className="inline-flex animate-[bob_1.6s_ease-in-out_infinite] items-center gap-[0.5em] rounded-full bg-(--paper) px-[1em] py-[0.55em] font-sans text-[max(13px,2cqmin)] leading-none font-semibold whitespace-nowrap text-(--paper-ink) shadow-[0_0.4em_1em_-0.5em_rgb(0_0_0/0.35)]">
            <svg
              aria-hidden
              className="size-[1.3em] animate-[rub_1.1s_ease-in-out_infinite]"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.6-2.2L5 15.6a1.5 1.5 0 0 1 2.3-1.9L9 15.5" />
            </svg>
            rub to reveal
          </span>
        </m.span>
      )}
    </AnimatePresence>
  );
};

// ── The foil ────────────────────────────────────────────────────────────

type Flake = { id: number; x: number; y: number; dx: number; turn: number };

type Props = {
  children: ReactNode;
  /** Open from outside (the scratch slide: its step) – else by rubbing alone. */
  open?: boolean;
  /** Rubbed free (about half gone). */
  onOpen?: () => void;
  /** Big, a ticket's window – else a few words in a line. */
  block?: boolean;
  className?: string;
};

/**
 * Words (or anything) under a scratch-off foil: rubbed away with a finger or
 * the mouse, silver flakes falling off; once about half is gone the rest
 * falls away and what's under it pops. Opened from outside (`open`) it
 * rubs itself free in a quick zigzag; closed again, the foil is back. Its
 * rubbing is its own – no long press, no sticker grabbed, nothing selected.
 */
export const Scratch = ({
  children,
  open: asked,
  onOpen,
  block = false,
  className,
}: Props) => {
  const box = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [rubbed, setRubbed] = useState(false);
  const open = asked ?? rubbed;
  const enough = block ? ENOUGH.ticket : ENOUGH.words;
  const last = useRef<{ x: number; y: number } | null>(null);
  const strokes = useRef(0);
  const [flakes, setFlakes] = useState<Flake[]>([]);
  const flakeId = useRef(0);
  const id = useId();
  const scope = useContext(ScratchScopeContext);
  const seal = scope?.seal;

  useEffect(() => {
    seal?.(id, !open);
    return () => seal?.(id, false);
  }, [seal, id, open]);

  const reveal = useCallback(() => {
    setRubbed(true);
    onOpen?.();
  }, [onOpen]);

  // The foil, as big as what it covers (again when that changes size), and
  // fresh again once closed.
  useEffect(() => {
    const el = box.current;
    const c = canvas.current;
    if (!(el && c) || open) return;
    c.width = 0;
    const draw = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(c.clientWidth * ratio));
      const h = Math.max(1, Math.round(c.clientHeight * ratio));
      if (c.width === w && c.height === h) return;
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      if (ctx) paintFoil(ctx, w, h);
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open]);

  // Closed from outside again (back a step): rubbable anew.
  useEffect(() => {
    if (asked === false) setRubbed(false);
  }, [asked]);

  /** Rubs from where it last was to (px, py) – canvas pixels. */
  const stroke = (px: number, py: number) => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!(c && ctx)) return;
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // A fingertip: about the words' height – on a ticket, a fat thumb.
    ctx.lineWidth = block
      ? Math.max(28, c.height * 0.16)
      : Math.max(14, c.height * 0.7);
    const from = last.current ?? { x: px, y: py };
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(px + 0.01, py);
    ctx.stroke();
    last.current = { x: px, y: py };
  };

  /** Flakes falling off where the finger is (box px). */
  const shed = (x: number, y: number) => {
    if (Math.random() > (block ? 0.55 : 0.3)) return;
    const flake: Flake = {
      id: flakeId.current++,
      x,
      y,
      dx: (Math.random() - 0.5) * 40,
      turn: (Math.random() - 0.5) * 540,
    };
    setFlakes((all) => [...all.slice(-23), flake]);
    window.setTimeout(
      () => setFlakes((all) => all.filter((f) => f.id !== flake.id)),
      800
    );
  };

  const rub = (x: number, y: number) => {
    const c = canvas.current;
    const el = box.current;
    if (!(c && el) || open) return;
    const rect = c.getBoundingClientRect();
    stroke(
      ((x - rect.left) * c.width) / rect.width,
      ((y - rect.top) * c.height) / rect.height
    );
    const own = el.getBoundingClientRect();
    shed(x - own.left, y - own.top);
    strokes.current++;
    if (strokes.current % 6 === 0 && cleared(c) >= enough) reveal();
  };

  // Opened from outside while still covered: it rubs itself free first.
  const [selfRubbing, setSelfRubbing] = useState(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: on `asked` alone
  useEffect(() => {
    const c = canvas.current;
    if (!(asked && c?.width) || rubbed || cleared(c) >= enough) return;
    setSelfRubbing(true);
    const start = performance.now();
    last.current = null;
    let frame = 0;
    const zig = (now: number) => {
      const t = Math.min(1, (now - start) / AUTO);
      // Zigzag down and across, a finger in a hurry.
      const rows = block ? 5 : 2;
      const y = (Math.floor(t * rows * 2) / (rows * 2) + 0.12) * c.height;
      const across = ((t * rows * 2) % 1) * c.width;
      const x = Math.floor(t * rows * 2) % 2 ? c.width - across : across;
      stroke(x, Math.min(c.height, y));
      if (t < 1) frame = requestAnimationFrame(zig);
      else {
        setSelfRubbing(false);
        setRubbed(true);
      }
    };
    frame = requestAnimationFrame(zig);
    return () => cancelAnimationFrame(frame);
  }, [asked]);

  const shown = open && !selfRubbing;

  return (
    <span
      className={cn(
        "relative",
        block ? "block" : "inline-block",
        { "select-none": !shown },
        className
      )}
      data-scratch
      ref={box}
    >
      <m.span
        animate={shown ? { scale: [0.9, 1.15, 1] } : { scale: 1 }}
        className={block ? "block" : "inline-block"}
        initial={false}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {children}
      </m.span>
      <m.canvas
        animate={
          shown
            ? { opacity: 0, scale: 1.06, y: "8%", rotate: block ? -4 : -3 }
            : { opacity: 1, scale: 1, y: "0%", rotate: 0 }
        }
        aria-hidden
        className={cn(
          "absolute touch-none shadow-[0_0.06em_0.18em_rgb(0_0_0/0.25)]",
          block
            ? "inset-0 size-full rounded-[1.4cqmin]"
            : "-inset-x-[0.12em] -inset-y-[0.06em] h-[calc(100%+0.12em)] w-[calc(100%+0.24em)] rounded-[0.18em]",
          { "pointer-events-none": shown, "cursor-grab": !shown }
        )}
        initial={false}
        onPointerDown={(event) => {
          // Rubbing, not a press on the slide: no long press, no drag, no
          // text selected along the way.
          event.stopPropagation();
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          last.current = null;
          rub(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          const own = event.currentTarget.hasPointerCapture(event.pointerId);
          // A mouse coming in pressed (started beside the foil) rubs too.
          if (!own && !(event.pointerType === "mouse" && event.buttons & 1)) {
            return;
          }
          event.stopPropagation();
          if (!own) {
            event.currentTarget.setPointerCapture(event.pointerId);
            last.current = null;
          }
          rub(event.clientX, event.clientY);
        }}
        onPointerUp={() => {
          last.current = null;
          if (!open && cleared(canvas.current) >= enough) reveal();
        }}
        ref={canvas}
        transition={{ duration: 0.55, ease: "easeIn" }}
      />
      {/* Now and then a sheen across – there's something to rub here. */}
      {!shown && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute overflow-hidden",
            block
              ? "inset-0 rounded-[1.4cqmin]"
              : "-inset-x-[0.12em] -inset-y-[0.06em] rounded-[0.18em]"
          )}
        >
          <span className="absolute inset-y-0 -left-1/2 w-1/3 animate-[foil-shine_3.2s_ease-in-out_1s_infinite] bg-linear-to-r from-transparent via-white/70 to-transparent" />
        </span>
      )}
      {flakes.map((flake) => (
        <m.i
          animate={{
            x: flake.dx,
            y: block ? 90 : 40,
            rotate: flake.turn,
            opacity: 0,
          }}
          aria-hidden
          className="pointer-events-none absolute z-10 block size-[0.5cqmin] min-h-1 min-w-1 rounded-[1px] bg-[#d6d7e2] shadow-[0_0_1px_rgb(0_0_0/0.3)]"
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          key={flake.id}
          style={{ left: flake.x, top: flake.y }}
          transition={{ duration: 0.75, ease: [0.4, 0, 1, 1] }}
        />
      ))}
    </span>
  );
};

/**
 * Plain text with its secrets (`||…||`) under foil – for any of a slide's
 * words that aren't split up word by word.
 */
export const ScratchText = ({ text }: { text: string }) => (
  <>
    {scratchParts(text).map((part, i) =>
      part.secret ? (
        <Scratch key={`${i}-${part.text}`}>{part.text}</Scratch>
      ) : (
        part.text
      )
    )}
  </>
);
