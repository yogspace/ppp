/**
 * The wipes: the new slide shown through a shape that grows over the old
 * one – as a CSS clip path (`path()`, in the slide's px) for a progress `p`
 * from 0 to 1. PowerPoint 2003 at its finest.
 */

export type RevealKind =
  | "checkerboard"
  | "blinds"
  | "dissolve"
  | "star"
  | "heart"
  | "clock";

type Reveal = (p: number, width: number, height: number) => string;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const n = (v: number) => Math.round(v * 10) / 10;

const rect = (x: number, y: number, w: number, h: number) =>
  w <= 0 || h <= 0 ? "" : `M${n(x)} ${n(y)}h${n(w)}v${n(h)}h${n(-w)}Z`;

const polygon = (points: [number, number][]) =>
  points.length < 3
    ? ""
    : `M${points.map(([x, y]) => `${n(x)} ${n(y)}`).join("L")}Z`;

/** A stable number from 0 to 1 for a cell – the dissolve's order. */
const hash = (i: number, j: number) => {
  const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const checkerboard: Reveal = (p, w, h) => {
  const cols = 8;
  const rows = Math.max(1, Math.round((cols * h) / w));
  const cw = w / cols;
  const ch = h / rows;
  let d = "";
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      // Every other cell first, then the rest – each wiping to the right.
      const share = clamp01(p * 2 - ((i + j) % 2));
      d += rect(i * cw, j * ch, cw * share + (share > 0 ? 0.5 : 0), ch + 0.5);
    }
  }
  return d;
};

const blinds: Reveal = (p, w, h) => {
  const count = 9;
  const sh = h / count;
  let d = "";
  for (let j = 0; j < count; j++) d += rect(0, j * sh, w, sh * p + 0.5);
  return d;
};

const dissolve: Reveal = (p, w, h) => {
  const cols = 28;
  const rows = Math.max(1, Math.round((cols * h) / w));
  const cw = w / cols;
  const ch = h / rows;
  let d = "";
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      if (p * 1.05 > hash(i, j)) d += rect(i * cw, j * ch, cw + 0.5, ch + 0.5);
    }
  }
  return d;
};

const star: Reveal = (p, w, h) => {
  const r = p * Math.hypot(w, h) * 1.25;
  const turn = -Math.PI / 2 + p * 0.6;
  const points: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 ? r * 0.45 : r;
    const a = turn + (i / 10) * Math.PI * 2;
    points.push([w / 2 + Math.cos(a) * radius, h / 2 + Math.sin(a) * radius]);
  }
  return polygon(points);
};

const heart: Reveal = (p, w, h) => {
  // The classic heart curve, about 34 units across.
  const s = (p * Math.max(w, h) * 2.6) / 34;
  const points: [number, number][] = [];
  for (let i = 0; i < 56; i++) {
    const t = (i / 56) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);
    points.push([w / 2 + x * s, h / 2 - (y + 2) * s]);
  }
  return polygon(points);
};

const clock: Reveal = (p, w, h) => {
  const r = Math.hypot(w, h);
  const sweep = p * Math.PI * 2;
  const points: [number, number][] = [[w / 2, h / 2]];
  // From twelve o'clock, clockwise.
  for (let a = 0; a < sweep; a += Math.PI / 30) {
    points.push([w / 2 + Math.sin(a) * r, h / 2 - Math.cos(a) * r]);
  }
  points.push([w / 2 + Math.sin(sweep) * r, h / 2 - Math.cos(sweep) * r]);
  return polygon(points);
};

const REVEALS: Record<RevealKind, Reveal> = {
  checkerboard,
  blinds,
  dissolve,
  star,
  heart,
  clock,
};

/** The clip path at `p` – nothing at 0, everything (none) from 1 on. */
export const revealClip = (
  kind: RevealKind,
  p: number,
  width: number,
  height: number
) => {
  if (p >= 1 || !width || !height) return "none";
  const d = p <= 0 ? "" : REVEALS[kind](p, width, height);
  return `path("${d || "M0 0Z"}")`;
};
