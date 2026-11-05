"use client";

import { m } from "motion/react";
import { type CSSProperties, useContext, useEffect, useState } from "react";
import { LinkSlide } from "@/features/link/link-slide";
import type { Picture } from "@/features/media/picture";
import { unmarked } from "@/features/scratch/parse";
import { ScratchText } from "@/features/scratch/scratch";
import { ScratchSlide } from "@/features/scratch/scratch-slide";
import { isDark } from "@/features/themes/theme";
import { cn } from "@/lib/cn";
import { Enter, EnterDelay, useFit, Words } from "./enter";
import { Rich } from "./rich";
import { useStageSize } from "./stage";
import type { SlideData } from "./types";

/**
 * A slide's words and pictures, by its design – in the stage's units
 * (cqmin: a 16:9 stage's cqw × 16/9), so a slide looks the same at any size
 * and grows its words on a phone held upright, where things stack (`tall`). The stickers lie over it
 * (slide-frame.tsx).
 */

/** A 16:9 stage's cqw in cqmin – the same there, larger when upright. */
const CQ = 16 / 9;

type Of<D extends SlideData["design"]> = Extract<SlideData, { design: D }>;

/** The stairs: how far each line steps in (em). */
const STAIRS = [0.7, 1.8, 0, 0.9, 2, 0.3];

const ALIGN = {
  center: "items-center text-center",
  left: "items-start text-left",
  right: "items-end text-right",
  stairs: "items-center text-left",
} as const;

const Poster = ({ slide }: { slide: Of<"poster"> }) => {
  const fit = useFit(`${slide.text}-${slide.align}`, { max: 22 });
  return (
    <div
      className={cn(
        "absolute inset-x-[10.667cqmin] inset-y-[9.778cqmin] flex flex-col justify-center",
        ALIGN[slide.align]
      )}
    >
      <div
        className="headline w-max whitespace-pre"
        ref={fit.ref}
        style={{ fontSize: fit.fontSize }}
      >
        <Words
          lineStyle={
            slide.align === "stairs"
              ? (line) => ({ paddingLeft: `${STAIRS[line % STAIRS.length]}em` })
              : undefined
          }
          text={slide.text}
        />
      </div>
    </div>
  );
};

const Pill = ({ text, accent }: { text: string; accent: string }) => (
  <Enter
    bouncy
    className="copy rounded-full px-[2.844cqmin] py-[0.978cqmin] text-[3.378cqmin] font-semibold"
    kind="pop"
    style={{
      background: accent,
      color: isDark(accent) ? "#ffffff" : "#111111",
    }}
  >
    <ScratchText text={text} />
  </Enter>
);

const Cover = ({ slide }: { slide: Of<"cover"> }) => {
  const fit = useFit(slide.title, { max: 14 });
  return (
    <div className="absolute inset-x-[12.444cqmin] inset-y-[10.667cqmin] flex flex-col items-center justify-center gap-[3.911cqmin] text-center">
      {slide.kicker && <Pill accent={slide.look.accent} text={slide.kicker} />}
      <div className="flex max-h-[53.333cqmin] min-h-0 w-full flex-1 items-center justify-center">
        <div
          className="headline w-max whitespace-pre"
          ref={fit.ref}
          style={{ fontSize: fit.fontSize }}
        >
          <Words delay={0.1} text={slide.title} />
        </div>
      </div>
      {slide.subtitle && (
        <Enter
          className="copy max-w-[106.667cqmin] text-[4.267cqmin] whitespace-pre-line opacity-75"
          delay={0.5}
        >
          <ScratchText text={slide.subtitle} />
        </Enter>
      )}
    </div>
  );
};

const Heading = ({ text, size = 5.4 }: { text: string; size?: number }) => (
  <h2 className="headline" style={{ fontSize: `${size * CQ}cqmin` }}>
    <Words gap={0.05} text={text} />
  </h2>
);

const WordsSlide = ({ slide }: { slide: Of<"words"> }) => (
  <div className="absolute inset-x-[14.222cqmin] inset-y-[10.667cqmin] flex flex-col justify-center gap-[4.622cqmin]">
    {slide.heading && <Heading text={slide.heading} />}
    {slide.body && (
      <Enter delay={0.3}>
        <Rich
          body={slide.body}
          className="copy rich max-w-[120.889cqmin] text-[4.444cqmin] tall:text-[5.4cqmin]"
        />
      </Enter>
    )}
  </div>
);

