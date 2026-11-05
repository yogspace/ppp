import { deckData } from "@/features/decks/data";
import { sharePreview } from "@/features/share/preview";
import { SLUG } from "@/features/slug/slug";
import { payload } from "@/lib/payload";

/**
 * A slide's share picture – what a messenger shows with its link (the
 * slide's page names it in its metadata). Kept a day by browsers and
 * messengers; a new version of the deck has a new address (`?v=`).
 */
export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ slug: string; slide: string }> }
) => {
  const { slug, slide } = await params;
  const index = Number(slide);
  if (!(SLUG.test(slug) && Number.isInteger(index) && index >= 0)) {
    return new Response("Not found", { status: 404 });
  }
  const { docs } = await (await payload()).find({
    collection: "decks",
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
  });
  const found = docs[0];
  if (!found) return new Response("Not found", { status: 404 });
  const image = await sharePreview(deckData(found), index);
  image.headers.set(
    "Cache-Control",
    "public, max-age=86400, stale-while-revalidate=604800"
  );
  return image;
};
