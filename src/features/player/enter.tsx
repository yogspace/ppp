"use client";

import { m, type Variants } from "motion/react";
import {
  type CSSProperties,
  createContext,
  Fragment,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { scratchParts } from "@/features/scratch/parse";
import { Scratch } from "@/features/scratch/scratch";

/**
 * How a slide's things fly in: each with a spring, a little after the
 * transition brought the slide (`EnterDelay`), one after another.
 */

/** Seconds from the slide's arrival until its things may come. */
export const EnterDelay = createContext(0);

export const BOUNCY = { type: "spring", stiffness: 460, damping: 16 } as const;
export const SOFT = { type: "spring", stiffness: 300, damping: 26 } as const;

export type EnterKind = "drop" | "rise" | "pop" | "left" | "right" | "fade";

const VARIANTS: Record<EnterKind, Variants> = {
  drop: {
    hidden: { y: "-60%", rotate: -5, opacity: 0 },
    shown: { y: "0%", rotate: 0, opacity: 1 },
  },
  rise: {
    hidden: { y: "40%", opacity: 0 },
    shown: { y: "0%", opacity: 1 },
  },
  pop: {
    hidden: { scale: 0.2, rotate: -12, opacity: 0 },
    shown: { scale: 1, rotate: 0, opacity: 1 },
  },
  left: {
    hidden: { x: "-30%", rotate: -5, opacity: 0 },
    shown: { x: "0%", rotate: 0, opacity: 1 },
  },
  right: {
    hidden: { x: "30%", rotate: 5, opacity: 0 },
    shown: { x: "0%", rotate: 0, opacity: 1 },
  },
  fade: { hidden: { opacity: 0 }, shown: { opacity: 1 } },
};

type EnterProps = {
  kind?: EnterKind;
  /** Seconds after the slide's things may come. */
  delay?: number;
  /** False: hidden again (a click undone). */
  shown?: boolean;
  bouncy?: boolean;
  as?: "div" | "span" | "li";
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

/** Something on a slide that flies in. */
export const Enter = ({
  kind = "rise",
  delay = 0,
  shown = true,
  bouncy = false,
  as = "div",
  className,
  style,
  children,
}: EnterProps) => {
  const base = useContext(EnterDelay);
  const Tag = as === "span" ? m.span : as === "li" ? m.li : m.div;
  const wait = shown ? base + delay : 0;
  return (
    <Tag
      animate={shown ? "shown" : "hidden"}
      className={className}
      initial="hidden"
      style={style}
      transition={{
        default: { ...(bouncy ? BOUNCY : SOFT), delay: wait },
        opacity: { duration: 0.22, delay: wait },
      }}
      variants={VARIANTS[kind]}
    >
      {children}
    </Tag>
  );
};

/** A word's little tilt as it lands – the same every time. */
const tilt = (i: number) => ((i * 47) % 21) - 10;

/**
 * Words dropping in one after another, bouncing as they land – line breaks
 * kept, each line a line. `lineStyle` places a line (the stairs).
 */
export const Words = ({
  text,
  delay = 0,
  gap = 0.065,
  lineStyle,
}: {
  text: string;
  delay?: number;
  gap?: number;
  lineStyle?: (line: number) => CSSProperties | undefined;
}) => {
  const base = useContext(EnterDelay);
  let index = 0;
  return text
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .map((line, li) =>
      // An empty line: a little room between paragraphs.
      line ? (
        <span className="block" key={`${li}-${line}`} style={lineStyle?.(li)}>
          {/* Word by word – a secret (`||…||`) flies in as one, under foil. */}
          {scratchParts(line)
            .flatMap((part) =>
              part.secret
                ? [{ word: part.text, secret: true }]
                : part.text
                    .split(/\s+/)
                    .filter(Boolean)
                    .map((word) => ({ word, secret: false }))
            )
            .map(({ word, secret }, wi) => {
              const i = index++;
              return (
                <Fragment key={`${wi}-${word}`}>
                  {wi > 0 && " "}
                  <m.span
                    animate={{ y: "0em", rotate: 0, scale: 1, opacity: 1 }}
                    className="inline-block"
                    initial={{
                      y: "-0.7em",
                      rotate: tilt(i),
                      scale: 0.5,
                      opacity: 0,
                    }}
                    transition={{
                      default: { ...BOUNCY, delay: base + delay + i * gap },
                      opacity: {
                        duration: 0.15,
                        delay: base + delay + i * gap,
                      },
                    }}
                  >
                    {secret ? <Scratch>{word}</Scratch> : word}
                  </m.span>
                </Fragment>
              );
            })}
        </span>
      ) : (
        <span aria-hidden className="block h-[0.6em]" key={`gap-${li}`} />
      )
    );
};

/**
 * A font size (in cqw, so it scales with the slide) at which the element
 * fills its parent: as wide or as tall as there is room, whichever comes
 * first – `wrap` for text that may wrap: then only the height decides.
 * Measured again once the fonts are there.
 */
export const useFit = (
  key: unknown,
  { max = 18, min = 1.2, wrap = false } = {}
) => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<number>();
  // biome-ignore lint/correctness/useExhaustiveDependencies: new words (`key`), measured anew
  useLayoutEffect(() => {
    const el = ref.current;
    const box = el?.parentElement;
    if (!(el && box)) return;
    const measure = () => {
      const before = el.style.fontSize;
      const fits = (s: number) => {
        el.style.fontSize = `${s}cqw`;
        return (
          el.scrollHeight <= box.clientHeight + 0.5 &&
          el.scrollWidth <= box.clientWidth + 0.5
        );
      };
      let next: number;
      if (wrap) {
        let lo = min;
        let hi = max;
        for (let i = 0; i < 10; i++) {
          const mid = (lo + hi) / 2;
          if (fits(mid)) lo = mid;
          else hi = mid;
        }
        next = lo;
      } else {
        const probe = 10;
        el.style.fontSize = `${probe}cqw`;
        const scale = Math.min(
          box.clientWidth / (el.scrollWidth || 1),
          box.clientHeight / (el.scrollHeight || 1)
        );
        next = Math.max(min, Math.min(max, probe * scale * 0.97));
      }
      el.style.fontSize = before;
      setSize(next);
    };
    measure();
    let on = true;
    document.fonts?.ready.then(() => on && measure());
    return () => {
      on = false;
    };
  }, [key, max, min, wrap]);
  return { ref, fontSize: size === undefined ? undefined : `${size}cqw` };
};
