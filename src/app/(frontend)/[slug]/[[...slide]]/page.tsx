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

type Props = {
  params: Promise<{ slug: string; slide?: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

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
  const { slug, slide } = await params;
  const deck = await find(slug);
  if (!deck) return {};
  // Shared, each slide shows itself: its own picture (og/[slug]/[slide]).
  const at = slideFromSegments(slide, deck.slides?.length ?? 1)?.slide ?? 0;
  const image = {
    url: `/og/${deck.slug}/${at}?v=${encodeURIComponent(String(deck.updatedAt))}`,
    width: 1200,
    height: 630,
    alt: deck.title,
  };
  return {
    title: deck.title,
    openGraph: { title: deck.title, type: "website", images: [image] },
    twitter: {
      card: "summary_large_image",
      title: deck.title,
      images: [image],
    },
  };
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
const Page = async ({ params, searchParams }: Props) => {
  const { slug, slide } = await params;
  // `?still`: just a picture of the slide (the admin's preview strip).
  const still = (await searchParams)?.still !== undefined;
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
        still={still}
      />
    </>
  );
};

export default Page;
