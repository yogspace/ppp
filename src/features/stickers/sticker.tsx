"use client";

import { animate, m, useMotionValue } from "motion/react";
import {
  type CSSProperties,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import type { StickerData } from "@/features/player/types";
import {
  clampPlacement,
  defaultPlacement,
  type Placement,
  type Spots,
} from "./arrangement";
import { type StickerArt, stickerArt } from "./art";
import { ringArea } from "./outline";
import type { StickerPose } from "./renderer";
import { useStickerStage } from "./sticker-stage";

type Props = {
  sticker: StickerData;
  index: number;
  /** Where it was arranged – null: its default spot. */
  stored: Placement | null;
  /** A square sticker's default width, as a share of the stage's. */
  size: number;
  /** Where it sits by default. */
  spots: Spots;
  /** Logged in and arranging: moves are kept (and saved). */
  arranging: boolean;
  /** Shrunk away (a card turned over). */
  hidden: boolean;
  /** Seconds before it flies in. */
  delay: number;
  /** Drawn this much bigger than its placement says. */
  scale: number;
  /** The stage it lies on – sizes and the bounds of a throw. */
  layerRef: RefObject<HTMLDivElement | null>;
  onArrange?: (id: string, placement: Placement | null) => void;
};

type Point = { x: number; y: number };

/**
 * The area a sticker is grabbed by: its outline (the largest piece) as a
 * clip path on a box as big as its face – the face is wider than the
 * picture by the rim, and centred on it. `aspect`: the picture's width /
 * height.
 */
const hitArea = (art: StickerArt, aspect: number): CSSProperties | null => {
  const ring = [...art.rings].sort((a, b) => ringArea(b) - ringArea(a))[0];
  if (!ring) return null;
  const width = 1 / art.pictureShare;
  const height = (art.aspect * aspect) / art.pictureShare;
  const points = ring
    .map(
      ([x, y]) =>
        `${(x * 100).toFixed(2)}% ${((y / art.aspect) * 100).toFixed(2)}%`
    )
    .join(", ");
  return {
    left: `${((1 - width) / 2) * 100}%`,
    top: `${((1 - height) / 2) * 100}%`,
    width: `${width * 100}%`,
    height: `${height * 100}%`,
    clipPath: `polygon(${points})`,
  };
};

const SPRING = { type: "spring", stiffness: 260, damping: 15 } as const;

/**
 * One sticker: a box on its stage, drawn in 3D over it (renderer.ts) – a
 * flat picture with a white edge until then, or without WebGL.
 *
 * It flies in from the nearest edge and lands with a bounce. Anyone can
 * play with it: a finger (or the mouse) drags it and throws it – it glides
 * on and bounces off the stage's edges. While arranging (logged in, E),
 * where it is dropped is kept, and a double click puts it back on its
 * default spot.
 */
export const Sticker = ({
  sticker,
  index,
  stored,
  size,
  spots,
  arranging,
  hidden,
  delay,
  scale,
  layerRef,
  onArrange,
}: Props) => {
  const { picture } = sticker;
  const aspect = picture.width / picture.height || 1;
  const home = useMemo(
    () => defaultPlacement(index, aspect, size, spots),
    [index, aspect, size, spots]
  );
  const [placement, setPlacement] = useState<Placement>(stored ?? home);
  const placementRef = useRef(placement);
  placementRef.current = placement;

  // The live offset (px) while it is dragged or glides.
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  // Its entrance – and its exit with the slide.
  const appear = useMotionValue(0);
  const spin = useMotionValue(0);

  const boxRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const liftRef = useRef(0);
  const busyRef = useRef(false);

  // Arranged elsewhere meanwhile (another tab, the live preview): follow –
  // unless it is being handled right now.
  useEffect(() => {
    if (busyRef.current) return;
    setPlacement(stored ?? home);
  }, [stored, home]);

  // Drawn in 3D once its sticker is made – the flat picture hides then.
  const stage = useStickerStage();
  const [drawn, setDrawn] = useState(false);
  // Where it can be grabbed: its die-cut outline, not its box.
  const [hit, setHit] = useState<CSSProperties | null>(null);
  useEffect(() => {
    if (!stage.ready) return;
    let remove: (() => void) | null = null;
    let on = true;
    const read = (): StickerPose | null => {
      const box = boxRef.current;
      const art = artRef.current;
      if (!(box && art)) return null;
      const rect = art.getBoundingClientRect();
      const own = appear.get();
      if (own < 0.01 || rect.width === 0) return null;
      const rotation = placementRef.current.r + spin.get();
      const rad = (rotation * Math.PI) / 180;
      const w = box.offsetWidth;
      const h = box.offsetHeight;
      // Whatever shrinks the slide (a transition) shrinks the sticker too:
      // its box on screen against the box it would be unscaled.
      const expected =
        (w * Math.abs(Math.cos(rad)) + h * Math.abs(Math.sin(rad))) * own;
      const outer = expected > 0 ? rect.width / expected : 1;
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: w * own * outer,
        rotation,
        lift: liftRef.current,
      };
    };
    stickerArt(picture.src)
      .then((art) => {
        if (!on) return;
        setHit(hitArea(art, aspect));
        remove = stage.add(art, read);
        if (remove) setDrawn(true);
      })
      .catch(() => undefined);
    return () => {
      on = false;
      remove?.();
      setDrawn(false);
    };
  }, [stage, picture.src, appear, spin, aspect]);

  /** The live offset made the placement – the box moves, nothing jumps. */
  const commit = useCallback(() => {
    const layer = layerRef.current;
    if (!layer) return placementRef.current;
    const current = placementRef.current;
    const next = clampPlacement({
      ...current,
      x: current.x + x.get() / (layer.clientWidth || 1),
      y: current.y + y.get() / (layer.clientHeight || 1),
    });
    flushSync(() => setPlacement(next));
    x.set(0);
    y.set(0);
    return next;
  }, [layerRef, x, y]);

  const save = useCallback(
    (placement: Placement | null) => onArrange?.(sticker.id, placement),
    [onArrange, sticker.id]
  );

  // ── Dragging and throwing ─────────────────────────────────────────────

  /**
   * How far it may be moved from its place (px, per axis) – the whole
   * sticker, turned as it is, stays on its stage.
   */
  const bounds = () => {
    const layer = layerRef.current;
    const box = boxRef.current;
    if (!(layer && box)) return null;
    const width = layer.clientWidth;
    const height = layer.clientHeight;
    const p = placementRef.current;
    const rad = (p.r * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const halfW = (box.offsetWidth * cos + box.offsetHeight * sin) / 2;
    const halfH = (box.offsetWidth * sin + box.offsetHeight * cos) / 2;
    const range = (at: number, half: number, size: number) =>
      half * 2 >= size
        ? ([size / 2 - at, size / 2 - at] as const)
        : ([half - at, size - half - at] as const);
    return {
      x: range(p.x * width, halfW, width),
      y: range(p.y * height, halfH, height),
    };
  };

  const within = (value: number, [min, max]: readonly [number, number]) =>
    Math.min(max, Math.max(min, value));

  const held = useRef<{ id: number; x: number; y: number; at: Point } | null>(
    null
  );
  const trail = useRef<{ t: number; x: number; y: number }[]>([]);
  const throws = useRef<{ stop: () => void }[]>([]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // One finger holds it; a second one is ignored.
    if (event.button > 0 || held.current) return;
    // Not a click on the slide: the deck stays where it is.
    event.stopPropagation();
    (event.target as Element).setPointerCapture(event.pointerId);
    for (const t of throws.current) t.stop();
    throws.current = [];
    busyRef.current = true;
    held.current = {
      id: event.pointerId,
      x: x.get(),
      y: y.get(),
      at: { x: event.clientX, y: event.clientY },
    };
    liftRef.current = 2;
    trail.current = [];
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const h = held.current;
    if (h?.id !== event.pointerId) return;
    const b = bounds();
    const nextX = h.x + event.clientX - h.at.x;
    const nextY = h.y + event.clientY - h.at.y;
    x.set(b ? within(nextX, b.x) : nextX);
    y.set(b ? within(nextY, b.y) : nextY);
    const now = performance.now();
    trail.current.push({ t: now, x: event.clientX, y: event.clientY });
    while (trail.current.length > 2 && now - trail.current[0].t > 90) {
      trail.current.shift();
    }
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (held.current?.id !== event.pointerId) return;
    held.current = null;
    liftRef.current = event.pointerType === "mouse" ? 1 : 0;
    if (arranging) {
      busyRef.current = false;
      save(commit());
      return;
    }
    // Thrown: it glides on and bounces off the stage's edges – never past.
    const first = trail.current[0];
    const last = trail.current[trail.current.length - 1];
    const dt = first && last ? (last.t - first.t) / 1000 : 0;
    const b = bounds();
    if (!(b && dt > 0.01)) {
      busyRef.current = false;
      commit();
      return;
    }
    let running = 2;
    const done = () => {
      running--;
      if (running === 0) {
        busyRef.current = false;
        commit();
      }
    };
    const glide = (
      value: typeof x,
      velocity: number,
      min: number,
      max: number
    ) =>
      animate(value, value.get(), {
        type: "inertia",
        velocity,
        min,
        max,
        power: 0.35,
        timeConstant: 320,
        bounceStiffness: 380,
        bounceDamping: 16,
        onComplete: done,
      });
    throws.current = [
      glide(x, (last.x - first.x) / dt, ...b.x),
      glide(y, (last.y - first.y) / dt, ...b.y),
    ];
  };

  const reset = () => {
    if (!arranging) return;
    flushSync(() => setPlacement(home));
    save(null);
  };

  // It flies in from the nearest side, spinning a little.
  const fromLeft = placement.x < 0.5;
  const from = {
    x: fromLeft ? "-240%" : "240%",
    y: placement.y < 0.5 ? "-60%" : "60%",
  };

  return (
    <m.div
      className="pointer-events-none absolute touch-none select-none data-arranging:outline-2 data-arranging:outline-offset-4 data-arranging:outline-dashed data-arranging:outline-current/40"
      data-arranging={arranging || undefined}
      data-sticker
      // A card under it must not turn when it is let go.
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={reset}
      onLostPointerCapture={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerDown={onPointerDown}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse" && !held.current) {
          liftRef.current = 1;
        }
      }}
      onPointerLeave={() => {
        if (!held.current) liftRef.current = 0;
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      ref={boxRef}
      style={{
        left: `${placement.x * 100}%`,
        top: `${placement.y * 100}%`,
        width: `${placement.w * scale * 100}%`,
        aspectRatio: `${aspect}`,
        marginLeft: `${-placement.w * scale * 50}%`,
        marginTop: `${((-placement.w * scale) / aspect) * 50}%`,
        x,
        y,
        rotate: placement.r,
      }}
    >
      <m.div
        animate={{ scale: hidden ? 0 : 1, rotate: 0, x: "0%", y: "0%" }}
        className="absolute inset-0"
        exit={{ scale: 0, transition: { duration: 0.18, ease: "backIn" } }}
        initial={{ scale: 0, rotate: fromLeft ? -40 : 40, ...from }}
        ref={artRef}
        style={{ scale: appear, rotate: spin }}
        transition={{
          ...SPRING,
          delay: hidden ? 0 : delay + index * 0.09,
        }}
      >
        <img
          alt={picture.alt}
          className="sticker-flat size-full transition-opacity duration-150"
          draggable={false}
          src={picture.src}
          style={{ opacity: drawn ? 0 : 1 }}
        />
        {/* What can be grabbed: the outline once it is traced, the box
            until then. */}
        <div
          aria-hidden
          className="pointer-events-auto absolute inset-0 cursor-grab touch-none active:cursor-grabbing data-arranging:cursor-move"
          data-arranging={arranging || undefined}
          style={hit ?? undefined}
        />
      </m.div>
    </m.div>
  );
};
