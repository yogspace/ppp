"use client";

import {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ThemeLook } from "@/features/themes/theme";
import { SlideMoving } from "@/features/transitions/moving";
import { cn } from "@/lib/cn";
import type { FloatHandle } from "./floaties";

/** A color mixed into another, `share` of the first (CSS does the math). */
const mix = (a: string, b: string, share: number) =>
  `color-mix(in oklab, ${a} ${Math.round(share * 100)}%, ${b})`;

/** Hex for three.js – the color-mix above stays CSS's. */
const hexMix = (a: string, b: string, share: number) => {
  const parse = (hex: string) => {
    const h = hex.length === 4 ? hex.replace(/[0-9a-f]/gi, "$&$&") : hex;
    return [1, 3, 5].map((i) => Number.parseInt(h.slice(i, i + 2), 16));
  };
  const [ra, ga, ba] = parse(a);
  const [rb, gb, bb] = parse(b);
  const c = (x: number, y: number) =>
    Math.round(x * share + y * (1 - share))
      .toString(16)
      .padStart(2, "0");
  return `#${c(ra, rb)}${c(ga, gb)}${c(ba, bb)}`;
};

/** The canvas behind the stage, the screen around it (AroundStage). */
const Around = createContext<RefObject<HTMLCanvasElement | null> | null>(null);

/**
 * Behind the stage, the whole screen: where the slide at rest floats on
 * past the stage's edges (floaties.ts) – nothing cut off there.
 */
export const AroundStage = ({ children }: { children: ReactNode }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  return (
    <Around.Provider value={ref}>
      <canvas
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full"
        ref={ref}
        style={{ opacity: 0 }}
      />
      {children}
    </Around.Provider>
  );
};

const Floaties = ({ look }: { look: ThemeLook }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const { accent, bg, text } = look;
  // Started once the slide is still (moving.ts), then kept – and faded in.
  const moving = useContext(SlideMoving);
  const [go, setGo] = useState(false);
  useEffect(() => {
    if (!moving) setGo(true);
  }, [moving]);
  useEffect(() => {
    const canvas = ref.current;
    if (!(canvas && go)) return;
    let made: FloatHandle | null = null;
    let on = true;
    import("./floaties").then(({ floatInto }) => {
      if (!on) return;
      made = floatInto(canvas, [
        accent,
        hexMix(accent, "#ffffff", 0.55),
        hexMix(text, bg, 0.3),
        hexMix(accent, bg, 0.5),
      ]);
      setHandle(made);
    });
    return () => {
      on = false;
      made?.stop();
      setHandle(null);
    };
  }, [accent, bg, text, go]);
  // At rest, on past the stage's edges too; moving, inside it only.
  const around = useContext(Around);
  const [handle, setHandle] = useState<FloatHandle | null>(null);
  useEffect(() => {
    if (!handle) return;
    handle.around(moving ? null : (around?.current ?? null));
  }, [handle, moving, around]);
  return (
    <canvas
      aria-hidden
      className="absolute inset-0 size-full transition-opacity duration-700"
      ref={ref}
      style={{ opacity: go ? 1 : 0 }}
    />
  );
};

/**
 * What lies behind a slide (or the card page): its theme's color and
 * background – lines, dots, floaties, a picture or video – and the grain.
 */
export const SlideBackground = ({
  look,
  className,
}: {
  look: ThemeLook;
  className?: string;
}) => {
  const line = mix(look.text, "transparent", 0.16);
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
      style={{ background: look.bg }}
    >
      {look.background === "lines" && (
        <>
          <i
            className="absolute inset-y-0 left-[1.6%] w-px origin-top animate-[draw-y_0.9s_var(--ease-soft)_both]"
            style={{ background: line }}
          />
          <i
            className="absolute inset-y-0 right-[1.6%] w-px origin-bottom animate-[draw-y_0.9s_var(--ease-soft)_0.1s_both]"
            style={{ background: line }}
          />
          <i
            className="absolute inset-x-0 top-[6.5%] h-px origin-left animate-[draw-x_0.9s_var(--ease-soft)_0.15s_both]"
            style={{ background: line }}
          />
          <i
            className="absolute inset-x-[1.6%] bottom-[2.2%] h-px origin-right animate-[draw-x_0.9s_var(--ease-soft)_0.25s_both]"
            style={{
              backgroundImage: `repeating-linear-gradient(90deg, ${line} 0 6px, transparent 6px 12px)`,
            }}
          />
        </>
      )}
      {look.background === "dots" && (
        <i
          className="absolute -inset-[10%] animate-[dots-drift_24s_linear_infinite]"
          style={{
            backgroundImage: `radial-gradient(${mix(look.text, "transparent", 0.22)} 0.16cqw, transparent 0.2cqw)`,
            backgroundSize: "2.4cqw 2.4cqw",
          }}
        />
      )}
      {look.background === "floaties" && <Floaties look={look} />}
      {look.background === "picture" &&
        look.picture &&
        (look.picture.video ? (
          <video
            autoPlay
            className="absolute inset-0 size-full object-cover"
            loop
            muted
            playsInline
            src={look.picture.src}
          />
        ) : (
          <img
            alt=""
            className="absolute inset-0 size-full object-cover"
            src={look.picture.src}
          />
        ))}
      {look.grain && <i className="grain absolute inset-0" />}
    </div>
  );
};
