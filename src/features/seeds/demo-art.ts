/**
 * The demo's pictures, drawn by the code as SVG (seeds/demo.ts makes PNGs
 * and JPEGs of them): cute stickers with faces, and a few landscapes as
 * photos. Nothing to download, nothing licensed.
 */

/** A little face: eyes with a shine, a smile, rosy cheeks. */
const face = (cx: number, cy: number, s = 1) => `
  <circle cx="${cx - 34 * s}" cy="${cy}" r="${12 * s}" fill="#1b1b2f"/>
  <circle cx="${cx + 34 * s}" cy="${cy}" r="${12 * s}" fill="#1b1b2f"/>
  <circle cx="${cx - 30 * s}" cy="${cy - 4 * s}" r="${4 * s}" fill="#fff"/>
  <circle cx="${cx + 38 * s}" cy="${cy - 4 * s}" r="${4 * s}" fill="#fff"/>
  <path d="M${cx - 18 * s} ${cy + 22 * s} q${18 * s} ${20 * s} ${36 * s} 0" stroke="#1b1b2f" stroke-width="${8 * s}" fill="none" stroke-linecap="round"/>
  <ellipse cx="${cx - 62 * s}" cy="${cy + 26 * s}" rx="${16 * s}" ry="${10 * s}" fill="#ff7aa8" opacity="0.7"/>
  <ellipse cx="${cx + 62 * s}" cy="${cy + 26 * s}" rx="${16 * s}" ry="${10 * s}" fill="#ff7aa8" opacity="0.7"/>`;

const star = (() => {
  const points = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? 125 : 270;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    return `${300 + Math.cos(a) * r},${320 + Math.sin(a) * r}`;
  }).join(" ");
  return `<polygon points="${points}" fill="#ffc31f" stroke="#ff9f1c" stroke-width="18" stroke-linejoin="round"/>${face(300, 330)}`;
})();

/** The stickers – 600 × 600, transparent around them. */
export const STICKERS: Record<string, string> = {
  star,
  heart: `<path d="M300 520 C120 400 60 300 90 200 C120 100 250 90 300 190 C350 90 480 100 510 200 C540 300 480 400 300 520Z" fill="#ff4f87"/>
    <path d="M170 190 q30 -50 80 -40" stroke="#fff" stroke-width="22" fill="none" stroke-linecap="round" opacity="0.8"/>${face(300, 300, 0.9)}`,
  rainbow: ["#ff5f6d", "#ffb347", "#ffe66d", "#5fd38d", "#5fa8ff", "#a77bff"]
    .map(
      (c, i) =>
        `<path d="M${60 + i * 34} 420 A${240 - i * 34} ${240 - i * 34} 0 0 1 ${540 - i * 34} 420" stroke="${c}" stroke-width="36" fill="none"/>`
    )
    .join("")
    .concat(
      `<circle cx="95" cy="430" r="62" fill="#fff"/><circle cx="150" cy="445" r="48" fill="#fff"/><circle cx="505" cy="430" r="62" fill="#fff"/><circle cx="450" cy="445" r="48" fill="#fff"/>`
    ),
  planet: `<ellipse cx="300" cy="320" rx="270" ry="70" fill="none" stroke="#ffb3d1" stroke-width="34" transform="rotate(-18 300 320)"/>
    <circle cx="300" cy="300" r="170" fill="#8b5cf6"/>
    <circle cx="240" cy="230" r="36" fill="#a78bfa"/><circle cx="360" cy="370" r="24" fill="#a78bfa"/>
    <path d="M60 380 A270 70 -18 0 0 540 260" stroke="#ffb3d1" stroke-width="34" fill="none" transform="rotate(-18 300 320) rotate(18 300 320)"/>
    ${face(300, 310, 0.8)}`,
  icecream: `<path d="M210 300 L300 560 L390 300Z" fill="#f4b26b"/>
    <path d="M230 330 L370 330 M245 380 L355 380 M262 430 L338 430" stroke="#d98c3f" stroke-width="12"/>
    <circle cx="300" cy="230" r="120" fill="#ff9ecb"/><circle cx="215" cy="290" r="62" fill="#ff9ecb"/><circle cx="385" cy="290" r="62" fill="#ff9ecb"/>
    <rect x="250" y="150" width="14" height="40" rx="7" fill="#5fd38d" transform="rotate(30 257 170)"/>
    <rect x="330" y="170" width="14" height="40" rx="7" fill="#ffe66d" transform="rotate(-40 337 190)"/>
    <rect x="290" y="120" width="14" height="40" rx="7" fill="#5fa8ff" transform="rotate(80 297 140)"/>
    <circle cx="300" cy="100" r="34" fill="#ff4f5e"/>${face(300, 250, 0.75)}`,
  ghost: `<path d="M150 520 V280 A150 150 0 0 1 450 280 V520 l-50 -40 -50 40 -50 -40 -50 40 -50 -40Z" fill="#f2f0ff"/>
    ${face(300, 290, 0.9)}`,
};

/** A few “photos” for the gallery – little landscapes, their size in each. */
export const PHOTOS: Record<string, string> = {
  sunset: `<rect width="800" height="600" fill="#ffb4a2"/><circle cx="400" cy="360" r="120" fill="#ff6b6b"/><rect y="380" width="800" height="220" fill="#5f6caf"/><path d="M0 420 q100 -20 200 0 t200 0 t200 0 t200 0 V600 H0Z" fill="#4a55a2"/>`,
  hills: `<rect width="800" height="600" fill="#bde0fe"/><circle cx="640" cy="130" r="60" fill="#ffd166"/><path d="M0 420 Q200 260 420 400 T800 360 V600 H0Z" fill="#80ed99"/><path d="M0 500 Q260 380 520 480 T800 460 V600 H0Z" fill="#38b000"/>`,
  night: `<rect width="800" height="600" fill="#22223b"/><circle cx="560" cy="160" r="70" fill="#f2e9e4"/><circle cx="590" cy="140" r="62" fill="#22223b"/>${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 197) % 800}" cy="${(i * 89) % 380}" r="${1 + (i % 3)}" fill="#fff"/>`).join("")}<path d="M0 470 L160 330 L300 450 L470 290 L640 440 L800 360 V600 H0Z" fill="#4a4e69"/>`,
  sea: `<rect width="600" height="800" fill="#caf0f8"/><rect y="420" width="600" height="380" fill="#48cae4"/><path d="M0 460 q75 -25 150 0 t150 0 t150 0 t150 0" stroke="#fff" stroke-width="10" fill="none"/><path d="M220 420 L300 250 L380 420Z" fill="#fff"/><rect x="296" y="250" width="8" height="190" fill="#6d597a"/><rect x="200" y="420" width="200" height="40" rx="18" fill="#e56b6f"/>`,
};

/** An SVG document around a drawing. */
export const svg = (inner: string, width = 600, height = 600) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${inner}</svg>`;
