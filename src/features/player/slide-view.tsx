"use client";

import { m } from "motion/react";
import { type CSSProperties, useContext, useState } from "react";
import type { Picture } from "@/features/media/picture";
import { isDark } from "@/features/themes/theme";
import { cn } from "@/lib/cn";
import { BOUNCY, Enter, EnterDelay, useFit, Words } from "./enter";
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
    {text}
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
          {slide.subtitle}
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
          className="copy rich max-w-[120.889cqmin] text-[4.444cqmin]"
        />
      </Enter>
    )}
  </div>
);

const List = ({
  slide,
  step,
  onForward,
}: {
  slide: Of<"list">;
  step: number;
  onForward: () => void;
}) => {
  // One point per tap: the list itself is the button, a dot pulses where
  // the next point lands.
  const waiting = slide.stepwise && step < slide.items.length;
  return (
    <div className="absolute inset-x-[14.222cqmin] inset-y-[10.667cqmin] flex flex-col justify-center gap-[4.978cqmin]">
      {slide.heading && <Heading text={slide.heading} />}
      <ul className="copy flex flex-col gap-[2.311cqmin] text-[4.978cqmin]">
        {slide.items.map((item, i) => {
          const shown = !slide.stepwise || step > i;
          return (
            <li className="relative" key={`${i}-${item}`}>
              {waiting && i === step && (
                <m.i
                  animate={{ scale: [1, 1.6, 1], opacity: [0.9, 0.3, 0.9] }}
                  aria-hidden
                  className="absolute top-[0.45em] left-0 block size-[0.55em] rounded-full"
                  style={{ background: "var(--accent)" }}
                  transition={{
                    duration: 1.4,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />
              )}
              <Enter
                className="flex items-baseline gap-[2.489cqmin]"
                delay={slide.stepwise ? 0 : 0.3 + i * 0.12}
                kind="left"
                shown={shown}
              >
                <m.i
                  animate={{ scale: 1, rotate: 0 }}
                  aria-hidden
                  className="relative top-[-0.12em] block size-[0.55em] flex-none rounded-full"
                  initial={{ scale: 0, rotate: -90 }}
                  style={{ background: "var(--accent)" }}
                  transition={{ ...BOUNCY, delay: 0.1 }}
                />
                <span>{item}</span>
              </Enter>
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
            {slide.caption}
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
        <figcaption className="copy min-h-[2.133cqmin] py-[1.6cqmin] text-center text-[3.378cqmin] text-neutral-800">
          {caption}
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
              <span
                className="copy block truncate text-center text-neutral-800"
                style={{
                  height: foot,
                  paddingTop: caption ? 0.7 * u : 0,
                  fontSize: Math.max(12, 1.5 * u),
                }}
              >
                {caption}
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
                className="copy block truncate px-[0.711cqmin] text-center text-neutral-800"
                style={{
                  height: foot,
                  paddingTop: 0.5 * u,
                  fontSize: Math.max(11, 1.3 * u),
                }}
              >
                {caption}
              </span>
            </m.button>
          );
        })}
      </div>
    </div>
  );
};

const Quote = ({ slide }: { slide: Of<"quote"> }) => {
  const fit = useFit(slide.quote, { max: 7, wrap: true });
  return (
    <div className="absolute inset-x-[17.778cqmin] inset-y-[10.667cqmin] flex flex-col justify-center">
      <Enter
        bouncy
        className="headline -mb-[7.111cqmin] -ml-[3.556cqmin] text-[32cqmin] leading-none"
        kind="pop"
        style={{ color: "var(--accent)", textTransform: "none" }}
      >
        “
      </Enter>
      <div className="flex min-h-0 flex-1 items-center">
        <div
          className="copy w-full font-medium text-balance"
          ref={fit.ref}
          style={{ fontSize: fit.fontSize, lineHeight: 1.18 }}
        >
          <Words delay={0.15} gap={0.04} text={slide.quote} />
        </div>
      </div>
      {slide.author && (
        <Enter
          className="copy mt-[3.556cqmin] text-[3.911cqmin] opacity-75"
          delay={0.7}
        >
          — {slide.author}
        </Enter>
      )}
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
    default:
      return null;
  }
};
