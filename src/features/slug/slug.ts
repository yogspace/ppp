/**
 * A deck's or card's address: ppp.mxwr.de/<slug>. Decks and cards share the
 * one namespace – a slug belongs to one of them only.
 */

export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Taken by the site itself. */
export const RESERVED = new Set(["admin", "api", "next", "fonts", "designs"]);

const UMLAUTS: Record<string, string> = {
  ä: "ae",
  ö: "oe",
  ü: "ue",
  ß: "ss",
};

/** A title as an address: small letters, digits, dashes – at most 60. */
export const slugify = (title: string) =>
  title
    .toLowerCase()
    .replace(/[äöüß]/g, (letter) => UMLAUTS[letter] ?? letter)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");

/** What is wrong with a slug – or null when it is fine. */
export const slugProblem = (slug: string): string | null => {
  if (!SLUG.test(slug)) {
    return "Small letters, digits and single dashes only – like “my-talk”.";
  }
  if (slug.length > 60) return "At most 60 characters.";
  if (RESERVED.has(slug)) return `“${slug}” is taken by the site itself.`;
  return null;
};