/**
 * A List's pictures: a pile of polaroids beside the list (above it on an
 * upright screen), always in the same place. It fades in with the first
 * point; the one on top is the point's that is on – with each point the top
 * one flies off, left or right, and the next lies there. Back to an earlier
 * point: they fly back onto the pile.
 */
const ListPictures = ({
  pictures,
  top,
  shown,
  delay,
}: {
  pictures: Picture[];
  /** Which one lies on top (the ones before it are gone). */
  top: number;
  shown: boolean;
  delay: number;
}) => {
  // One box for all, by the first: a tidy pile.
  const box = useFitBox(pictures[0], [0.36, 0.66], [0.8, 0.34]);
  return (
    <m.div
      animate={
        shown
          ? { opacity: 1, scale: 1, y: "0%" }
          : { opacity: 0, scale: 0.85, y: "6%" }
      }
      className="relative grid flex-none place-items-center"
      initial={{ opacity: 0, scale: 0.85, y: "6%" }}
      transition={{
        type: "spring",
        stiffness: 240,
        damping: 22,
        delay: shown ? delay : 0,
      }}
    >
      {pictures.map((picture, i) => {
        const depth = i - top;
        const side = i % 2 ? 1 : -1;
        const turn = side * (2.2 + ((i * 3) % 4) * 0.7);
        return (
          <m.figure
            animate={
              depth < 0
                ? {
                    x: `${-side * 55}cqmin`,
                    y: "-12%",
                    rotate: -side * 26,
                    scale: 0.92,
                    opacity: 0,
                  }
                : {
                    x: `${depth * side * 0.9}cqmin`,
                    y: `${depth * 1.1}cqmin`,
                    rotate: depth === 0 ? turn * 0.5 : turn,
                    scale: 1 - Math.min(depth, 4) * 0.035,
                    opacity: depth > 3 ? 0 : 1,
                  }
            }
            className="col-start-1 row-start-1 rounded-[1.067cqmin] bg-white p-[1.6cqmin] shadow-[0_2cqmin_5cqmin_-1.8cqmin_rgb(0_0_0/0.45)]"
            initial={false}
            key={`${i}-${picture.src}`}
            style={{ zIndex: pictures.length - i }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 24,
              opacity: { duration: 0.35 },
            }}
          >
            <Media
              className="block rounded-[0.4cqmin] object-cover"
              picture={picture}
              style={box}
            />
          </m.figure>
        );
      })}
    </m.div>
  );
};

/**
 * A List's pictures scattered: polaroids lying about beside the list (above
 * it on an upright screen), each flying in with its point. The point that
 * is on lights up its picture – to the front, bigger, straight, rimmed in
 * the accent – and a tap on a picture puts its point on.
 */
