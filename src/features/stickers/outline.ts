import { contours } from "d3-contour";

/** A closed outline, its points in order (not repeated at the end). */
export type Ring = [number, number][];

/** Twice the signed area of a ring (shoelace). */
const area2 = (ring: Ring) => {
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    sum += x1 * y2 - x2 * y1;
  }
  return sum;
};

export const ringArea = (ring: Ring) => Math.abs(area2(ring)) / 2;

/** Distance of p from the segment a–b. */
const offSegment = (
  p: [number, number],
  a: [number, number],
  b: [number, number]
) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length2 = dx * dx + dy * dy;
  const t =
    length2 === 0
      ? 0
      : Math.max(
          0,
          Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length2)
        );
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
};

/** Ramer–Douglas–Peucker on an open line: points within `epsilon` go. */
const simplifyLine = (points: Ring, epsilon: number): Ring => {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length) {
    const [from, to] = stack.pop() as [number, number];
    let far = -1;
    let farthest = epsilon;
    for (let i = from + 1; i < to; i++) {
      const d = offSegment(points[i], points[from], points[to]);
      if (d > farthest) {
        farthest = d;
        far = i;
      }
    }
    if (far >= 0) {
      keep[far] = 1;
      stack.push([from, far], [far, to]);
    }
  }
  return points.filter((_, i) => keep[i]);
};

/**
 * A ring with fewer points: split at the point farthest from the first, so
 * neither half is degenerate, each half simplified.
 */
export const simplifyRing = (ring: Ring, epsilon: number): Ring => {
  if (ring.length < 8) return ring;
  let far = 0;
  let farthest = -1;
  for (let i = 1; i < ring.length; i++) {
    const d = Math.hypot(ring[i][0] - ring[0][0], ring[i][1] - ring[0][1]);
    if (d > farthest) {
      farthest = d;
      far = i;
    }
  }
  const one = simplifyLine(ring.slice(0, far + 1), epsilon);
  const two = simplifyLine([...ring.slice(far), ring[0]], epsilon);
  return [...one.slice(0, -1), ...two.slice(0, -1)];
};

/**
 * The outlines of a mask – `values` row by row, `width` × `height`, 0 … 1,
 * the shape where it is above one half: only the outer edge of every piece
 * (a die-cut sticker has no holes), small crumbs (under `minShare` of the
 * largest piece) left out, simplified to within `epsilon` grid cells. In
 * grid units, y down.
 */
export const outlineRings = (
  values: ArrayLike<number>,
  width: number,
  height: number,
  { epsilon = 0.45, minShare = 0.02 } = {}
): Ring[] => {
  const [shape] = contours().size([width, height]).thresholds([0.5])(
    Array.from(values)
  );
  if (!shape) return [];
  const rings = shape.coordinates
    .map((polygon) => polygon[0] as Ring | undefined)
    .filter((ring): ring is Ring => Boolean(ring && ring.length >= 4))
    // d3 closes its rings – the repeated first point goes.
    .map((ring) => ring.slice(0, -1) as Ring);
  const areas = rings.map(ringArea);
  const largest = Math.max(0, ...areas);
  return rings
    .filter((_, i) => largest > 0 && areas[i] >= largest * minShare)
    .map((ring) => simplifyRing(ring, epsilon));
};
