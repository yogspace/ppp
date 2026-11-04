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
import type { Deck, Media } from "@/payload-types";

type StickerRows =
  | { image: string | Media; id?: string | null }[]
  | null
  | undefined;

/** A slide's or card's stickers – those whose picture is still there. */
export const stickersOf = (rows: StickerRows): StickerData[] =>
  (rows ?? []).flatMap((row) => {
    const picture = pictureOf(row.image, "sticker");
    return picture && row.id && !picture.video ? [{ id: row.id, picture }] : [];
  });

type Slide = Deck["slides"][number];

const slideOf = (
  slide: Slide,
  index: number,
  deckLook: ThemeLook
): SlideData | null => {
  const base = {
    id: slide.id ?? `slide-${index}`,
    look: lookOf(slide.theme, deckLook),
    transition: isChoice(slide.transition) ? slide.transition : null,
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
        items: (slide.items ?? []).map((item) => item.text).filter(Boolean),
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
    case "quote":
      return {
        ...base,
        design: "quote",
        quote: slide.quote,
        author: slide.author ?? "",
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
    slides: (deck.slides ?? []).flatMap((slide, index) => {
      const data = slideOf(slide, index, deckLook);
      return data ? [data] : [];
    }),
    arrangement: readArrangement(deck.arrangement),
  };
};
