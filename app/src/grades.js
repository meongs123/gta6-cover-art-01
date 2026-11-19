// grades.js — OKLCH grade + Poster Ink pipeline (spec-grades-poster-ink.md).
//
// Pipeline per panel: photo/demo art -> grade (OKLCH L remapped through the
// grade's 5-stop L curve) -> posterize (5 tones, Bayer 4x4 dither) -> Sobel
// edge ink. Sunset is the default unifying grade.
//
// The spec's posterize rule (§2) fixes each tone's output to the stop's own
// L/C/H, so the graded pixel's hue/chroma are replaced by the stop colour:
// the L curve carries the grade. That is the intended flat poster look —
// photos become drawn poster art, not sunset filters.

export const INK = '#0C0812';

// 5 stops per grade: [L, C, H] in OKLCH (L 0..1, C 0..0.4, H degrees).
export const GRADE_STOPS = {
  sunset: [
    [0.16, 0.05, 280],
    [0.38, 0.1, 320],
    [0.58, 0.14, 25],
    [0.76, 0.12, 55],
    [0.92, 0.06, 70],
  ],
  neon: [
    [0.12, 0.08, 290],
    [0.32, 0.16, 310],
    [0.52, 0.18, 335],
    [0.72, 0.14, 190],
    [0.9, 0.08, 200],
  ],
  teal: [
    [0.14, 0.06, 200],
    [0.35, 0.1, 190],
    [0.55, 0.12, 170],
    [0.74, 0.13, 45],
    [0.91, 0.07, 55],
  ],
  mono: [
    [0.1, 0.01, 260],
    [0.3, 0.015, 260],
    [0.52, 0.02, 260],
    [0.73, 0.015, 260],
    [0.93, 0.01, 260],
  ],
};

export const GRADE_NAMES = ['sunset', 'neon', 'teal', 'mono'];

// Bayer 4x4 ordered dither matrix (spec §3), values 0..15.
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
const DITHER_AMP = 0.12;
const TONE_EDGES = [0.2, 0.4, 0.6, 0.8];

// sRGB (0..255) -> linear light lookup, 256 entries.
const SRGB_TO_LINEAR = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  SRGB_TO_LINEAR[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

// OKLCH (L,C,H) -> sRGB [r,g,b] 0..255, gamut-clamped. Used once per stop.
export function oklchToRgb(L, C, H) {
  const rad = (H * Math.PI) / 180;
  const a = C * Math.cos(rad);
  const b = C * Math.sin(rad);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  const rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  const toSrgb = (v) => {
    const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(c * 255)));
  };
  return [toSrgb(rLin), toSrgb(gLin), toSrgb(bLin)];
}

// Per-grade precomputed tables: L curve (256 entries) + 5 tone RGBs.
const GRADE_TABLES = {};
for (const name of GRADE_NAMES) {
  const stops = GRADE_STOPS[name];
  const curve = new Float32Array(256);
  const knots = [0, 0.25, 0.5, 0.75, 1];
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let seg = 0;
    while (seg < 3 && t > knots[seg + 1]) seg++;
    const t0 = knots[seg];
    const t1 = knots[seg + 1];
    const f = (t - t0) / (t1 - t0);
    curve[i] = stops[seg][0] + (stops[seg + 1][0] - stops[seg][0]) * f;
  }
  GRADE_TABLES[name] = { curve, tones: stops.map(([L, C, H]) => oklchToRgb(L, C, H)) };
}

/**
 * Grade + posterize + dither + edge ink, in place on an ImageData.
 * @param {ImageData} img - panel pixels (premultiplied alpha ignored; panels are opaque)
 * @param {string} gradeName - one of GRADE_NAMES
 * @param {Array<{x:number,y:number,w:number,h:number}>} faceBoxes - pixel rects where
 *   edge ink is halved (faces); coordinates in this ImageData's pixels
 */
