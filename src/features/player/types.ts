import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import type { Picture } from "@/features/media/picture";
import type { Arrangement } from "@/features/stickers/arrangement";
import type { ThemeLook } from "@/features/themes/theme";
import type { TransitionChoice } from "@/features/transitions/kinds";

/**
 * What the pages hand to the browser: plain data, only what is shown –
 * shaped on the server from the documents (decks/data.ts, cards/data.ts).
 */

export type StickerData = { id: string; picture: Picture };

export type RichBody = SerializedEditorState;

type SlideBase = {
  id: string;
  look: ThemeLook;
  /** Its own – null: the deck's. */
  transition: TransitionChoice | null;
  /** Its next button's words – empty: the deck's. */
  nextLabel: string;
  stickers: StickerData[];
};

export type SlideData = SlideBase &
  (
    | {
        design: "poster";
        text: string;
        align: "center" | "left" | "right" | "stairs";
      }
    | { design: "cover"; kicker: string; title: string; subtitle: string }
    | { design: "words"; heading: string; body: RichBody | null }
    | {
        design: "list";
        heading: string;
        /** Each with its picture, if it has one. */
        items: { text: string; picture: Picture | null }[];
        stepwise: boolean;
        /** Its pictures: a stack, one on top – or scattered, all at once. */
        pictureLayout: "stack" | "scatter";
      }
    | {
        design: "picture";
        image: Picture | null;
        caption: string;
        fit: "framed" | "full";
      }
    | {
        design: "split";
        heading: string;
        body: RichBody | null;
        image: Picture | null;
        side: "left" | "right";
      }
    | {
        design: "gallery";
        heading: string;
        body: RichBody | null;
        pictures: { picture: Picture; caption: string }[];
        /** Scattered polaroids, or a stack thrown away one by one. */
        layout: "pile" | "stack";
        side: "left" | "right";
      }
    | { design: "quote"; quote: string; author: string }
    | {
        design: "scratch";
        heading: string;
        kicker: string;
        /** Under the foil. */
        prize: string;
        image: Picture | null;
        /** Below the ticket, once won. */
        footnote: string;
      }
    | {
        design: "card";
        to: string;
        /** The postage stamp – its own, else the first sticker's picture. */
        stamp: Picture | null;
        /** The postmark's date: “4 NOV 2026”. */
        posted: string;
        headline: string;
        /** Inside, above the message – empty: “Dear …,”. */
        greeting: string;
        message: string;
        from: string;
      }
    | { design: "blank" }
  );

export type Design = SlideData["design"];

export type DeckData = {
  id: string;
  slug: string;
  title: string;
  transition: TransitionChoice;
  /** The controls at the bottom – off: the slides' own buttons only. */
  dock: boolean;
  /** Every slide's next button's words – empty: just an arrow. */
  nextLabel: string;
  slides: SlideData[];
  arrangement: Arrangement;
};
