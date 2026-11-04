"use client";

import { m } from "motion/react";
import { type CSSProperties, useContext } from "react";
import type { Picture } from "@/features/media/picture";
import { isDark } from "@/features/themes/theme";
import { cn } from "@/lib/cn";
import { BOUNCY, Enter, EnterDelay, useFit, Words } from "./enter";
import { Rich } from "./rich";
import type { SlideData } from "./types";

/**
 * A slide's words and pictures, by its design – in cqw throughout, so the
 * slide looks the same at any size. The stickers lie over it
 * (slide-frame.tsx).
 */

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
        "absolute inset-x-[6cqw] inset-y-[5.5cqw] flex flex-col justify-center",
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
    className="copy rounded-full px-[1.6cqw] py-[0.55cqw] text-[1.9cqw] font-semibold"
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
    <div className="absolute inset-x-[7cqw] inset-y-[6cqw] flex flex-col items-center justify-center gap-[2.2cqw] text-center">
      {slide.kicker && <Pill accent={slide.look.accent} text={slide.kicker} />}
      <div className="flex max-h-[30cqw] min-h-0 w-full flex-1 items-center justify-center">
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
          className="copy max-w-[60cqw] text-[2.4cqw] whitespace-pre-line opacity-75"
          delay={0.5}
        >
          {slide.subtitle}
        </Enter>
      )}
    </div>
  );
};

const Heading = ({ text, size = 5.4 }: { text: string; size?: number }) => (
  <h2 className="headline" style={{ fontSize: `${size}cqw` }}>
    <Words gap={0.05} text={text} />
  </h2>
);

const WordsSlide = ({ slide }: { slide: Of<"words"> }) => (
  <div className="absolute inset-x-[8cqw] inset-y-[6cqw] flex flex-col justify-center gap-[2.6cqw]">
    {slide.heading && <Heading text={slide.heading} />}
    {slide.body && (
      <Enter delay={0.3}>
        <Rich
          body={slide.body}
          className="copy rich max-w-[68cqw] text-[2.5cqw]"
        />
      </Enter>
    )}
  </div>
);

const List = ({ slide, step }: { slide: Of<"list">; step: number }) => (
  <div className="absolute inset-x-[8cqw] inset-y-[6cqw] flex flex-col justify-center gap-[2.8cqw]">
    {slide.heading && <Heading text={slide.heading} />}
    <ul className="copy flex flex-col gap-[1.3cqw] text-[2.8cqw]">
      {slide.items.map((item, i) => (
        <Enter
          as="li"
          className="flex items-baseline gap-[1.4cqw]"
          delay={slide.stepwise ? 0 : 0.3 + i * 0.12}
          key={`${i}-${item}`}
          kind="left"
          shown={!slide.stepwise || step > i}
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
      ))}
    </ul>
  </div>
);

/** A picture, its own size kept within `w` × `h` (cqw). */
const fitBox = (picture: Picture, w: number, h: number) => {
  const aspect = picture.width / picture.height || 1;
  const width = Math.min(w, h * aspect);
  return { width: `${width}cqw`, height: `${width / aspect}cqw` };
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
            className="copy absolute bottom-[3cqw] left-[3cqw] rounded-full bg-(--paper) px-[1.6cqw] py-[0.6cqw] text-[1.8cqw] text-(--paper-ink)"
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
  return (
    <div className="absolute inset-0 grid place-items-center">
      <m.figure
        animate={{ x: "0cqw", rotate: -2.5, opacity: 1 }}
        className="rounded-[0.6cqw] bg-white p-[1cqw] pb-[0.4cqw] shadow-[0_1.2cqw_3cqw_-1cqw_rgb(0_0_0/0.4)]"
        initial={{ x: "70cqw", rotate: 24, opacity: 0 }}
        transition={{
          default: { type: "spring", stiffness: 160, damping: 15, delay: base },
          opacity: { duration: 0.2, delay: base },
        }}
      >
        <Media
          className="block rounded-[0.2cqw] object-cover"
          picture={image}
          style={fitBox(image, 76, slide.caption ? 38 : 42)}
        />
        <figcaption className="copy min-h-[1.2cqw] py-[0.9cqw] text-center text-[1.9cqw] text-neutral-800">
          {slide.caption}
        </figcaption>
      </m.figure>
    </div>
  );
};

const Split = ({ slide }: { slide: Of<"split"> }) => {
  const base = useContext(EnterDelay);
  const left = slide.side === "left";
  return (
    <div
      className={cn(
        "absolute inset-x-[6cqw] inset-y-[5cqw] flex items-center gap-[5cqw]",
        left && "flex-row-reverse"
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-[2.2cqw]">
        {slide.heading && <Heading size={4.6} text={slide.heading} />}
        {slide.body && (
          <Enter delay={0.3}>
            <Rich body={slide.body} className="copy rich text-[2.2cqw]" />
          </Enter>
        )}
      </div>
      {slide.image && (
        <m.div
          animate={{ x: "0cqw", rotate: left ? -2 : 2, opacity: 1 }}
          className="flex-none"
          initial={{
            x: left ? "-50cqw" : "50cqw",
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
            className="block rounded-[1.6cqw] object-cover shadow-[0_1.2cqw_3cqw_-1cqw_rgb(0_0_0/0.35)]"
            picture={slide.image}
            style={fitBox(slide.image, 40, 44)}
          />
        </m.div>
      )}
    </div>
  );
};

const Quote = ({ slide }: { slide: Of<"quote"> }) => {
  const fit = useFit(slide.quote, { max: 7, wrap: true });
  return (
    <div className="absolute inset-x-[10cqw] inset-y-[6cqw] flex flex-col justify-center">
      <Enter
        bouncy
        className="headline -mb-[4cqw] -ml-[2cqw] text-[18cqw] leading-none"
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
        <Enter className="copy mt-[2cqw] text-[2.2cqw] opacity-75" delay={0.7}>
          — {slide.author}
        </Enter>
      )}
    </div>
  );
};

export const SlideView = ({
  slide,
  step,
}: {
  slide: SlideData;
  step: number;
}) => {
  switch (slide.design) {
    case "poster":
      return <Poster slide={slide} />;
    case "cover":
      return <Cover slide={slide} />;
    case "words":
      return <WordsSlide slide={slide} />;
    case "list":
      return <List slide={slide} step={step} />;
    case "picture":
      return <PictureSlide slide={slide} />;
    case "split":
      return <Split slide={slide} />;
    case "quote":
      return <Quote slide={slide} />;
    default:
      return null;
  }
};
