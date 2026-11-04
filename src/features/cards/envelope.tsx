"use client";

import { m } from "motion/react";
import type { CSSProperties } from "react";
import type { Picture } from "@/features/media/picture";
import type { ThemeLook } from "@/features/themes/theme";

/**
 * The envelope a card arrives in – its parts, each a layer of its own, so
 * the card can lie between them: the back (with its lining), the pocket
 * (the side and bottom flaps), the top flap, the seal; and the front with
 * the address, the stamp and the postmark.
 *
 * Opening (one tap, card-page.tsx): the front turns over to the back, the
 * seal pops off, the flap swings open, the card slides out, the envelope
 * drops away.
 */

export type Phase = "sealed" | "opening" | "out" | "open";

/** Where the envelope lies on the desk (cqw of the card's width). */
export const ENVELOPE = {
  left: "-3cqw",
  top: "71cqw",
  width: "106cqw",
  height: "83cqw",
} as const;

/** The paper a shade darker – the inside, the flaps' folds. */
const shade = (paper: string, ink: string, share: number) =>
  `color-mix(in oklab, ${paper} ${100 - share}%, ${ink})`;

const airmail = (look: ThemeLook) =>
  `repeating-linear-gradient(135deg, ${look.accent} 0 3cqw, ${look.paper} 3cqw 6cqw, ${look.paperText} 6cqw 9cqw, ${look.paper} 9cqw 12cqw)`;

/** The back's layers turn in once the front has turned away. */
const turnIn = { duration: 0.44, times: [0, 0.5, 1] };

/** The envelope drops away once the card is out. */
const drop = { delay: 1.75, duration: 0.7, ease: [0.5, 0, 0.75, 0] } as const;

const gone = (phase: Phase) => phase === "opening";

const backLayer = (phase: Phase) => ({
  scaleX: phase === "sealed" ? 0 : [0, 0, 1],
  y: gone(phase) ? "150%" : "0%",
  rotate: gone(phase) ? 9 : 0,
  opacity: gone(phase) ? 0 : 1,
});

const backTransition = {
  scaleX: turnIn,
  y: drop,
  rotate: drop,
  opacity: { ...drop, duration: 0.5, delay: 2 },
};

const BITE = "radial-gradient(circle at center, #0000 0.62cqw, #000 0.68cqw)";

/** Bites along each edge, a solid middle – stamp paper. */
const PERFORATION = [
  `${BITE} -1cqw -1cqw / 2cqw 2cqw repeat-x`,
  `${BITE} -1cqw calc(100% + 1cqw) / 2cqw 2cqw repeat-x`,
  `${BITE} -1cqw -1cqw / 2cqw 2cqw repeat-y`,
  `${BITE} calc(100% + 1cqw) -1cqw / 2cqw 2cqw repeat-y`,
  "linear-gradient(#000 0 0) center / calc(100% - 2cqw) calc(100% - 2cqw) no-repeat",
].join(", ");

/** A stamp: the picture on white with a perforated edge, a little turned. */
const Stamp = ({
  picture,
  look,
}: {
  picture: Picture | null;
  look: ThemeLook;
}) => (
  <span
    className="absolute top-[6cqw] right-[6cqw] block w-[19cqw] rotate-[4deg] bg-white p-[1.6cqw] drop-shadow-[0_0.4cqw_0.5cqw_rgb(0_0_0/0.18)]"
    style={{
      aspectRatio: "4 / 5",
      // The perforation: round bites along all four edges (a dotted ring
      // of holes, repeated along each side), the middle whole.
      mask: PERFORATION,
      WebkitMask: PERFORATION,
    }}
  >
    <span
      className="grid size-full place-items-center overflow-hidden"
      style={{ background: shade(look.paper, look.accent, 18) }}
    >
      {picture ? (
        <img
          alt=""
          className="size-[86%] object-contain"
          draggable={false}
          src={picture.src}
        />
      ) : (
        <span
          className="text-[9cqw] leading-none"
          style={{ color: look.accent }}
        >
          ♥
        </span>
      )}
    </span>
  </span>
);

