"use client";

import { m } from "motion/react";
import QRCode from "qrcode";
import { useContext, useEffect, useState } from "react";
import { EnterDelay, Words } from "@/features/player/enter";
import type { SlideData } from "@/features/player/types";
import { ScratchText } from "@/features/scratch/scratch";
import { isDark } from "@/features/themes/theme";

type Of = Extract<SlideData, { design: "link" }>;

/** The address without its scheme and `www.` – “example.com/menu”. */
const shortOf = (url: string) => {
  try {
    const u = new URL(url);
    const rest = `${u.pathname}${u.search}`.replace(/\/$/, "");
    return `${u.hostname.replace(/^www\./, "")}${rest.length > 18 ? "/…" : rest}`;
  } catch {
    return url;
  }
};

/** Its QR code, in the slide's ink, on nothing – null until drawn. */
const useQr = (url: string, ink: string) => {
  const [code, setCode] = useState<string | null>(null);
  useEffect(() => {
    let on = true;
    QRCode.toDataURL(url, {
      margin: 0,
      width: 480,
      errorCorrectionLevel: "M",
      color: { dark: ink, light: "#00000000" },
    })
      .then((png) => on && setCode(png))
      .catch(() => undefined);
    return () => {
      on = false;
    };
  }, [url, ink]);
  return code;
};

/**
 * A link to go to: a card in the theme hopping in – a picture if it has
 * one, the address in a pill, big words, a note, and the button that opens
 * it (a new tab). On a wide screen its QR code beside it, to scan while it
 * is shown; upright (a phone) the button alone.
 */
export const LinkSlide = ({ slide }: { slide: Of }) => {
  const base = useContext(EnterDelay);
  const accent = slide.look.accent;
  const onAccent = isDark(accent) ? "#ffffff" : "#111111";
  const qr = useQr(slide.url, slide.look.paperText);
  return (
    <div className="absolute inset-x-[9cqmin] inset-y-[9cqmin] flex flex-col items-center justify-center gap-[4cqmin]">
      {slide.heading && (
        <h2 className="headline text-center text-[8cqmin]">
          <Words gap={0.05} text={slide.heading} />
        </h2>
      )}
      <div className="flex items-center gap-[5cqmin] tall:flex-col">
        <m.div
          animate={{ y: 0, rotate: -1.5, scale: 1, opacity: 1 }}
          className="flex w-[min(58cqw,92cqmin)] flex-col gap-[2.2cqmin] rounded-[2.4cqmin] bg-(--paper) p-[3.6cqmin] text-(--paper-ink) shadow-[0_2cqmin_5cqmin_-2cqmin_rgb(0_0_0/0.45)] tall:w-full"
          initial={{ y: "40%", rotate: 8, scale: 0.85, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 190,
            damping: 15,
            delay: base + 0.15,
          }}
        >
          {slide.image && (
            <img
              alt={slide.image.alt}
              className="aspect-[2/1] w-full rounded-[1.4cqmin] object-cover"
              draggable={false}
              src={slide.image.src}
            />
          )}
          <span className="flex w-fit max-w-full items-center gap-[0.5em] truncate rounded-full bg-(--accent)/15 px-[0.9em] py-[0.35em] font-sans text-[2.6cqmin] font-semibold">
            <svg
              aria-hidden
              className="size-[1.1em] flex-none"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
            </svg>
            <span className="truncate">{shortOf(slide.url)}</span>
          </span>
          <span className="headline text-[6.4cqmin] leading-[1.05] normal-case tall:text-[8cqmin]">
            <ScratchText text={slide.title} />
          </span>
          {slide.note && (
            <span className="copy text-[3.2cqmin] opacity-75 tall:text-[4.2cqmin]">
              <ScratchText text={slide.note} />
            </span>
          )}
          <m.a
            className="copy mt-[1cqmin] inline-flex w-fit cursor-pointer items-center gap-[0.5em] rounded-full border-[max(3px,0.45cqmin)] border-white px-[1.2em] py-[0.55em] text-[3.4cqmin] leading-none font-semibold shadow-[0_0.8cqmin_1.6cqmin_-0.4cqmin_rgb(0_0_0/0.35)] tall:text-[4.6cqmin]"
            href={slide.url}
            rel="noopener noreferrer"
            style={{ background: accent, color: onAccent }}
            target="_blank"
            whileHover={{ scale: 1.08, rotate: -2 }}
            whileTap={{ scale: 0.9 }}
          >
            {slide.label || "Open"}
            <svg
              aria-hidden
              className="size-[1em]"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.6"
              viewBox="0 0 24 24"
            >
              <path d="M7 17 17 7M8 7h9v9" />
            </svg>
          </m.a>
        </m.div>
        {/* To scan while it's shown – a phone taps the button instead. */}
        {qr && (
          <m.div
            animate={{ scale: 1, rotate: 3, opacity: 1 }}
            className="flex flex-col items-center gap-[1.4cqmin] rounded-[2cqmin] bg-(--paper) p-[2.4cqmin] text-(--paper-ink) shadow-[0_1.6cqmin_4cqmin_-2cqmin_rgb(0_0_0/0.4)] tall:hidden"
            initial={{ scale: 0.5, rotate: -10, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 16,
              delay: base + 0.5,
            }}
          >
            <img
              alt={`QR code for ${slide.url}`}
              className="size-[24cqmin] [image-rendering:pixelated]"
              src={qr}
            />
            <span className="font-sans text-[2cqmin] font-semibold tracking-[0.12em] uppercase opacity-60">
              scan me
            </span>
          </m.div>
        )}
      </div>
    </div>
  );
};