const ListScatter = ({
  pictures,
  on,
  shown,
  delay,
  onPick,
}: {
  pictures: { picture: Picture; index: number }[];
  /** The point that is on. */
  on: number;
  /** Whether a point (by its index) is shown yet. */
  shown: (index: number) => boolean;
  delay: number;
  onPick: (index: number) => void;
}) => {
  const { width: stageW, height: stageH } = useStageSize();
  const tall = stageH > stageW;
  const u = unitOf(stageW, stageH);
  const width = stageW * (tall ? 0.8 : 0.42);
  const height = stageH * (tall ? 0.36 : 0.74);
  const spots = pileSpots(pictures.length, width, height);
  return (
    <div className="relative flex-none" style={{ width, height }}>
      {pictures.map(({ picture, index }, i) => {
        const spot = spots[i];
        const aspect = picture.width / picture.height || 1;
        const pad = 0.7 * u;
        const photoW = Math.min(spot.w - 2 * pad, (spot.h - 2 * pad) * aspect);
        const frameW = photoW + 2 * pad;
        const frameH = photoW / aspect + 2 * pad;
        const there = shown(index);
        const lit = there && index === on;
        return (
          <m.button
            animate={
              there
                ? {
                    x: 0,
                    y: lit ? -0.6 * u : 0,
                    rotate: lit ? 0 : spot.r,
                    scale: lit ? 1.14 : 0.94,
                    opacity: 1,
                  }
                : {
                    x: 0.5 * stageW,
                    y: 0.3 * stageH,
                    rotate: spot.r * 4,
                    scale: 0.94,
                    opacity: 0,
                  }
            }
            aria-label={`Show the point for ${picture.alt || "this picture"}`}
            aria-pressed={lit}
            className="absolute block rounded-[0.711cqmin] bg-white outline-solid outline-0 outline-(--accent) transition-[outline-width] duration-200 data-lit:outline-[0.5cqmin]"
            data-lit={lit || undefined}
            disabled={!there}
            initial={{
              x: 0.5 * stageW,
              y: 0.3 * stageH,
              rotate: spot.r * 4,
              opacity: 0,
            }}
            key={`${index}-${picture.src}`}
            onClick={() => onPick(index)}
            style={{
              left: spot.x - frameW / 2,
              top: spot.y - frameH / 2,
              width: frameW,
              padding: pad,
              zIndex: lit ? 30 : i,
              boxShadow: lit
                ? "0 2.4cqmin 5cqmin -1.6cqmin rgb(0 0 0 / 0.5)"
                : "0 1cqmin 2.4cqmin -1.2cqmin rgb(0 0 0 / 0.4)",
            }}
            transition={{
              default: {
                type: "spring",
                stiffness: 260,
                damping: 22,
                delay: there ? delay : 0,
              },
              opacity: { duration: 0.2, delay: there ? delay : 0 },
            }}
            type="button"
          >
            <Media
              className="block w-full rounded-[0.356cqmin] object-cover"
              picture={picture}
              style={{ aspectRatio: `${aspect}` }}
            />
          </m.button>
        );
      })}
    </div>
  );
};