/** The postmark: two rings with the date, and its wavy lines. */
const Postmark = ({ date, ink }: { date: string; ink: string }) => (
  <svg
    aria-hidden
    className="absolute top-[9cqw] right-[17cqw] w-[30cqw] -rotate-[14deg] opacity-55"
    fill="none"
    stroke={ink}
    viewBox="0 0 140 70"
  >
    <circle cx="35" cy="35" r="30" strokeWidth="2" />
    <circle cx="35" cy="35" r="22" strokeWidth="1.2" />
    <path d="M35 8 A27 27 0 0 1 35 62" id="postmark-ring" stroke="none" />
    <text
      fill={ink}
      fontFamily="ui-monospace, monospace"
      fontSize="6.4"
      fontWeight="700"
      letterSpacing="1.2"
      stroke="none"
    >
      <textPath href="#postmark-ring">PPP MAIL ★</textPath>
    </text>
    <text
      fill={ink}
      fontFamily="ui-monospace, monospace"
      fontSize="6"
      fontWeight="700"
      stroke="none"
      textAnchor="middle"
      x="35"
      y="37"
    >
      {date}
    </text>
    {[22, 31, 40, 49].map((y) => (
      <path
        d={`M68 ${y} q8 -5 16 0 t16 0 t16 0 t16 0`}
        key={y}
        strokeWidth="2"
      />
    ))}
  </svg>
);

/** The envelope's front: airmail stripes, stamp, postmark, the address. */
export const EnvelopeFront = ({
  phase,
  look,
  to,
  stamp,
  posted,
}: {
  phase: Phase;
  look: ThemeLook;
  to: string;
  stamp: Picture | null;
  posted: string;
}) => (
  <m.div
    animate={
      phase === "sealed"
        ? { scaleX: 1, y: "0%", rotate: -3, opacity: 1 }
        : { scaleX: 0, y: "0%", rotate: -3, opacity: 1 }
    }
    className="absolute z-50"
    initial={{ scaleX: 1, rotate: -16, y: "-40%", opacity: 0 }}
    style={ENVELOPE}
    transition={
      phase === "sealed"
        ? {
            default: {
              type: "spring",
              stiffness: 170,
              damping: 14,
              delay: 0.2,
            },
            opacity: { duration: 0.25, delay: 0.2 },
          }
        : { duration: 0.22, ease: "easeIn" }
    }
  >
    {/* Now and then it hops and wiggles – open me! */}
    <m.div
      animate={
        phase === "sealed"
          ? {
              y: ["0%", "-9%", "0%", "-3%", "0%"],
              rotate: [0, -3.5, 2.5, -1, 0],
              scale: [1, 1.04, 0.99, 1.01, 1],
            }
          : { y: "0%", rotate: 0, scale: 1 }
      }
      className="absolute inset-0 rounded-[2.4cqw] p-[2.2cqw] shadow-[0_1.4cqw_3cqw_-1cqw_rgb(4_8_60/0.45)]"
      style={{ background: airmail(look) }}
      transition={
        phase === "sealed"
          ? {
              duration: 0.8,
              times: [0, 0.3, 0.55, 0.78, 1],
              ease: "easeInOut",
              repeat: Number.POSITIVE_INFINITY,
              repeatDelay: 2.4,
              delay: 1.6,
            }
          : { duration: 0 }
      }
    >
      <div
        className="relative size-full rounded-[1.2cqw]"
        style={{ background: look.paper, color: look.paperText }}
      >
        <Stamp look={look} picture={stamp} />
        <Postmark date={posted} ink={look.paperText} />
        <div className="absolute inset-x-[10cqw] bottom-[13cqw] text-left">
          <p className="headline text-[11cqw]">
            {to ? `For ${to}` : "For you"}
          </p>
          <i
            className="mt-[2cqw] block h-[0.4cqw] w-[70%] rounded-full opacity-25"
            style={{ background: look.paperText }}
          />
          <i
            className="mt-[3.4cqw] block h-[0.4cqw] w-[50%] rounded-full opacity-25"
            style={{ background: look.paperText }}
          />
        </div>
      </div>
    </m.div>
  </m.div>
);

