import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { lookOf } from "@/features/themes/look";
import { lookVars } from "@/features/themes/theme";
import { payload, viewer } from "@/lib/payload";
import type { Theme } from "@/payload-types";

export const dynamic = "force-dynamic";

type Tile = {
  id: string;
  href: string;
  title: string;
  note: string;
  theme: string | Theme | null | undefined;
};

const TILTS = [-2.5, 1.8, -1.2, 2.6, -1.8, 1.2];

/**
 * The front page. For everyone: just the word mark. Logged in: everything
 * I made – decks and cards (a deck of one Card slide), each in its theme –
 * and the way to make more.
 */
const Home = async () => {
  const user = await viewer();
  if (!user) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#efeff5] text-[#0b1533]">
        <Wordmark className="font-sans text-[34vmin] leading-none font-bold tracking-tight" />
      </main>
    );
  }
  const local = await payload();
  const decks = await local.find({
    collection: "decks",
    depth: 1,
    limit: 200,
    sort: "-updatedAt",
  });
  const tiles: Tile[] = decks.docs.map((deck) => {
    const slides = deck.slides ?? [];
    const card = slides.length === 1 && slides[0].blockType === "card";
    return {
      id: deck.id,
      href: `/${deck.slug}`,
      title: deck.title,
      note: card ? "Card" : `Deck · ${slides.length} slides`,
      theme: deck.theme,
    };
  });

  return (
    <main className="min-h-dvh bg-[#efeff5] px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-16 text-[#0b1533] sm:px-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <Wordmark className="font-sans text-[22vmin] leading-[0.8] font-bold tracking-tight sm:text-[9rem]" />
        <nav className="flex gap-2 pb-3 font-sans text-sm font-semibold">
          <a
            className="rounded-full bg-[#0b1533] px-4 py-2.5 text-white transition-[scale] duration-200 ease-spring hover:scale-105 active:scale-95"
            href="/admin/collections/decks/create"
          >
            + Deck
          </a>
          <a
            className="rounded-full px-4 py-2.5 ring-2 ring-[#0b1533]/15 transition-[scale] duration-200 ease-spring hover:scale-105 active:scale-95"
            href="/admin"
          >
            Admin
          </a>
        </nav>
      </header>
      {tiles.length === 0 ? (
        <p className="mt-16 font-sans text-xl opacity-70">
          Nothing yet – make a deck or a card.
        </p>
      ) : (
        <ul className="mt-10 grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-6">
          {tiles.map((tile, i) => {
            const look = lookOf(tile.theme);
            return (
              <li key={tile.id}>
                <Link
                  className="slide group flex aspect-[4/3] flex-col justify-between rounded-[1.6rem] p-5 shadow-[0_0.6rem_1.4rem_-0.6rem_rgb(4_8_60/0.4)] transition-[rotate,scale,translate] duration-300 ease-spring hover:-translate-y-1 hover:scale-[1.03] hover:rotate-0 active:scale-95"
                  data-font={look.font}
                  href={tile.href}
                  style={{
                    ...lookVars(look),
                    background: look.bg,
                    rotate: `${TILTS[i % TILTS.length]}deg`,
                  }}
                >
                  <span className="headline text-[2.4rem] break-words">
                    {tile.title}
                  </span>
                  <span className="copy text-sm opacity-70">{tile.note}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
};

export default Home;
