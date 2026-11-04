"use client";

import { AnimatePresence, m } from "motion/react";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { EnterDelay, useFit, Words } from "@/features/player/enter";
import type { SlideData } from "@/features/player/types";
import type { Arrangement, Placement } from "@/features/stickers/arrangement";
import { StickerLayer } from "@/features/stickers/sticker-layer";
import {
  EnvelopeBack,
  EnvelopeFlap,
  EnvelopeFront,
  EnvelopePocket,
  type Phase,
} from "./envelope";

/** How long the envelope takes to open, until the card is out (ms). */
const OPENING = 2450;

const CONFETTI = [
  "#ff5fa8",
  "#ffffff",
  "#ffc31f",
  "#ff6a1f",
  "#5fb36b",
  "#a9b6ff",
];

/** Paper confetti bursting from the card as it folds open. */
const Burst = () =>
  Array.from({ length: 46 }, (_, i) => {
    const angle = (i / 46) * 360 + ((i * 37) % 17) - 8;
    return (
      <i
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 z-[70] block h-[calc(1.6cqw*var(--size))] w-[calc(3.6cqw*var(--size))] animate-[confetti_1.9s_cubic-bezier(0.12,0.7,0.3,1)_var(--delay)_both] rounded-[0.5cqw] bg-(--color)"
        key={angle}
        style={
          {
            "--angle": `${angle}deg`,
            "--color": CONFETTI[i % CONFETTI.length],
            "--reach": `${48 + ((i * 53) % 40)}cqw`,
            "--delay": `${0.25 + ((i * 29) % 10) * 0.015}s`,
            "--size": 0.8 + ((i * 31) % 7) / 10,
          } as CSSProperties
        }
      />
    );
  });

/** A signature's swash, drawn under the name. */
const Swash = ({ color }: { color: string }) => (
  <svg
    aria-hidden
    className="mt-[-1cqw] ml-auto block w-[38cqw]"
    fill="none"
    viewBox="0 0 160 30"
  >
    <m.path
      animate={{ pathLength: 1 }}
      d="M4 18 C30 4 52 28 78 16 S128 2 156 14"
      initial={{ pathLength: 0 }}
      stroke={color}
      strokeLinecap="round"
      strokeWidth="5"
      transition={{ duration: 0.9, delay: 1.6, ease: "easeInOut" }}
    />
  </svg>
);

type Props = {
  slide: Extract<SlideData, { design: "card" }>;
  arrangement: Arrangement;
  arranging: boolean;
  onArrange?: (id: string, placement: Placement | null) => void;
  /**
   * The deck's steps on this slide (steps.ts): 0 sealed, 1 out of its
   * envelope, 2 folded open. A tap is the next step; ← goes a step back.
   */
  step: number;
  onStep: () => void;
};

/**
 * The Card design: an envelope lies on the slide, addressed and stamped; a
 * tap and it turns over, the seal pops off, the card slides out. Its front:
 * big words and the slide's stickers, to throw around. A tap folds it open
 * – upwards, made for a phone held upright: “Dear …,” on the inside of the
 * cover, the message below, signed. Every part in cqw of the card's width.
 */