const List = ({
  slide,
  step,
  onForward,
}: {
  slide: Of<"list">;
  step: number;
  onForward: () => void;
}) => {
  // One point per tap: the list itself is the button; where the next point
  // lands, its chip waits as a dashed outline, its number pulsing.
  const base = useContext(EnterDelay);
  const waiting = slide.stepwise && step < slide.items.length;
  const accent = slide.look.accent;
  const onAccent = isDark(accent) ? "#ffffff" : "#111111";
  // With pictures: the point that is on – the last one shown, or one
  // tapped once they are all there – and the latest picture up to it.
  const pictured = slide.items.some((item) => item.picture);
  const [picked, setPicked] = useState<number | null>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new step follows the last point again
  useEffect(() => setPicked(null), [step]);
  const latest = slide.stepwise ? Math.max(0, step - 1) : 0;
  const on = picked ?? latest;
  // The pile: every point's picture, in order; on top the latest one up
  // to the point that is on.
  const pile = slide.items.flatMap((item, i) =>
    item.picture ? [{ picture: item.picture, index: i }] : []
  );
  const shownPile = !slide.stepwise || step > 0;
  let top = 0;
  pile.forEach((entry, k) => {
    if (entry.index <= on) top = k;
  });
  return (
    <div className="absolute inset-x-[10.667cqmin] inset-y-[9cqmin] flex items-center justify-center gap-[6cqmin] tall:flex-col-reverse tall:justify-center">
      <div className="relative flex min-w-0 flex-1 flex-col justify-center gap-[4.978cqmin] tall:w-full tall:flex-none">
        {slide.heading && <Heading text={slide.heading} />}
        <ul className="copy flex flex-col items-start gap-[2cqmin] text-[4.4cqmin]">
          {slide.items.map((item, i) => {
            const shown = !slide.stepwise || step > i;
            const next = waiting && i === step;
            const wait = slide.stepwise ? 0 : base + 0.08 + i * 0.05;
            const active = pictured && shown && i === on;
            return (
              <li className="relative" key={`${i}-${item.text}`}>
                {next && (
                  <span
                    aria-hidden
                    className="absolute inset-0 flex items-center rounded-[1.2em] border-[0.08em] border-dashed px-[0.6em] opacity-60"
                    style={{ borderColor: "var(--ink)" }}
                  >
                    <m.span
                      animate={{ scale: [1, 1.15, 1], opacity: [1, 0.5, 1] }}
                      className="grid size-[1.9em] place-items-center rounded-full text-[0.6em] font-bold"
                      style={{ background: accent, color: onAccent }}
                      transition={{
                        duration: 1.4,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                    >
                      {i + 1}
                    </m.span>
                  </span>
                )}
                <m.span
                  animate={
                    shown
                      ? {
                          opacity: 1,
                          x: "0cqmin",
                          rotate: i % 2 ? 0.8 : -0.8,
                          scale: active ? 1.06 : 1,
                        }
                      : { opacity: 0, x: "-40cqmin", rotate: -6, scale: 1 }
                  }
                  className="flex w-fit items-center gap-[0.55em] rounded-[1.2em] py-[0.38em] pr-[0.8em] pl-[0.5em] shadow-[0_0.5cqmin_1.4cqmin_-0.6cqmin_rgb(0_0_0/0.35)] data-active:outline-[0.12em] data-active:outline-(--accent) data-active:outline-solid"
                  data-active={active || undefined}
                  initial={{ opacity: 0, x: "-40cqmin", rotate: -6 }}
                  style={{
                    background: "var(--paper)",
                    color: "var(--paper-ink)",
                  }}
                  transition={{
                    default: {
                      type: "spring",
                      stiffness: 520,
                      damping: 30,
                      delay: shown ? wait : 0,
                    },
                    scale: { type: "spring", stiffness: 500, damping: 22 },
                    opacity: { duration: 0.15, delay: shown ? wait : 0 },
                  }}
                >
                  <m.span
                    animate={
                      shown
                        ? { scale: 1, rotate: 0 }
                        : { scale: 0, rotate: -90 }
                    }
                    className="grid size-[1.9em] flex-none place-items-center rounded-full border-[0.14em] border-white text-[0.6em] font-bold"
                    initial={{ scale: 0, rotate: -90 }}
                    style={{ background: accent, color: onAccent }}
                    transition={{
                      type: "spring",
                      stiffness: 600,
                      damping: 18,
                      delay: shown ? wait + 0.06 : 0,
                    }}
                  >
                    {i + 1}
                  </m.span>
                  <span>
                    <ScratchText text={item.text} />
                  </span>
                </m.span>
                {/* Once all are there, a tap on a point shows its picture. */}
                {pictured && shown && !waiting && item.picture && (
                  <button
                    aria-label={`Show the picture for ${unmarked(item.text)}`}
                    className="absolute inset-0 cursor-pointer rounded-[1.2em]"
                    onClick={() => setPicked(i)}
                    type="button"
                  />
                )}
              </li>
            );
          })}
        </ul>
        {waiting && (
          <button
            aria-label="Show the next point"
            className="absolute -inset-[3cqmin] cursor-pointer rounded-[3cqmin]"
            onClick={onForward}
            type="button"
          />
        )}
      </div>
      {pile.length > 0 && slide.pictureLayout === "scatter" && (
        <ListScatter
          delay={slide.stepwise ? 0.05 : base + 0.3}
          on={on}
          onPick={setPicked}
          pictures={pile}
          shown={(index) => !slide.stepwise || step > index}
        />
      )}
      {pile.length > 0 && slide.pictureLayout !== "scatter" && (
        <ListPictures
          delay={slide.stepwise ? 0.1 : base + 0.3}
          pictures={pile.map((entry) => entry.picture)}
          shown={shownPile}
          top={top}
        />
      )}
    </div>
  );
};

/**
 * “1cqw” of a 16:9 stage, whatever the stage: on a wide one its width's
 * hundredth, on an upright one larger – the shorter side decides.
 */
const unitOf = (width: number, height: number) =>
  Math.min(width, height) / 56.25;

/**
 * A picture's box (px), its own shape kept, within a share of the stage –
 * `wide` on a wide one, `tall` on an upright one: [width, height] shares.
 */
const useFitBox = (
  picture: Picture,
  wide: [number, number],
  tall: [number, number]
) => {
  const { width, height } = useStageSize();
  const [w, h] = height > width ? tall : wide;
  const aspect = picture.width / picture.height || 1;
  const boxW = Math.min(width * w, height * h * aspect);
  return { width: boxW, height: boxW / aspect };
};

const Media = ({
  picture,
  className,
  style,
}: {
  picture: Picture;
  className?: string;
  style?: CSSProperties;
}) =>
  picture.video ? (
    <video
      autoPlay
      className={className}
      loop
      muted
      playsInline
      poster={picture.poster}
      src={picture.src}
      style={style}
    />
  ) : (
    <img
      alt={picture.alt}
      className={className}
      draggable={false}
      src={picture.src}
      style={style}
    />
  );

const PictureSlide = ({ slide }: { slide: Of<"picture"> }) => {
  const base = useContext(EnterDelay);
  const { image } = slide;
  if (!image) return null;
  if (slide.fit === "full") {
    return (
      <>
        <m.div
          animate={{ scale: 1, opacity: 1 }}
          className="absolute inset-0"
          initial={{ scale: 1.18, opacity: 0 }}
          transition={{ duration: 1.4, ease: [0.2, 0.7, 0.2, 1], delay: base }}
        >
          <Media className="size-full object-cover" picture={image} />
        </m.div>
        {slide.caption && (
          <Enter
            bouncy
            className="copy absolute bottom-[5.333cqmin] left-[5.333cqmin] rounded-full bg-(--paper) px-[2.844cqmin] py-[1.067cqmin] text-[3.2cqmin] text-(--paper-ink)"
            delay={0.6}
            kind="pop"
          >
            <ScratchText text={slide.caption} />
          </Enter>
        )}
      </>
    );
  }
  // Framed: a little polaroid, flying in from the side, landing tilted.
  return <Framed caption={slide.caption} image={image} />;
};

const Framed = ({ image, caption }: { image: Picture; caption: string }) => {
  const base = useContext(EnterDelay);
  const box = useFitBox(
    image,
    [0.76, caption ? 0.67 : 0.74],
    [0.86, caption ? 0.58 : 0.64]
  );
  return (
    <div className="absolute inset-0 grid place-items-center">
      <m.figure
        animate={{ x: "0cqmin", rotate: -2.5, opacity: 1 }}
        className="rounded-[1.067cqmin] bg-white p-[1.778cqmin] pb-[0.711cqmin] shadow-[0_1.3.556cqmin_3cqw_-1.778cqmin_rgb(0_0_0/0.4)]"
        initial={{ x: "124.444cqmin", rotate: 24, opacity: 0 }}
        transition={{
          default: { type: "spring", stiffness: 160, damping: 15, delay: base },
          opacity: { duration: 0.2, delay: base },
        }}
      >
        <Media
          className="block rounded-[0.356cqmin] object-cover"
          picture={image}
          style={box}
        />
        {/* As wide as the photo, never wider (the frame follows the photo):
            broken into even lines, in the middle, off the edges. */}
        <figcaption
          className="copy min-h-[2.133cqmin] px-[4cqmin] py-[1.6cqmin] text-center text-[3.378cqmin] leading-[1.2] text-balance text-neutral-800"
          style={{ width: box.width }}
        >
          <ScratchText text={caption} />
        </figcaption>
      </m.figure>
    </div>
  );
};

/** Words + picture's picture: beside the words, or upright below them. */
const useSplitBox = (picture: Picture | null) => {
  const box = useFitBox(
    picture ?? { src: "", width: 1, height: 1, alt: "", video: false },
    [0.4, 0.78],
    [0.84, 0.38]
  );
  return picture ? box : null;
};

const Split = ({ slide }: { slide: Of<"split"> }) => {
  const base = useContext(EnterDelay);
  const left = slide.side === "left";
  const box = useSplitBox(slide.image);
  return (
    <div
      className={cn(
        "absolute inset-x-[10.667cqmin] inset-y-[8.889cqmin] flex items-center gap-[8.889cqmin] tall:flex-col tall:justify-center",
        left && "flex-row-reverse tall:flex-col-reverse"
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-[3.911cqmin] tall:w-full tall:flex-none">
        {slide.heading && <Heading size={4.6} text={slide.heading} />}
        {slide.body && (
          <Enter delay={0.3}>
            <Rich body={slide.body} className="copy rich text-[3.911cqmin]" />
          </Enter>
        )}
      </div>
      {slide.image && (
        <m.div
          animate={{ x: "0cqmin", rotate: left ? -2 : 2, opacity: 1 }}
          className="flex-none"
          initial={{
            x: left ? "-88.889cqmin" : "88.889cqmin",
            rotate: left ? -20 : 20,
            opacity: 0,
          }}
          transition={{
            default: {
              type: "spring",
              stiffness: 170,
              damping: 16,
              delay: base + 0.15,
            },
            opacity: { duration: 0.2, delay: base + 0.15 },
          }}
        >
          <Media
            className="block rounded-[2.844cqmin] object-cover shadow-[0_1.3.556cqmin_3cqw_-1.778cqmin_rgb(0_0_0/0.35)]"
            picture={slide.image}
            style={box ?? undefined}
          />
        </m.div>
      )}
    </div>
  );
};

/** The polaroids' little turns, one after another. */
const TURNS = [-6, 4, -3, 7, -5, 3, 6, -4, 5, -7, 2, -2];

/**
 * Where a pile's polaroids lie in a `width` × `height` room: a loose grid
 * (the last row centred), each nudged a little off its cell, turned.
 */
export const pileSpots = (count: number, width: number, height: number) => {
  const cols = Math.max(1, Math.round(Math.sqrt((count * width) / height)));
  const rows = Math.ceil(count / cols);
  const cw = width / cols;
  const ch = height / rows;
  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / cols);
    const inRow = row === rows - 1 ? count - row * cols : cols;
    const offset = ((cols - inRow) * cw) / 2;
    const nudgeX = (((i * 37) % 11) / 11 - 0.5) * cw * 0.2;
    const nudgeY = (((i * 53) % 13) / 13 - 0.5) * ch * 0.2;
    return {
      x: offset + (i % cols) * cw + cw / 2 + nudgeX,
      y: row * ch + ch / 2 + nudgeY,
      w: cw * 1.1,
      h: ch * 1.1,
      r: TURNS[i % TURNS.length],
    };
  });
};

/**
 * A Gallery as a stack: the pictures one behind the other, the front one
 * thrown away with each tap (or →) – to the left, to the right, in turn,
 * fading as it goes; the next one comes forward. After the last one the
 * words fly in. Back (←) brings the last thrown one back.
 */
const GalleryStack = ({
  slide,
  step,
  onForward,
}: {
  slide: Of<"gallery">;
  step: number;
  onForward: () => void;
}) => {
  const base = useContext(EnterDelay);
  const { width: stageW, height: stageH } = useStageSize();
  const tall = stageH > stageW;
  const u = unitOf(stageW, stageH);
  const room = {
    w: stageW * (tall ? 0.86 : 0.7),
    h: stageH * (tall ? 0.62 : 0.74),
  };
  const gone = step >= slide.pictures.length;
  const words = Boolean(slide.heading || slide.body);
  return (
    <>
      <div
        className="absolute inset-0 grid place-items-center"
        style={{ perspective: 1400 }}
      >
        {slide.pictures.map(({ picture, caption }, i) => {
          const aspect = picture.width / picture.height || 1;
          const pad = 0.8 * u;
          const foot = caption ? 3.6 * u : pad;
          const photoW = Math.min(
            room.w - 2 * pad,
            (room.h - pad - foot) * aspect
          );
          const depth = i - step;
          const thrown = depth < 0;
          const side = i % 2 === 0 ? -1 : 1;
          const front = depth === 0;
          return (
            <m.button
              animate={
                thrown
                  ? {
                      x: side * stageW * 0.75,
                      y: -0.05 * stageH,
                      z: 0,
                      rotate: side * 28,
                      scale: 0.9,
                      opacity: 0,
                    }
                  : {
                      x: 0,
                      y: -depth * 1.4 * u,
                      z: -depth * 60,
                      rotate: depth === 0 ? -1.5 : ((i % 3) - 1) * 4,
                      scale: 1 - depth * 0.04,
                      opacity: depth < 5 ? 1 : 0,
                    }
              }
              aria-label={
                front ? `Throw ${picture.alt || "the picture"} away` : undefined
              }
              className="col-start-1 row-start-1 block rounded-[0.711cqmin] bg-white shadow-[0_1.4cqmin_3.2cqmin_-1.2cqmin_rgb(0_0_0/0.45)]"
              disabled={!front}
              initial={{
                y: 0.6 * stageH,
                rotate: (i % 2 ? 1 : -1) * 18,
                opacity: 0,
                z: -depth * 60,
              }}
              key={`${i}-${picture.src}`}
              onClick={front ? onForward : undefined}
              style={{
                width: photoW + 2 * pad,
                padding: `${pad}px ${pad}px 0`,
                zIndex: slide.pictures.length - i,
                cursor: front ? "pointer" : "default",
                pointerEvents: front ? "auto" : "none",
              }}
              transition={{
                default: {
                  type: "spring",
                  stiffness: 190,
                  damping: 20,
                  delay: step === 0 && !thrown ? base + 0.2 + i * 0.08 : 0,
                },
                opacity: {
                  duration: thrown ? 0.45 : 0.25,
                  delay: step === 0 && !thrown ? base + 0.2 + i * 0.08 : 0,
                },
              }}
              type="button"
            >
              <Media
                className="block w-full rounded-[0.356cqmin] object-cover"
                picture={picture}
                style={{ aspectRatio: `${aspect}` }}
              />
              {/* Up to two lines, the rim growing along – then cut. */}
              <span
                className="copy line-clamp-2 text-center leading-[1.15] text-balance text-neutral-800"
                style={{
                  minHeight: foot,
                  paddingTop: caption ? 0.7 * u : 0,
                  paddingBottom: caption ? 0.4 * u : 0,
                  fontSize: Math.max(12, 1.5 * u),
                }}
              >
                <ScratchText text={caption} />
              </span>
            </m.button>
          );
        })}
      </div>
      {gone && words && (
        <EnterDelay.Provider value={0.15}>
          <div className="absolute inset-x-[14.222cqmin] inset-y-[10.667cqmin] flex flex-col items-center justify-center gap-[3.556cqmin] text-center">
            {slide.heading && <Heading text={slide.heading} />}
            {slide.body && (
              <Enter delay={0.3}>
                <Rich
                  body={slide.body}
                  className="copy rich max-w-[120cqmin] text-[4.444cqmin]"
                />
              </Enter>
            )}
          </div>
        </EnterDelay.Provider>
      )}
    </>
  );
};

const Gallery = ({ slide }: { slide: Of<"gallery"> }) => {
  const base = useContext(EnterDelay);
  const [near, setNear] = useState<number | null>(null);
  const { width: stageW, height: stageH } = useStageSize();
  const tall = stageH > stageW;
  const u = unitOf(stageW, stageH);
  const words = Boolean(slide.heading || slide.body);
  const left = slide.side === "left";
  // The pile's room (px): beside the words, or – upright – below them.
  const width = stageW * (tall ? 0.8 : words ? 0.52 : 0.86);
  const height = stageH * (tall ? (words ? 0.52 : 0.78) : 0.8);
  const spots = pileSpots(slide.pictures.length, width, height);
  return (
    <div
      className={cn(
        "absolute inset-x-[10.667cqmin] inset-y-[9.778cqmin] flex items-center gap-[7.111cqmin] tall:flex-col tall:justify-center",
        left && "flex-row-reverse tall:flex-col-reverse"
      )}
    >
      {words && (
        <div className="flex min-w-0 flex-1 flex-col gap-[3.556cqmin] tall:w-full tall:flex-none">
          {slide.heading && <Heading size={4.4} text={slide.heading} />}
          {slide.body && (
            <Enter delay={0.3}>
              <Rich body={slide.body} className="copy rich text-[3.733cqmin]" />
            </Enter>
          )}
        </div>
      )}
      <div className="relative flex-none" style={{ width, height }}>
        {slide.pictures.map(({ picture, caption }, i) => {
          const spot = spots[i];
          const aspect = picture.width / picture.height || 1;
          // The photo within its cell, the frame around it (px).
          const pad = 0.7 * u;
          const foot = 3.3 * u;
          const photoW = Math.min(
            spot.w - 2 * pad,
            (spot.h - foot - pad) * aspect
          );
          const frameW = photoW + 2 * pad;
          const frameH = photoW / aspect + pad + foot;
          const close = near === i;
          const zoom = Math.min(
            (width * 0.86) / frameW,
            (height * 0.96) / frameH
          );
          return (
            <m.button
              animate={{
                x: close ? width / 2 - spot.x : 0,
                y: close ? height / 2 - spot.y : 0,
                rotate: close ? 0 : spot.r,
                scale: close ? zoom : 1,
                opacity: 1,
              }}
              aria-label={
                close
                  ? "Put the picture back"
                  : `Show ${picture.alt || "the picture"} up close`
              }
              aria-pressed={close}
              className="absolute block cursor-zoom-in rounded-[0.711cqmin] bg-white pb-0 shadow-[0_0.14.222cqmin_1.14.222cqmin_-1.067cqmin_rgb(0_0_0/0.4)] aria-pressed:cursor-zoom-out"
              initial={{
                x: (left ? -0.6 : 0.6) * stageW,
                y: 0.35 * stageH,
                rotate: spot.r * 4,
                opacity: 0,
              }}
              key={`${i}-${picture.src}`}
              onClick={() => setNear(close ? null : i)}
              style={{
                left: spot.x - frameW / 2,
                top: spot.y - frameH / 2,
                width: frameW,
                padding: `${pad}px ${pad}px 0`,
                zIndex: close ? 30 : i,
              }}
              transition={{
                default: {
                  type: "spring",
                  stiffness: 170,
                  damping: 17,
                  delay: near === null && !close ? base + 0.25 + i * 0.12 : 0,
                },
                opacity: { duration: 0.2, delay: base + 0.25 + i * 0.12 },
              }}
              type="button"
            >
              <Media
                className="block w-full rounded-[0.356cqmin] object-cover"
                picture={picture}
                style={{ aspectRatio: `${aspect}` }}
              />
              <span
                className="copy line-clamp-2 px-[0.711cqmin] text-center leading-[1.15] text-balance text-neutral-800"
                style={{
                  minHeight: foot,
                  paddingTop: 0.5 * u,
                  paddingBottom: 0.35 * u,
                  fontSize: Math.max(11, 1.3 * u),
                }}
              >
                <ScratchText text={caption} />
              </span>
            </m.button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Big words in big quote marks: the marks, the words and who said it, one
 * block in the middle – the words as big as fits with the name under them
 * (the name is measured along), the marks right above.
 */
const Quote = ({ slide }: { slide: Of<"quote"> }) => {
  // Upright, the words may be bigger: there is room above and below.
  const { width, height } = useStageSize();
  const fit = useFit(slide.quote, { max: height > width ? 10 : 7, wrap: true });
  return (
    <div className="absolute inset-x-[17.778cqmin] top-[22cqmin] bottom-[10.667cqmin] flex items-center tall:inset-x-[10cqmin] tall:top-[30cqmin] tall:bottom-[22cqmin]">
      <div
        className="copy relative w-full font-medium text-balance"
        ref={fit.ref}
        style={{ fontSize: fit.fontSize, lineHeight: 1.18 }}
      >
        <Enter
          bouncy
          className="headline absolute bottom-full -left-[3.556cqmin] -mb-[13cqmin] text-[32cqmin] leading-none font-normal"
          kind="pop"
          style={{ color: "var(--accent)", textTransform: "none" }}
        >
          “
        </Enter>
        <Words delay={0.15} gap={0.04} text={slide.quote} />
        {slide.author && (
          <Enter
            className="mt-[0.6em] block text-[3.911cqmin] leading-snug opacity-75 tall:text-[4.6cqmin]"
            delay={0.7}
          >
            — <ScratchText text={slide.author} />
          </Enter>
        )}
      </div>
    </div>
  );
};

export const SlideView = ({
  slide,
  step,
  onForward,
}: {
  slide: SlideData;
  step: number;
  /** A tap that is the slide's next step (a stacked picture thrown). */
  onForward: () => void;
}) => {
  switch (slide.design) {
    case "poster":
      return <Poster slide={slide} />;
    case "cover":
      return <Cover slide={slide} />;
    case "words":
      return <WordsSlide slide={slide} />;
    case "list":
      return <List onForward={onForward} slide={slide} step={step} />;
    case "picture":
      return <PictureSlide slide={slide} />;
    case "split":
      return <Split slide={slide} />;
    case "gallery":
      return slide.layout === "stack" ? (
        <GalleryStack onForward={onForward} slide={slide} step={step} />
      ) : (
        <Gallery slide={slide} />
      );
    case "quote":
      return <Quote slide={slide} />;
    case "scratch":
      return <ScratchSlide onForward={onForward} slide={slide} step={step} />;
    case "link":
      return <LinkSlide slide={slide} />;
    default:
      return null;
  }
};
