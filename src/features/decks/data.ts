import { pictureOf } from "@/features/media/picture";
import type {
  DeckData,
  RichBody,
  SlideData,
  StickerData,
} from "@/features/player/types";
import { readArrangement } from "@/features/stickers/arrangement";
import { lookOf } from "@/features/themes/look";
import type { ThemeLook } from "@/features/themes/theme";
import { DEFAULT_TRANSITION, isChoice } from "@/features/transitions/kinds";
import type { Deck, Sticker } from "@/payload-types";

type StickerRows =
  | { sticker: string | Sticker; id?: string | null }[]
  | null
  | undefined;

/** A slide's stickers – those still in the library. */
export const stickersOf = (rows: StickerRows): StickerData[] =>
  (rows ?? []).flatMap((row) => {
    const picture = pictureOf(row.sticker, "sticker");
    return picture && row.id && !picture.video ? [{ id: row.id, picture }] : [];
  });

type Slide = Deck["slides"][number];

/** “4 NOV 2026” – a postmark's date. */
const postmark = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Berlin",
  })
    .format(new Date(iso))
    .toUpperCase();

const slideOf = (
  slide: Slide,
  index: number,
  deckLook: ThemeLook,
  posted: string
): SlideData | null => {
  const base = {
    id: slide.id ?? `slide-${index}`,
    look: lookOf(slide.theme, deckLook),
    transition: isChoice(slide.transition) ? slide.transition : null,
    nextLabel: slide.nextLabel?.trim() ?? "",
    stickers: stickersOf(slide.stickers),
  };
  switch (slide.blockType) {
    case "poster":
      return {
        ...base,
        design: "poster",
        text: slide.text,
        align: slide.align ?? "center",
      };
    case "cover":
      return {
        ...base,
        design: "cover",
        kicker: slide.kicker ?? "",
        title: slide.title,
        subtitle: slide.subtitle ?? "",
      };
    case "words":
      return {
        ...base,
        design: "words",
        heading: slide.heading ?? "",
        body: (slide.body as RichBody | null) ?? null,
      };
    case "list":
      return {
        ...base,
        design: "list",
        heading: slide.heading ?? "",
        items: (slide.items ?? []).flatMap((item) =>
          item.text ? [{ text: item.text, picture: pictureOf(item.image) }] : []
        ),
        stepwise: slide.stepwise ?? false,
      };
    case "picture":
      return {
        ...base,
        design: "picture",
        image: pictureOf(slide.image),
        caption: slide.caption ?? "",
        fit: slide.fit ?? "framed",
      };
    case "split":
      return {
        ...base,
        design: "split",
        heading: slide.heading ?? "",
        body: (slide.body as RichBody | null) ?? null,
        image: pictureOf(slide.image),
        side: slide.side ?? "right",
      };
    case "gallery":
      return {
        ...base,
        design: "gallery",
        heading: slide.heading ?? "",
        body: (slide.body as RichBody | null) ?? null,
        pictures: (slide.pictures ?? []).flatMap((row) => {
          const picture = pictureOf(row.image);
          return picture ? [{ picture, caption: row.caption ?? "" }] : [];
        }),
        layout: slide.layout ?? "pile",
        side: slide.side ?? "right",
      };
    case "quote":
      return {
        ...base,
        design: "quote",
        quote: slide.quote,
        author: slide.author ?? "",
      };
    case "card":
      return {
        ...base,
        design: "card",
        to: slide.to ?? "",
        stamp:
          pictureOf(slide.stamp, "small") ?? base.stickers[0]?.picture ?? null,
        posted,
        headline: slide.headline ?? "",
        greeting: slide.greeting ?? "",
        message: slide.message,
        from: slide.from ?? "",
      };
    case "blank":
      return { ...base, design: "blank" };
    default:
      return null;
  }
};

/** A deck as its page plays it. */
export const deckData = (deck: Deck): DeckData => {
  const deckLook = lookOf(deck.theme);
  return {
    id: deck.id,
    slug: deck.slug,
    title: deck.title,
    transition: isChoice(deck.transition)
      ? deck.transition
      : DEFAULT_TRANSITION,
    dock: deck.dock ?? true,
    nextLabel: deck.nextLabel?.trim() ?? "",
    slides: (deck.slides ?? []).flatMap((slide, index) => {
      const data = slideOf(slide, index, deckLook, postmark(deck.createdAt));
      return data ? [data] : [];
    }),
    arrangement: readArrangement(deck.arrangement),
  };
};
