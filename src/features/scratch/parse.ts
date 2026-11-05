/**
 * Words to scratch free, marked like a spoiler: `||the secret||`. A piece
 * of text in parts, each plain or secret; a `||` without its pair stays as
 * it is.
 */
export type Part = { text: string; secret: boolean };

const MARK = /\|\|(.+?)\|\|/g;

export const hasSecret = (text: string) => /\|\|.+?\|\|/.test(text);

export const scratchParts = (text: string): Part[] => {
  const parts: Part[] = [];
  let last = 0;
  for (const match of text.matchAll(MARK)) {
    const at = match.index ?? 0;
    if (at > last) parts.push({ text: text.slice(last, at), secret: false });
    parts.push({ text: match[1], secret: true });
    last = at + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), secret: false });
  return parts;
};

/** The text without its marks – what it says once everything is scratched. */
export const unmarked = (text: string) => text.replace(MARK, "$1");
