"use client";

import { m } from "motion/react";
import type { CSSProperties } from "react";
import type { ThemeLook } from "@/features/themes/theme";
import type { Move } from "./frames";
import { specOf } from "./frames";

const CONFETTI_COLORS = [
  "#ff5fa8",
  "#ffffff",
  "#ffc31f",
  "#ff6a1f",
  "#5fb36b",
  "#a9b6ff",
];

/** A gooey blob in the new slide's accent: it swells over, then shrinks off. */
const Blob = ({ look, duration }: { look: ThemeLook; duration: number }) => (
  <>
    {[0, 1, 2].map((i) => (
      <m.i
        animate={{
          scale: [0, 1, 1, 0],
          rotate: [0, 70, 110, 190],
          borderRadius: [
            "42% 58% 70% 30% / 45% 45% 55% 55%",
            "60% 40% 30% 70% / 60% 30% 70% 40%",
            "40% 60% 55% 45% / 50% 60% 40% 50%",
            "70% 30% 40% 60% / 35% 55% 45% 65%",
          ],
        }}
        className="absolute top-1/2 left-1/2 block"
        initial={{ scale: 0 }}
        key={i}
        style={{
          width: `${[190, 60, 34][i]}cqw`,
          height: `${[190, 60, 34][i]}cqw`,
          marginLeft: `${-[95, 30, 17][i] + [0, 46, -50][i]}cqw`,
          marginTop: `${-[95, 30, 17][i] + [0, -22, 18][i]}cqw`,
          background: i === 1 ? look.paper : look.accent,
        }}
        transition={{
          duration: duration - i * 0.08,
          delay: i * 0.05,
          times: [0, 0.42, 0.52, 1],
          ease: [0.65, 0, 0.35, 1],
        }}
      />
    ))}
  </>
);

/** A burst of confetti from the middle, falling as it fades. */
const Confetti = () => (
  <>
    {Array.from({ length: 70 }, (_, i) => {
      const angle = (i / 70) * 360 + ((i * 37) % 17) - 8;
      return (
        <i
          className="absolute top-1/2 left-1/2 block h-[calc(1cqw*var(--size))] w-[calc(2.4cqw*var(--size))] animate-[confetti_1.8s_cubic-bezier(0.12,0.7,0.3,1)_var(--delay)_both] rounded-[0.4cqw] bg-(--color)"
          key={angle}
          style={
            {
              "--angle": `${angle}deg`,
              "--color": CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              "--reach": `${30 + ((i * 53) % 46)}cqw`,
              "--delay": `${((i * 29) % 10) * 0.015}s`,
              "--size": 0.8 + ((i * 31) % 7) / 10,
            } as CSSProperties
          }
        />
      );
    })}
  </>
);

/** A theatre curtain in the accent: closes, the slide changes, opens. */
const Curtain = ({ look, duration }: { look: ThemeLook; duration: number }) => {
  const fabric = `repeating-linear-gradient(90deg, color-mix(in oklab, ${look.accent} 82%, black) 0 1.2cqw, ${look.accent} 2.6cqw, color-mix(in oklab, ${look.accent} 88%, white) 3.4cqw, ${look.accent} 4.2cqw, color-mix(in oklab, ${look.accent} 82%, black) 5.6cqw)`;
  const sides = [
    { side: "left", x: ["-102%", "0%", "0%", "-102%"] },
    { side: "right", x: ["102%", "0%", "0%", "102%"] },
  ] as const;
  return (
    <>
      {sides.map(({ side, x }) => (
        <m.i
          animate={{
            x: [...x],
            skewX: side === "left" ? [0, -2, 0, 3] : [0, 2, 0, -3],
          }}
          className="absolute inset-y-0 block w-[52%] shadow-[0_0_4cqw_rgb(0_0_0/0.35)]"
          initial={{ x: x[0] }}
          key={side}
          style={{ [side]: 0, backgroundImage: fabric }}
          transition={{
            duration,
            times: [0, 0.4, 0.55, 1],
            ease: [0.7, 0, 0.3, 1],
          }}
        />
      ))}
      <m.i
        animate={{ y: ["-100%", "0%", "0%", "-100%"] }}
        className="absolute inset-x-0 top-0 block h-[11%] rounded-b-[50%_30%]"
        initial={{ y: "-100%" }}
        style={{
          backgroundImage: fabric,
          filter: "brightness(0.85)",
        }}
        transition={{ duration, times: [0, 0.3, 0.7, 1] }}
      />
    </>
  );
};

/**
 * What covers a change of slides, for the transitions that have one –
 * drawn over the stage, gone once the new slide is there.
 */
export const TransitionCover = ({
  move,
  look,
}: {
  move: Move;
  look: ThemeLook;
}) => {
  const cover = specOf(move.kind).cover;
  if (!cover) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-40 overflow-hidden"
    >
      {move.kind === "blob" && <Blob duration={cover.duration} look={look} />}
      {move.kind === "confetti" && <Confetti />}
      {move.kind === "curtain" && (
        <Curtain duration={cover.duration} look={look} />
      )}
    </div>
  );
};