/** The back panel – inside it the lining, seen once the flap is open. */
export const EnvelopeBack = ({
  phase,
  look,
}: {
  phase: Phase;
  look: ThemeLook;
}) => (
  <m.div
    animate={backLayer(phase)}
    className="absolute z-10 overflow-hidden rounded-[2.4cqw]"
    initial={false}
    style={{
      ...ENVELOPE,
      background: shade(look.paper, look.paperText, 10),
    }}
    transition={backTransition}
  >
    <i
      className="absolute inset-x-[4cqw] top-0 block h-[55%] rounded-b-[2cqw] opacity-70"
      style={{ background: airmail(look) }}
    />
  </m.div>
);

/** The pocket: side flaps and bottom flap, over the card inside. */
export const EnvelopePocket = ({
  phase,
  look,
}: {
  phase: Phase;
  look: ThemeLook;
}) => (
  <m.div
    animate={backLayer(phase)}
    className="pointer-events-none absolute z-30 drop-shadow-[0_-0.4cqw_0.6cqw_rgb(0_0_0/0.12)]"
    initial={false}
    style={ENVELOPE}
    transition={backTransition}
  >
    <i
      className="absolute inset-0 block rounded-[2.4cqw]"
      style={{
        background: look.paper,
        clipPath: "polygon(0 0, 50% 54%, 100% 0, 100% 100%, 0 100%)",
      }}
    />
    <i
      className="absolute inset-0 block rounded-[2.4cqw]"
      style={{
        background: shade(look.paper, look.paperText, 5),
        clipPath: "polygon(0 100%, 50% 50%, 100% 100%)",
      }}
    />
  </m.div>
);

/** The top flap – sealed, it closes the envelope; it swings up, behind. */
export const EnvelopeFlap = ({
  phase,
  look,
}: {
  phase: Phase;
  look: ThemeLook;
}) => {
  const opening = phase === "opening";
  return (
    <m.div
      animate={{
        ...backLayer(phase),
        rotateX: opening ? 180 : 0,
        zIndex: opening ? 5 : 40,
      }}
      className="pointer-events-none absolute origin-top"
      initial={false}
      style={{ ...ENVELOPE, transformPerspective: 900 } as CSSProperties}
      transition={{
        ...backTransition,
        rotateX: { delay: 0.7, duration: 0.5, ease: [0.4, 0, 0.2, 1] },
        zIndex: { delay: 0.95, duration: 0 },
      }}
    >
      <i
        className="absolute inset-0 block rounded-[2.4cqw] drop-shadow-[0_0.5cqw_0.6cqw_rgb(0_0_0/0.15)]"
        style={{
          background: shade(look.paper, look.paperText, 3),
          clipPath: "polygon(0 0, 100% 0, 50% 60%)",
        }}
      />
      {/* The seal on the flap's tip – it pops off first. */}
      <m.i
        animate={
          opening
            ? {
                scale: [1, 1.35, 0],
                rotate: [0, -20, 50],
                y: ["0%", "-30%", "-160%"],
              }
            : { scale: 1, rotate: 0, y: "0%" }
        }
        className="absolute top-[52%] left-1/2 -mt-[6cqw] -ml-[6cqw] grid size-[12cqw] place-items-center rounded-full border-[0.9cqw] border-white text-[6cqw] leading-none text-white shadow-[0_0.6cqw_1cqw_rgb(0_0_0/0.25)]"
        initial={false}
        style={{ background: look.accent }}
        transition={{ delay: 0.45, duration: 0.35 }}
      >
        ♥
      </m.i>
    </m.div>
  );
};
