import { describe, expect, it } from "vitest";
import {
  outlineRings,
  ringArea,
  simplifyRing,
} from "@/features/stickers/outline";

/** A mask: 1 inside the circles, 0 outside. */
const mask = (w: number, h: number, circles: [number, number, number][]) => {
  const values = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const inside = circles.some(
        ([cx, cy, r]) => Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r
      );
      values[y * w + x] = inside ? 1 : 0;
    }
  }
  return values;
};

describe("a sticker's outline", () => {
  it("traces a disc as one ring of about its area, with few points", () => {
    const rings = outlineRings(mask(100, 100, [[50, 50, 30]]), 100, 100);
    expect(rings).toHaveLength(1);
    expect(ringArea(rings[0])).toBeGreaterThan(Math.PI * 30 * 30 * 0.95);
    expect(ringArea(rings[0])).toBeLessThan(Math.PI * 30 * 30 * 1.05);
    expect(rings[0].length).toBeLessThan(150);
  });

  it("keeps only outer edges – a ring's hole is filled", () => {
    const values = mask(100, 100, [[50, 50, 30]]);
    // A hole in the middle.
    for (let y = 40; y < 60; y++)
      for (let x = 40; x < 60; x++) values[y * 100 + x] = 0;
    expect(outlineRings(values, 100, 100)).toHaveLength(1);
  });

  it("keeps separate pieces, drops crumbs", () => {
    const rings = outlineRings(
      mask(120, 60, [
        [30, 30, 20],
        [90, 30, 20],
        [60, 5, 1],
      ]),
      120,
      60
    );
    expect(rings).toHaveLength(2);
  });

  it("simplifies a ring without losing its shape", () => {
    const ring = Array.from({ length: 400 }, (_, i) => {
      const a = (i / 400) * Math.PI * 2;
      return [Math.cos(a) * 40, Math.sin(a) * 40] as [number, number];
    });
    const simple = simplifyRing(ring, 0.5);
    expect(simple.length).toBeLessThan(80);
    expect(ringArea(simple)).toBeGreaterThan(ringArea(ring) * 0.98);
  });
});
