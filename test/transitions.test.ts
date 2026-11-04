import { describe, expect, it } from "vitest";
import { specOf } from "@/features/transitions/frames";
import { KINDS, resolveTransition } from "@/features/transitions/kinds";
import { revealClip } from "@/features/transitions/reveal";

describe("transitions", () => {
  it("takes the slide's own, else the deck's, else the default", () => {
    expect(resolveTransition("boing", "swipe", 0)).toBe("boing");
    expect(resolveTransition(null, "star", 0)).toBe("star");
    expect(resolveTransition("nope", undefined, 0)).toBe("swipe");
  });

  it("draws a surprise from all of them – never a cut", () => {
    const drawn = new Set(
      Array.from({ length: 200 }, (_, i) =>
        resolveTransition("surprise", null, i / 200)
      )
    );
    expect(drawn.has("cut")).toBe(false);
    expect(drawn.has("surprise" as never)).toBe(false);
    expect(drawn.size).toBe(KINDS.length - 1);
    expect(resolveTransition("surprise", null, 0.99999)).toBeDefined();
  });

  it("has a spec for every kind", () => {
    for (const kind of KINDS) expect(specOf(kind)).toBeDefined();
  });

  it("wipes from nothing to everything", () => {
    for (const kind of [
      "checkerboard",
      "blinds",
      "dissolve",
      "star",
      "heart",
      "clock",
    ] as const) {
      expect(revealClip(kind, 0, 1600, 900)).toBe('path("M0 0Z")');
      expect(revealClip(kind, 0.5, 1600, 900)).toMatch(/^path\("M/);
      expect(revealClip(kind, 1, 1600, 900)).toBe("none");
    }
  });
});
