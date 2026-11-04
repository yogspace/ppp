"use client";

import { AnimatePresence, m } from "motion/react";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { MotionProvider } from "@/components/motion";
import { SlideBackground } from "@/features/backdrop/slide-background";
import { EnterDelay, useFit, Words } from "@/features/player/enter";
import type { CardData } from "@/features/player/types";
import { StickerLayer } from "@/features/stickers/sticker-layer";
import { StickerStage } from "@/features/stickers/sticker-stage";
import { useArrange } from "@/features/stickers/use-arrange";
import { lookVars } from "@/features/themes/theme";
import { cn } from "@/lib/cn";
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

/**
 * A greeting card's page – mobile first, one screen. An envelope lies there,
 * addressed and stamped; a tap and it turns over, the seal pops off, the
 * card slides out. Its front: big words and stickers to throw around. A tap
 * folds it open – upwards, made for a phone held upright: “Dear …,” on the
 * inside of the cover, the message below, signed.
 */
export const CardPage = ({
  card,
  canArrange,
}: {
  card: CardData;
  canArrange: boolean;
}) => {
  const { look } = card;
  const [phase, setPhase] = useState<Phase>("sealed");
  const [opens, setOpens] = useState(0);
  const [arranging, setArranging] = useState(false);
  const { arrangement, arrange, state } = useArrange(
    "cards",
    card.id,
    card.arrangement
  );
  const headline = useFit(`${card.headline}-${phase === "sealed"}`, {
    max: 30,
  });
  const message = useFit(`${card.message}-${opens}`, { max: 9, wrap: true });
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (!canArrange) return;
    const key = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "e" || event.key === "E") setArranging((a) => !a);
      if (event.key === "Escape") setArranging(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [canArrange]);

  const openEnvelope = () => {
    if (phase !== "sealed") return;
    setPhase("opening");
    timer.current = window.setTimeout(() => setPhase("out"), OPENING);
  };

  const fold = () => {
    if (arranging) return;
    if (phase === "out") {
      setPhase("open");
      setOpens((n) => n + 1);
    } else if (phase === "open") {
      setPhase("out");
    }
  };

  const open = phase === "open";
  const inEnvelope = phase === "sealed" || phase === "opening";

  return (
    <MotionProvider>
      <StickerStage>
        <main
          className="slide fixed inset-0 grid place-items-center overflow-hidden select-none"
          data-font={look.font}
          style={{ ...lookVars(look), color: look.text }}
        >
          <SlideBackground
            className="[container-type:inline-size]"
            look={look}
          />

          {/* The desk: room for the card folded open (two panels, one
              above the other); closed, it sits in the lower half, moved up
              to the middle. Everything in it in cqw of the card's width. */}
          <m.div
            animate={{ y: open ? "0%" : "-25%" }}
            className="relative aspect-[2/3] w-[min(86vw,52dvh)] [container-type:inline-size]"
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
                  posted={card.posted}
                  stamp={card.stamp}
                  to={card.to}
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

            {/* The card: in the envelope, between its back and its pocket;
                out, on top. */}
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
                    : { y: "0%", scale: 1, opacity: 1, zIndex: 60 }
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
                        <Words gap={0.025} text={card.message} />
                      </EnterDelay.Provider>
                    </p>
                  )}
                </div>
                {card.from && open && (
                  <div className="text-right">
                    <m.p
                      animate={{ opacity: 1, y: 0 }}
                      className="headline text-[9cqw] normal-case"
                      initial={{ opacity: 0, y: 10 }}
                      transition={{ delay: 1.3 }}
                    >
                      {card.from}
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
                    {card.headline && phase !== "sealed" && (
                      <div
                        className="headline w-max text-center whitespace-pre"
                        ref={headline.ref}
                        style={{ fontSize: headline.fontSize }}
                      >
                        <Words
                          delay={phase === "opening" ? 1.9 : 0}
                          text={card.headline}
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
                    onArrange={canArrange ? arrange : undefined}
                    size={0.24}
                    stickers={card.stickers}
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
                    Dear {card.to || "you"},
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
                className="pointer-events-none fixed bottom-[max(1.6rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 font-sans text-sm font-semibold"
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
        </main>

        {canArrange && phase !== "sealed" && (
          <button
            aria-pressed={arranging}
            className={cn(
              "fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 rounded-full bg-neutral-950/80 px-4 py-3 font-sans text-sm text-white shadow-lg backdrop-blur transition-[scale] duration-200 ease-spring active:scale-90",
              arranging && "bg-white text-neutral-950"
            )}
            onClick={() => {
              setArranging((a) => !a);
              if (phase === "open") setPhase("out");
            }}
            type="button"
          >
            {arranging
              ? state === "saving"
                ? "Saving…"
                : state === "failed"
                  ? "Couldn't save ✗"
                  : "Done ✓"
              : "Arrange stickers"}
          </button>
        )}
      </StickerStage>
    </MotionProvider>
  );
};