export function gradeImageData(img, gradeName, faceBoxes = []) {
  const { curve, tones } = GRADE_TABLES[gradeName] ?? GRADE_TABLES.sunset;
  const { width: W, height: H, data } = img;
  const n = W * H;
  // Pass 1: OKLCH L per pixel (sRGB->linear LUT, matrix, cbrt), graded L stored.
  const lum = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const r = SRGB_TO_LINEAR[data[o]];
    const g = SRGB_TO_LINEAR[data[o + 1]];
    const b = SRGB_TO_LINEAR[data[o + 2]];
    const l = 0.4122214708 * r + 0.5363325363 * g + 0.1070748549 * b;
    const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
    const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787007 * b;
    const l_ = Math.cbrt(l);
    const m_ = Math.cbrt(m);
    const s_ = Math.cbrt(s);
    const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
    lum[i] = curve[Math.max(0, Math.min(255, (L * 255) | 0))];
  }
  // Pass 2: posterize with Bayer dither (position = export-canvas pixel).
  for (let y = 0; y < H; y++) {
    const row = y * W;
    const bayerRow = BAYER[y & 3];
    for (let x = 0; x < W; x++) {
      const i = row + x;
      const dithered = lum[i] + (bayerRow[x & 3] / 16 - 0.5) * DITHER_AMP;
      let tone = 0;
      if (dithered >= TONE_EDGES[3]) tone = 4;
      else if (dithered >= TONE_EDGES[2]) tone = 3;
      else if (dithered >= TONE_EDGES[1]) tone = 2;
      else if (dithered >= TONE_EDGES[0]) tone = 1;
      const [r, g, b] = tones[tone];
      const o = i * 4;
      data[o] = r;
      data[o + 1] = g;
      data[o + 2] = b;
      data[o + 3] = 255;
    }
  }
  // Pass 3: Sobel edge ink on the graded luminance. Ink width scales with
  // export width: 1px at 1080, 2px at 1920 (spec §4).
  const inkRadius = Math.max(1, Math.round(W / 1080));
  const inkMask = new Uint8Array(n);
  for (let y = 1; y < H - 1; y++) {
    const row = y * W;
    for (let x = 1; x < W - 1; x++) {
      const i = row + x;
      const gx =
        -lum[i - W - 1] - 2 * lum[i - 1] - lum[i + W - 1] +
        lum[i - W + 1] + 2 * lum[i + 1] + lum[i + W + 1];
      const gy =
        -lum[i - W - 1] - 2 * lum[i - W] - lum[i - W + 1] +
        lum[i + W - 1] + 2 * lum[i + W] + lum[i + W + 1];
      const g = Math.sqrt(gx * gx + gy * gy) / 4;
      if (g > 0.25) inkMask[i] = 1;
    }
  }
  // Dilate the mask when the export is wide (2px lines at 1920).
  if (inkRadius > 1) {
    const dilated = new Uint8Array(n);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (!inkMask[y * W + x]) continue;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < W && ny >= 0 && ny < H) dilated[ny * W + nx] = 1;
          }
        }
      }
    }
    inkMask.set(dilated);
  }
  const inFace = (x, y) => {
    for (const f of faceBoxes) {
      if (x >= f.x && x < f.x + f.w && y >= f.y && y < f.y + f.h) return true;
    }
    return false;
  };
  for (let y = 0; y < H; y++) {
    const row = y * W;
    for (let x = 0; x < W; x++) {
      const i = row + x;
      if (!inkMask[i]) continue;
      const alpha = inFace(x, y) ? 0.4 : 0.85;
      const o = i * 4;
      // Ink colour #0C0812 (12, 8, 18) blended over the poster tone.
      data[o] = data[o] * (1 - alpha) + 12 * alpha;
      data[o + 1] = data[o + 1] * (1 - alpha) + 8 * alpha;
      data[o + 2] = data[o + 2] * (1 - alpha) + 18 * alpha;
    }
  }
}
