import type { Metadata, Viewport } from "next";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { RefreshOnSave } from "@/components/refresh-on-save";
import { deckData } from "@/features/decks/data";
import { DeckPlayer } from "@/features/player/deck-player";
import { slideFromSegments, slideHref } from "@/features/player/steps";
import { SLUG } from "@/features/slug/slug";
import { isDark } from "@/features/themes/theme";
import { payload, viewer } from "@/lib/payload";

// Read anew on every request: what was saved in the admin shows at once.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string; slide?: string[] }> };

/** The deck at this address. */
const find = cache(async (slug: string) => {
  if (!SLUG.test(slug)) return null;
  const { docs } = await (await payload()).find({
    collection: "decks",
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
  });
  return docs[0] ?? null;
});

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const deck = await find((await params).slug);
  return deck ? { title: deck.title } : {};
};

/**
 * The browser's own color – Safari's bars on an iPhone – from the slide the
 * address opens, already in the page as it comes (as in the portfolio); the
 * player follows it from slide to slide (player/document-color.ts).
 */
export const generateViewport = async ({
  params,
}: Props): Promise<Viewport> => {
  const { slug, slide } = await params;
  const found = await find(slug);
  if (!found) return {};
  const deck = deckData(found);
  const at = slideFromSegments(slide, deck.slides.length);
  const bg = deck.slides[at?.slide ?? 0]?.look.bg;
  return bg
    ? { themeColor: bg, colorScheme: isDark(bg) ? "dark" : "light" }
    : {};
};

/**
 * A deck – `/talk` its first slide, `/talk/1` the second … A greeting card
 * is a deck of one Card slide.
 */
const Page = async ({ params }: Props) => {
  const { slug, slide } = await params;
  const found = await find(slug);
  if (!found) notFound();
  const deck = deckData(found);
  const at = slideFromSegments(slide, deck.slides.length);
  if (!at) notFound();
  // `/talk/0` and `/talk/01` are `/talk` and `/talk/1`.
  if (slide?.length && !at.exact) redirect(slideHref(deck.slug, at.slide));
  return (
    <>
      <RefreshOnSave />
      <DeckPlayer
        canArrange={Boolean(await viewer())}
        deck={deck}
        start={at.slide}
      />
    </>
  );
};

export default Page;
