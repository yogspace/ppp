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
        items: string[];
        stepwise: boolean;
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
        side: "left" | "right";
      }
    | { design: "quote"; quote: string; author: string }
    | {
        design: "card";
        to: string;
        /** The postage stamp – its own, else the first sticker's picture. */
        stamp: Picture | null;
        /** The postmark's date: “4 NOV 2026”. */
        posted: string;
        headline: string;
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
  slides: SlideData[];
  arrangement: Arrangement;
};