export const CardSlide = ({
  slide,
  arrangement,
  arranging,
  onArrange,
  step,
  onStep,
}: Props) => {
  const look = slide.look;
  // Back here having seen it (step 2): open at once, no envelope.
  const [phase, setPhase] = useState<Phase>(
    step >= 2 ? "open" : step === 1 ? "out" : "sealed"
  );
  const [opens, setOpens] = useState(0);
  const headline = useFit(`${slide.headline}-${phase === "sealed"}`, {
    max: 30,
  });
  const message = useFit(`${slide.message}-${opens}`, { max: 9, wrap: true });
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // The phase follows the deck's step: on – the envelope opens (its show
  // first), the card folds open; back – it folds shut, back in its envelope.
  useEffect(() => {
    window.clearTimeout(timer.current);
    setPhase((current) => {
      if (step >= 2) {
        if (current !== "open") setOpens((n) => n + 1);
        return "open";
      }
      if (step === 1) {
        if (current === "sealed") {
          timer.current = window.setTimeout(() => setPhase("out"), OPENING);
          return "opening";
        }
        return current === "opening" ? current : "out";
      }
      return "sealed";
    });
  }, [step]);

  const openEnvelope = () => {
    if (phase === "sealed") onStep();
  };

  const fold = () => {
    if (!arranging && phase === "out") onStep();
  };

  // Arranging: the card lies shut, its front up.
  useEffect(() => {
    if (arranging) setPhase((p) => (p === "open" ? "out" : p));
  }, [arranging]);

  const open = phase === "open";
  const inEnvelope = phase === "sealed" || phase === "opening";

  return (
    <div className="absolute inset-0 grid place-items-center">
      {/* The desk: room for the card folded open (two panels, one above the
          other); closed, it sits in the lower half, moved up to the middle. */}
      <m.div
        animate={{ y: open ? "0%" : "-25%" }}
        className="relative aspect-[2/3] w-[min(78cqw,57cqh)] [container-type:inline-size]"
        initial={false}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
      >
        {inEnvelope && (
          <>
            <EnvelopeBack look={look} phase={phase} />
            <EnvelopePocket look={look} phase={phase} />
            <EnvelopeFlap look={look} phase={phase} />
            <EnvelopeFront
              look={look}
              phase={phase}
              posted={slide.posted}
              stamp={slide.stamp}
              to={slide.to}
            />
            {phase === "sealed" && (
              <button
                aria-label="Open the envelope"
                className="absolute top-[71cqw] left-[-3cqw] z-[80] h-[83cqw] w-[106cqw] cursor-pointer rounded-[2.4cqw] focus-visible:outline-3 focus-visible:outline-current focus-visible:outline-offset-4"
                onClick={openEnvelope}
                type="button"
              />
            )}
          </>
        )}

        {/* The card: in the envelope, between its back and its pocket; out,
            on top. */}
        <m.div
          animate={
            phase === "sealed"
              ? { y: "0%", scale: 0.9, opacity: 0, zIndex: 20 }
              : phase === "opening"
                ? {
                    y: ["0%", "0%", "-88%", "-88%", "0%"],
                    scale: [0.9, 0.9, 0.9, 0.9, 1],
                    opacity: [0, 1, 1, 1, 1],
                    zIndex: [20, 20, 20, 60, 60],
                  }
                : phase === "out" && !arranging
                  ? // Out and shut: now and then it hops forward – open me!
                    {
                      y: ["0%", "-7%", "0%", "-2.5%", "0%"],
                      scale: [1, 1.07, 0.99, 1.025, 1],
                      rotate: [0, -2.5, 1.5, -0.5, 0],
                      opacity: 1,
                      zIndex: 60,
                    }
                  : { y: "0%", scale: 1, rotate: 0, opacity: 1, zIndex: 60 }
          }
          className="absolute inset-x-0 top-[75cqw] h-[75cqw] perspective-[260cqw]"
          initial={false}
          transition={
            phase === "opening"
              ? {
                  duration: OPENING / 1000,
                  times: [0, 0.18, 0.62, 0.7, 1],
                  ease: "easeInOut",
                }
              : phase === "out" && !arranging
                ? {
                    duration: 0.85,
                    ease: "easeInOut",
                    times: [0, 0.3, 0.55, 0.78, 1],
                    repeat: Number.POSITIVE_INFINITY,
                    repeatDelay: 2.2,
                    delay: 1.4,
                    opacity: { duration: 0 },
                    zIndex: { duration: 0 },
                  }
                : { type: "spring", stiffness: 160, damping: 18 }
          }
        >
          {/* Inside: the message, signed. */}
          <div
            className="absolute inset-0 flex flex-col rounded-[3cqw] p-[8cqw] pb-[6cqw] text-left"
            style={{ background: look.paper, color: look.paperText }}
          >
            <div className="flex min-h-0 flex-1 items-center">
              {open && (
                <p
                  className="copy w-full"
                  key={opens}
                  ref={message.ref}
                  style={{ fontSize: message.fontSize, lineHeight: 1.3 }}
                >
                  <EnterDelay.Provider value={0.55}>
                    <Words gap={0.025} text={slide.message} />
                  </EnterDelay.Provider>
                </p>
              )}
            </div>
            {slide.from && open && (
              <div className="text-right">
                <m.p
                  animate={{ opacity: 1, y: 0 }}
                  className="headline text-[9cqw] normal-case"
                  initial={{ opacity: 0, y: 10 }}
                  transition={{ delay: 1.3 }}
                >
                  {slide.from}
                </m.p>
                <Swash color={look.accent} />
              </div>
            )}
            {open && (
              <button
                aria-label="Fold the card shut"
                className="absolute inset-0 cursor-pointer rounded-[inherit]"
                onClick={fold}
                type="button"
              />
            )}
          </div>

          {/* The cover, hinged at its top edge: it folds up and over. */}
          <m.div
            animate={{ rotateX: open ? 180 : 0 }}
            className="absolute inset-0 origin-top transform-3d"
            initial={false}
            transition={{ type: "spring", stiffness: 90, damping: 14 }}
          >
            <div
              className="absolute inset-0 rounded-[3cqw] shadow-[0_0.8rem_1.6rem_-0.6rem_rgb(4_8_60/0.45)] backface-hidden"
              style={{ background: look.paper, color: look.paperText }}
            >
              <div className="absolute inset-[8cqw] flex items-center justify-center overflow-hidden">
                {slide.headline && phase !== "sealed" && (
                  <div
                    className="headline w-max text-center whitespace-pre"
                    ref={headline.ref}
                    style={{ fontSize: headline.fontSize }}
                  >
                    <Words
                      delay={phase === "opening" ? 1.9 : 0}
                      text={slide.headline}
                    />
                  </div>
                )}
              </div>
              {phase === "out" && (
                <button
                  aria-label="Fold the card open"
                  className="absolute inset-0 z-10 cursor-pointer rounded-[inherit] focus-visible:outline-3 focus-visible:outline-current focus-visible:outline-offset-4"
                  onClick={fold}
                  type="button"
                />
              )}
              <StickerLayer
                arrangement={arrangement}
                arranging={arranging}
                delay={0.2}
                hidden={phase !== "out"}
                onArrange={onArrange}
                size={0.24}
                stickers={slide.stickers}
              />
            </div>
            {/* The cover's inside: seen once it is folded up. */}
            <div
              className="absolute inset-0 flex transform-[rotateX(180deg)] flex-col justify-end rounded-[3cqw] p-[8cqw] text-left backface-hidden"
              style={{
                background: `radial-gradient(color-mix(in oklab, ${look.accent} 30%, transparent) 0.5cqw, transparent 0.6cqw) 0 0 / 5cqw 5cqw, ${look.paper}`,
                color: look.paperText,
              }}
            >
              <p className="headline text-[12cqw] normal-case">
                Dear {slide.to || "you"},
              </p>
              {open && (
                <button
                  aria-label="Fold the card shut"
                  className="absolute inset-0 cursor-pointer rounded-[inherit]"
                  onClick={fold}
                  type="button"
                />
              )}
            </div>
          </m.div>
          {open && <Burst key={opens} />}
        </m.div>
      </m.div>

      <AnimatePresence mode="wait">
        {(phase === "sealed" || phase === "out") && !arranging && (
          <m.p
            animate={{ opacity: 0.75, y: 0 }}
            className="pointer-events-none absolute bottom-[4cqmin] left-1/2 -translate-x-1/2 font-sans text-[max(13px,2cqmin)] font-semibold"
            exit={{ opacity: 0, y: 8 }}
            initial={{ opacity: 0, y: 8 }}
            key={phase}
            transition={{ delay: phase === "sealed" ? 1.2 : 0.6 }}
          >
            <span className="inline-block animate-[bob_1.6s_ease-in-out_infinite]">
              {phase === "sealed" ? "tap to open ✉︎" : "tap the card"}
            </span>
          </m.p>
        )}
      </AnimatePresence>
    </div>
  );
};
