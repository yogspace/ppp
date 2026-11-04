/**
 * How one slide gives way to the next – picked per slide (how it comes in)
 * or for the whole deck. The good ones, and the ones from PowerPoint 2003.
 * Shared by the admin (the options) and the player (transitions/*.tsx).
 */
export const TRANSITIONS = {
  swipe: "Swipe – pushes the old one aside",
  boing: "Boing – drops in and bounces",
  pop: "Pop – shrinks to a dot, pops out",
  toss: "Toss – the old one is tossed away",
  flip: "Flip – turns over like a card",
  hinge: "Hinge – swings down and drops",
  jelly: "Jelly – wobbles in",
  zoom: "Zoom – flies right through",
  blob: "Blob – a gooey blob covers and reveals",
  confetti: "Confetti – a burst over the change",
  curtain: "Curtain – closes and opens",
  fade: "Fade",
  cut: "Cut – none at all",
  spinner: "💾 Spinner – twirls in, 720°",
  checkerboard: "💾 Checkerboard",
  blinds: "💾 Blinds",
  dissolve: "💾 Dissolve",
  star: "💾 Star wipe",
  heart: "💾 Heart wipe",
  clock: "💾 Clock",
  surprise: "🎲 Surprise me – a different one every time",
} as const;

export type TransitionChoice = keyof typeof TRANSITIONS;

/** What can actually play – “surprise” picks one of these. */
export type TransitionKind = Exclude<TransitionChoice, "surprise">;

export const KINDS = (Object.keys(TRANSITIONS) as TransitionChoice[]).filter(
  (kind): kind is TransitionKind => kind !== "surprise"
);

export const DEFAULT_TRANSITION: TransitionKind = "swipe";

export const isChoice = (value: unknown): value is TransitionChoice =>
  typeof value === "string" && value in TRANSITIONS;

/**
 * The transition a slide comes in with: its own, else the deck's – a
 * surprise drawn anew each time (`random` from 0 to 1). Never a cut by
 * surprise: that one is no fun.
 */
export const resolveTransition = (
  own: unknown,
  deck: unknown,
  random: number
): TransitionKind => {
  const choice = isChoice(own)
    ? own
    : isChoice(deck)
      ? deck
      : DEFAULT_TRANSITION;
  if (choice !== "surprise") return choice;
  const pool = KINDS.filter((kind) => kind !== "cut");
  return pool[Math.min(pool.length - 1, Math.floor(random * pool.length))];
};

export const transitionOptions = () =>
  Object.entries(TRANSITIONS).map(([value, label]) => ({ value, label }));
