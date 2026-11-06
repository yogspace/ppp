import { describe, expect, it } from "vitest";
import {
  arrange,
  clampPlacement,
  defaultPlacement,
  placementFor,
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
  const p = (x: number) => ({ x, y: 0.5, w: 0.2, r: 0 });

  it("reads only sound entries – one place from before is the wide one", () => {
    expect(
      readArrangement({
        a: p(0.5),
        b: { x: "no" },
        c: { wide: p(0.1), tall: { x: "no" } },
        "../d": p(0),
      })
    ).toEqual({ a: { wide: p(0.5) }, c: { wide: p(0.1) } });
    expect(readArrangement(null)).toEqual({});
    expect(readArrangement([1, 2])).toEqual({});
  });

  it("an upright stage takes the wide place until it has its own", () => {
    expect(placementFor({ wide: p(0.1) }, "tall")).toEqual(p(0.1));
    expect(placementFor({ wide: p(0.1), tall: p(0.9) }, "tall")).toEqual(
      p(0.9)
    );
    expect(placementFor({ tall: p(0.9) }, "wide")).toBeNull();
    expect(placementFor(undefined, "wide")).toBeNull();
  });

  it("reads a move from the page – or nothing", () => {
    expect(readArrangeRequest({ sticker: "a", placement: null })).toEqual({
      sticker: "a",
      placement: null,
      shape: "wide",
    });
    expect(
      readArrangeRequest({ sticker: "a", placement: p(0.3), shape: "tall" })
    ).toEqual({ sticker: "a", placement: p(0.3), shape: "tall" });
    expect(
      readArrangeRequest({ sticker: "a", placement: { x: 1 } })
    ).toBeNull();
    expect(readArrangeRequest({ sticker: "", placement: null })).toBeNull();
    expect(readArrangeRequest("a")).toBeNull();
  });

  it("sets one sticker on one shape, keeps the rest, drops the gone", () => {
    const stored = { a: p(0.1), gone: p(0.2) };
    expect(arrange(stored, ids, "b", p(0.7))).toEqual({
      a: { wide: p(0.1) },
      b: { wide: p(0.7) },
    });
    expect(arrange(stored, ids, "a", p(0.8), "tall")).toEqual({
      a: { wide: p(0.1), tall: p(0.8) },
    });
  });

  it("puts a sticker back on one shape with null – the other stays", () => {
    const stored = { a: { wide: p(0.1), tall: p(0.8) } };
    expect(arrange(stored, ids, "a", null, "tall")).toEqual({
      a: { wide: p(0.1) },
    });
    expect(arrange({ a: p(0.1) }, ids, "a", null)).toEqual({});
  });

  it("never places a sticker the document doesn't have", () => {
    expect(arrange({}, ids, "zz", p(0))).toEqual({});
  });
});
