import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { RefreshOnSave } from "@/components/refresh-on-save";
import { CardPage } from "@/features/cards/card-page";
import { cardData } from "@/features/cards/data";
import { deckData } from "@/features/decks/data";
import { DeckPlayer } from "@/features/player/deck-player";
import { slideFromSegments, slideHref } from "@/features/player/steps";
import { SLUG } from "@/features/slug/slug";
import { payload, viewer } from "@/lib/payload";

// Read anew on every request: what was saved in the admin shows at once.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string; slide?: string[] }> };

/** The deck or card at this address – decks and cards share them. */
const find = cache(async (slug: string) => {
  if (!SLUG.test(slug)) return null;
  const local = await payload();
  const where = { slug: { equals: slug } };
  const [decks, cards] = await Promise.all([
    local.find({ collection: "decks", where, depth: 2, limit: 1 }),
    local.find({ collection: "cards", where, depth: 2, limit: 1 }),
  ]);
  if (decks.docs[0]) return { kind: "deck", deck: decks.docs[0] } as const;
  if (cards.docs[0]) return { kind: "card", card: cards.docs[0] } as const;
  return null;
});

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const found = await find((await params).slug);
  if (!found) return {};
  if (found.kind === "deck") return { title: found.deck.title };
  const { to, title } = found.card;
  return { title: to ? `For ${to}` : title };
};

/**
 * A deck – `/talk` its first slide, `/talk/1` the second … – or a card.
 */
const Page = async ({ params }: Props) => {
  const { slug, slide } = await params;
  const found = await find(slug);
  if (!found) notFound();
  const canArrange = Boolean(await viewer());

  if (found.kind === "card") {
    if (slide?.length) notFound();
    return (
      <>
        <RefreshOnSave />
        <CardPage canArrange={canArrange} card={cardData(found.card)} />
      </>
    );
  }

  const deck = deckData(found.deck);
  const at = slideFromSegments(slide, deck.slides.length);
  if (!at) notFound();
  // `/talk/0` and `/talk/01` are `/talk` and `/talk/1`.
  if (slide?.length && !at.exact) redirect(slideHref(deck.slug, at.slide));
  return (
    <>
      <RefreshOnSave />
      <DeckPlayer canArrange={canArrange} deck={deck} start={at.slide} />
    </>
  );
};

export default Page;
