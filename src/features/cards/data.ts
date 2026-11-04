import { stickersOf } from "@/features/decks/data";
import { pictureOf } from "@/features/media/picture";
import type { CardData } from "@/features/player/types";
import { readArrangement } from "@/features/stickers/arrangement";
import { lookOf } from "@/features/themes/look";
import type { Card } from "@/payload-types";

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

/** A card as its page shows it. */
export const cardData = (card: Card): CardData => {
  const stickers = stickersOf(card.stickers);
  return {
    id: card.id,
    title: card.title,
    look: lookOf(card.theme),
    to: card.to ?? "",
    from: card.from ?? "",
    headline: card.headline ?? "",
    message: card.message,
    stamp: pictureOf(card.stamp, "small") ?? stickers[0]?.picture ?? null,
    posted: postmark(card.createdAt),
    stickers,
    arrangement: readArrangement(card.arrangement),
  };
};
