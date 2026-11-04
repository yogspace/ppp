import { describe, expect, it } from "vitest";
import {
  arrange,
  clampPlacement,
  defaultPlacement,
  readArrangement,
  readArrangeRequest,
} from "@/features/stickers/arrangement";

describe("sticker placements", () => {
  it("gives every sticker a default spot on the stage, turned a little", () => {
    for (let i = 0; i < 25; i++) {
      const p = defaultPlacement(i, 1);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(1);
      expect(Math.abs(p.r)).toBeLessThanOrEqual(20);
    }
  });

  it("keeps wide and tall stickers about as big as square ones", () => {
    const square = defaultPlacement(0, 1);
    const wide = defaultPlacement(0, 4);
    const tall = defaultPlacement(0, 0.25);
    expect(wide.w).toBeGreaterThan(square.w);
    expect(tall.w).toBeLessThan(square.w);
    expect(defaultPlacement(0, Number.NaN).w).toBe(square.w);
  });

  it("clamps a placement near the stage, its turn into (-180, 180]", () => {
    expect(clampPlacement({ x: 5, y: -3, w: 0, r: 540 })).toEqual({
      x: 1.2,
      y: -0.2,
      w: 0.03,
      r: 180,
    });
  });
});

describe("arranging", () => {
  const ids = new Set(["a", "b"]);

  it("reads only sound entries from what is stored", () => {
    expect(
      readArrangement({
        a: { x: 0.5, y: 0.5, w: 0.2, r: 0 },
        b: { x: "no" },
        "../c": { x: 0, y: 0, w: 0.1, r: 0 },
      })
    ).toEqual({ a: { x: 0.5, y: 0.5, w: 0.2, r: 0 } });
    expect(readArrangement(null)).toEqual({});
    expect(readArrangement([1, 2])).toEqual({});
  });

  it("reads a move from the page – or nothing", () => {
    expect(readArrangeRequest({ sticker: "a", placement: null })).toEqual({
      sticker: "a",
      placement: null,
    });
    expect(
      readArrangeRequest({ sticker: "a", placement: { x: 1 } })
    ).toBeNull();
    expect(readArrangeRequest({ sticker: "", placement: null })).toBeNull();
    expect(readArrangeRequest("a")).toBeNull();
  });

  it("sets one sticker, keeps the others, drops the gone", () => {
    const stored = {
      a: { x: 0.1, y: 0.1, w: 0.1, r: 0 },
      gone: { x: 0.2, y: 0.2, w: 0.1, r: 0 },
    };
    const next = arrange(stored, ids, "b", { x: 0.7, y: 0.3, w: 0.2, r: 10 });
    expect(next).toEqual({
      a: { x: 0.1, y: 0.1, w: 0.1, r: 0 },
      b: { x: 0.7, y: 0.3, w: 0.2, r: 10 },
    });
  });

  it("puts a sticker back on its default spot with null", () => {
    const stored = { a: { x: 0.1, y: 0.1, w: 0.1, r: 0 } };
    expect(arrange(stored, ids, "a", null)).toEqual({});
  });

  it("never places a sticker the document doesn't have", () => {
    expect(arrange({}, ids, "zz", { x: 0, y: 0, w: 0.1, r: 0 })).toEqual({});
  });
});
