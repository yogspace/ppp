import { describe, expect, it } from "vitest";
import {
  backward,
  forward,
  jump,
  slideFromPath,
  slideFromSegments,
  slideHref,
} from "@/features/player/steps";

// Three slides; the second holds two clicks (a List, one click per point).
const steps = [0, 2, 0];

describe("going through a deck", () => {
  it("goes on through a slide's clicks, then to the next slide", () => {
    let pos = { slide: 0, step: 0 };
    const seen: string[] = [];
    for (let i = 0; i < 6; i++) {
      pos = forward(steps, pos);
      seen.push(`${pos.slide}.${pos.step}`);
    }
    expect(seen).toEqual(["1.0", "1.1", "1.2", "2.0", "2.0", "2.0"]);
  });

  it("goes back a click, else to the slide before – shown whole", () => {
    expect(backward(steps, { slide: 1, step: 2 })).toEqual({
      slide: 1,
      step: 1,
    });
    expect(backward(steps, { slide: 2, step: 0 })).toEqual({
      slide: 1,
      step: 2,
    });
    expect(backward(steps, { slide: 0, step: 0 })).toEqual({
      slide: 0,
      step: 0,
    });
  });

  it("jumps to a slide's start, within the deck", () => {
    expect(jump(steps, 1)).toEqual({ slide: 1, step: 0 });
    expect(jump(steps, 9)).toEqual({ slide: 2, step: 0 });
    expect(jump(steps, -1)).toEqual({ slide: 0, step: 0 });
  });
});

describe("a slide's address", () => {
  it("is the deck's own for the first, then /slug/n", () => {
    expect(slideHref("talk", 0)).toBe("/talk");
    expect(slideHref("talk", 3)).toBe("/talk/3");
  });

  it("reads /slug and /slug/n – 0 and leading zeros only point the way", () => {
    expect(slideFromSegments([], 4)).toEqual({ slide: 0, exact: true });
    expect(slideFromSegments(["2"], 4)).toEqual({ slide: 2, exact: true });
    expect(slideFromSegments(["0"], 4)).toEqual({ slide: 0, exact: false });
    expect(slideFromSegments(["02"], 4)).toEqual({ slide: 2, exact: false });
  });

  it("names nothing past the end, nor anything else", () => {
    expect(slideFromSegments(["4"], 4)).toBeNull();
    expect(slideFromSegments(["x"], 4)).toBeNull();
    expect(slideFromSegments(["1", "2"], 4)).toBeNull();
  });

  it("finds the slide in a path of the deck only", () => {
    expect(slideFromPath("/talk/2", "talk", 4)).toBe(2);
    expect(slideFromPath("/talk", "talk", 4)).toBe(0);
    expect(slideFromPath("/talkative/2", "talk", 4)).toBeNull();
  });
});
