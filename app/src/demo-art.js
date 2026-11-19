// demo-art.js — VICE KEY / gta6-cover-art-01
// Procedural flat-vector poster art. 100% code-drawn, original content.
// No image model, no external assets, no network, no text inside scenes.
// Palette only: violet #7C3AED, magenta #F0527A, orange #FF9A5C,
// peach #FFD9A0, cream #FFF3D6, sun yellow #FFC21A, dark ink #0C0812,
// teal water #19A7CE, deep sea #0E5E7A, pink bike #FF5CA8,
// torii red #D9382B, palm silhouette #1B2A24, sand #E8C9A0,
// dusk purple #6B4E9E, night #14102A, sky blue #7EC8E3
// (+ translucent / darkened / lightened derivatives of those only).

export const DEMO_SCENES = ['boat', 'bike', 'neon', 'hero', 'yatai', 'torii', 'car', 'beach'];

const INK = '#0C0812';
const VIOLET = '#7C3AED';
const MAGENTA = '#F0527A';
const ORANGE = '#FF9A5C';
const PEACH = '#FFD9A0';
const CREAM = '#FFF3D6';
const SUN = '#FFC21A';
const TEAL = '#19A7CE';
const DEEP = '#0E5E7A';
const BIKE = '#FF5CA8';
const TORII = '#D9382B';
const PALM = '#1B2A24';
const SAND = '#E8C9A0';
const DUSK = '#6B4E9E';
const NIGHT = '#14102A';
const SKY = '#7EC8E3';

// ---------------------------------------------------------------- helpers
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEEDS = {
  boat: 1101, bike: 2202, neon: 3303, hero: 4404,
  yatai: 5505, torii: 6606, car: 7707, beach: 8808,
};

function rngFor(scene) {
  return mulberry32(SEEDS[scene] || 9999);
}

function lerp(a, b, t) { return a + (b - a) * t; }

function vgrad(ctx, x, y, w, h, stops) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

function hgrad(ctx, x, y, w, h, stops) {
  const g = ctx.createLinearGradient(x, y, x + w, y);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

function circle(ctx, x, y, r, fill, stroke, lw) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) {
    ctx.lineWidth = lw || 2; ctx.strokeStyle = stroke;
    ctx.lineJoin = 'round'; ctx.stroke();
  }
}

function ellipse(ctx, x, y, rx, ry, fill, stroke, lw) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) {
    ctx.lineWidth = lw || 2; ctx.strokeStyle = stroke; ctx.stroke();
  }
}

function poly(ctx, pts, fill, stroke, lw, join) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) {
    ctx.lineWidth = lw || 2; ctx.strokeStyle = stroke;
    ctx.lineJoin = join || 'round'; ctx.stroke();
  }
}

function rr(ctx, x, y, w, h, r, fill, stroke, lw) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.arcTo(x + w, y, x + w, y + rad, rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad);
  ctx.lineTo(x + rad, y + h);
  ctx.arcTo(x, y + h, x, y + h - rad, rad);
  ctx.lineTo(x, y + rad);
  ctx.arcTo(x, y, x + rad, y, rad);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lw || 2; ctx.strokeStyle = stroke; ctx.stroke(); }
}

function seg(ctx, x1, y1, x2, y2, color, lw, cap) {
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.strokeStyle = color; ctx.lineWidth = lw || 2;
  ctx.lineCap = cap || 'round'; ctx.stroke();
}

function curve(ctx, pts, color, lw, fill) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
  }
  ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  else { ctx.strokeStyle = color; ctx.lineWidth = lw || 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); }
}

function softCloud(ctx, x, y, s, fill, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha == null ? 0.9 : alpha;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, s * 1.0, s * 0.34, 0, 0, Math.PI * 2);
  ctx.ellipse(x - s * 0.55, y + s * 0.08, s * 0.55, s * 0.26, 0, 0, Math.PI * 2);
  ctx.ellipse(x + s * 0.55, y + s * 0.08, s * 0.55, s * 0.26, 0, 0, Math.PI * 2);
  ctx.ellipse(x, y - s * 0.16, s * 0.5, s * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function sunDisc(ctx, x, y, r, core, halo) {
  circle(ctx, x, y, r * 1.45, halo, null);
  circle(ctx, x, y, r, core, INK, Math.max(2, r * 0.05));
}

function drawPalm(ctx, x, y, s, lean, color, frond) {
  // Trunk: gentle S-curve, leaning by `lean` (-1..1).
  const topX = x + lean * s * 0.55;
  const topY = y - s * 1.05;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - s * 0.05, y);
  ctx.quadraticCurveTo(x + lean * s * 0.18, y - s * 0.55, topX, topY);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(3, s * 0.07);
  ctx.stroke();
  // Trunk rings.
  ctx.lineWidth = Math.max(1, s * 0.015);
  ctx.strokeStyle = color;
  for (let i = 1; i <= 4; i++) {
    const t = i / 5;
    const px = lerp(lerp(x, x + lean * s * 0.18, t), topX, t * t);
    const py = lerp(y, topY, t);
    seg(ctx, px - s * 0.05, py, px + s * 0.05, py, color, Math.max(1, s * 0.02));
  }
  // Fronds: 7 arcs fanning from the crown.
  const fc = frond || color;
  ctx.lineWidth = Math.max(2, s * 0.045);
  ctx.strokeStyle = fc;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * (0.08 + i * 0.14);
    const len = s * (0.62 + (i % 3) * 0.08);
    const ex = topX + Math.cos(a) * len;
    const ey = topY + Math.sin(a) * len * 0.55 + s * 0.22;
    const mx = topX + Math.cos(a) * len * 0.55;
    const my = topY + Math.sin(a) * len * 0.28 - s * 0.06;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();
  }
  // Coconuts.
  circle(ctx, topX - s * 0.05, topY + s * 0.06, s * 0.05, fc, null);
  circle(ctx, topX + s * 0.05, topY + s * 0.07, s * 0.045, fc, null);
  ctx.restore();
}

function skyline(ctx, x, y, w, h, color, rng, lit) {
  // Flat distant skyline: seeded rectangles + a few lit windows.
  let cx = x;
  while (cx < x + w) {
    const bw = w * (0.06 + rng() * 0.09);
    const bh = h * (0.35 + rng() * 0.65);
    ctx.fillStyle = color;
    ctx.fillRect(cx, y + h - bh, bw, bh);
    if (lit) {
      ctx.fillStyle = SUN;
      const rows = Math.floor(bh / (h * 0.14));
      const cols = Math.floor(bw / (w * 0.03));
      for (let rI = 0; rI < rows; rI++) {
        for (let cI = 0; cI < cols; cI++) {
          if (rng() < 0.28) {
            ctx.fillRect(cx + w * 0.012 + cI * w * 0.03, y + h - bh + h * 0.07 + rI * h * 0.14, w * 0.014, h * 0.06);
          }
        }
      }
    }
    cx += bw + w * 0.008;
  }
}

function waveBand(ctx, x, y, w, h, color, rng, amp) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const px = x + (w * i) / steps;
    const py = y + Math.sin(i * 1.7 + rng() * 0.4) * amp;
    ctx.lineTo(px, py);
  }
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- 1. boat
function drawBoat(ctx, x, y, w, h, rng) {
  // Sky: peach top -> sky blue horizon.
  ctx.fillStyle = vgrad(ctx, x, y, w, h * 0.52, [[0, PEACH], [0.55, CREAM], [1, SKY]]);
  ctx.fillRect(x, y, w, h * 0.52);
  sunDisc(ctx, x + w * 0.78, y + h * 0.16, h * 0.075, SUN, PEACH);
  softCloud(ctx, x + w * 0.22, y + h * 0.12, w * 0.07, CREAM, 0.95);
  softCloud(ctx, x + w * 0.52, y + h * 0.07, w * 0.05, CREAM, 0.85);
  softCloud(ctx, x + w * 0.68, y + h * 0.24, w * 0.045, CREAM, 0.7);
  // Distant island + palms on the horizon line.
  const hz = y + h * 0.52;
  ctx.fillStyle = DUSK;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.06, hz);
  ctx.quadraticCurveTo(x + w * 0.16, hz - h * 0.09, x + w * 0.30, hz);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = PALM;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.62, hz);
  ctx.quadraticCurveTo(x + w * 0.70, hz - h * 0.07, x + w * 0.82, hz - h * 0.02);
  ctx.quadraticCurveTo(x + w * 0.88, hz - h * 0.06, x + w * 0.96, hz);
  ctx.closePath(); ctx.fill();
  drawPalm(ctx, x + w * 0.70, hz, h * 0.11, 0.25, PALM);
  drawPalm(ctx, x + w * 0.86, hz, h * 0.085, -0.3, PALM);
  // Sea: teal -> deep sea.
  ctx.fillStyle = vgrad(ctx, x, hz, w, h - hz, [[0, TEAL], [0.6, DEEP], [1, '#0B4A63']]);
  ctx.fillRect(x, hz, w, h - hz);
  // Sun glitter path on the water.
  ctx.save(); ctx.globalAlpha = 0.55;
  for (let i = 0; i < 7; i++) {
    const gy = hz + h * 0.05 + i * h * 0.055;
    const gw = w * (0.05 + i * 0.012);
    ctx.fillStyle = SUN;
    ctx.fillRect(x + w * 0.78 - gw / 2, gy, gw, h * 0.012);
  }
  ctx.restore();
  // Wave bands.
  waveBand(ctx, x, hz + h * 0.10, w, h * 0.05, 'rgba(255,243,214,0.35)', rng, h * 0.008);
  waveBand(ctx, x, hz + h * 0.24, w, h * 0.05, 'rgba(12,8,18,0.18)', rng, h * 0.01);
  waveBand(ctx, x, hz + h * 0.36, w, h * 0.05, 'rgba(255,243,214,0.28)', rng, h * 0.008);
  // Wooden fishing boat (traditional, curved bow + stern).
  const bx = x + w * 0.5, by = hz + h * 0.16, bw = w * 0.52, bh = h * 0.13;
  // Reflection.
  ctx.save(); ctx.globalAlpha = 0.3;
  poly(ctx, [[bx - bw * 0.42, by + bh * 0.95], [bx + bw * 0.44, by + bh * 0.95],
    [bx + bw * 0.34, by + bh * 1.55], [bx - bw * 0.32, by + bh * 1.55]], ORANGE, null);
  ctx.restore();
  // Mast + cream sail.
  seg(ctx, bx - bw * 0.06, by - bh * 2.1, bx - bw * 0.06, by, INK, Math.max(3, w * 0.008));
  poly(ctx, [[bx - bw * 0.05, by - bh * 2.05], [bx + bw * 0.30, by - bh * 0.55],
    [bx - bw * 0.05, by - bh * 0.45]], CREAM, INK, Math.max(2, w * 0.006));
  seg(ctx, bx - bw * 0.05, by - bh * 1.55, bx + bw * 0.18, by - bh * 1.05, MAGENTA, Math.max(2, w * 0.005));
  // Hull: warm wood planks, upturned ends.
  ctx.beginPath();
  ctx.moveTo(bx - bw * 0.5, by - bh * 0.35);
  ctx.quadraticCurveTo(bx - bw * 0.52, by + bh * 0.55, bx - bw * 0.30, by + bh * 0.85);
  ctx.lineTo(bx + bw * 0.34, by + bh * 0.85);
  ctx.quadraticCurveTo(bx + bw * 0.52, by + bh * 0.5, bx + bw * 0.5, by - bh * 0.55);
  ctx.quadraticCurveTo(bx + bw * 0.28, by - bh * 0.15, bx, by - bh * 0.15);
  ctx.quadraticCurveTo(bx - bw * 0.28, by - bh * 0.15, bx - bw * 0.5, by - bh * 0.35);
  ctx.closePath();
  ctx.fillStyle = ORANGE; ctx.fill();
  ctx.lineWidth = Math.max(2, w * 0.007); ctx.strokeStyle = INK; ctx.stroke();
  // Plank lines + rim.
  seg(ctx, bx - bw * 0.42, by + bh * 0.18, bx + bw * 0.44, by + bh * 0.18, INK, Math.max(1.5, w * 0.004));
  seg(ctx, bx - bw * 0.36, by + bh * 0.52, bx + bw * 0.38, by + bh * 0.52, INK, Math.max(1.5, w * 0.004));
  seg(ctx, bx - bw * 0.48, by - bh * 0.32, bx + bw * 0.48, by - bh * 0.42, SAND, Math.max(3, w * 0.008));
  // Small fisherman: straw hat, peach face, violet top, seated rowing.
  const fx = bx - bw * 0.14, fy = by - bh * 0.55;
  circle(ctx, fx, fy - h * 0.045, h * 0.032, PEACH, INK, Math.max(2, w * 0.005));
  ellipse(ctx, fx, fy - h * 0.062, h * 0.05, h * 0.014, SUN, INK, Math.max(2, w * 0.005));
  rr(ctx, fx - h * 0.026, fy - h * 0.022, h * 0.052, h * 0.055, h * 0.012, VIOLET, INK, Math.max(2, w * 0.005));
  seg(ctx, fx + h * 0.02, fy - h * 0.005, fx + h * 0.075, fy + h * 0.03, INK, Math.max(2, w * 0.005));
  // Oar dipping into the water.
  seg(ctx, fx + h * 0.06, fy + h * 0.01, fx + h * 0.13, fy + h * 0.09, SAND, Math.max(3, w * 0.006));
  ellipse(ctx, fx + h * 0.135, fy + h * 0.095, h * 0.018, h * 0.008, SAND, INK, Math.max(1.5, w * 0.004));
  // Bow ripple + floating crate.
  ellipse(ctx, bx + bw * 0.42, by + bh * 0.95, w * 0.05, h * 0.012, 'rgba(255,243,214,0.6)', null);
  rr(ctx, x + w * 0.12, hz + h * 0.30, w * 0.07, h * 0.035, h * 0.006, SAND, INK, Math.max(2, w * 0.005));
  seg(ctx, x + w * 0.12, hz + h * 0.318, x + w * 0.19, hz + h * 0.318, INK, Math.max(1.5, w * 0.004));
}

// ---------------------------------------------------------------- 2. bike
function drawBike(ctx, x, y, w, h, rng) {
  // Sky: blue -> cream -> peach, low sun, sea horizon.
  ctx.fillStyle = vgrad(ctx, x, y, w, h * 0.40, [[0, SKY], [0.6, CREAM], [1, PEACH]]);
  ctx.fillRect(x, y, w, h * 0.40);
  sunDisc(ctx, x + w * 0.16, y + h * 0.12, h * 0.06, SUN, PEACH);
  softCloud(ctx, x + w * 0.55, y + h * 0.08, w * 0.06, CREAM, 0.9);
  softCloud(ctx, x + w * 0.84, y + h * 0.18, w * 0.045, CREAM, 0.75);
  const hz = y + h * 0.40;
  ctx.fillStyle = vgrad(ctx, x, hz, w, h * 0.12, [[0, TEAL], [1, DEEP]]);
  ctx.fillRect(x, hz, w, h * 0.12);
  ctx.fillStyle = 'rgba(255,243,214,0.5)';
  for (let i = 0; i < 5; i++) ctx.fillRect(x + w * (0.12 + i * 0.18), hz + h * (0.03 + (i % 2) * 0.04), w * 0.07, h * 0.008);
  // Sand strip, then the dark coast road.
  const roadY = hz + h * 0.12;
  ctx.fillStyle = SAND; ctx.fillRect(x, roadY, w, h * 0.06);
  ctx.fillStyle = NIGHT; ctx.fillRect(x, roadY + h * 0.06, w, h * 0.42);
  seg(ctx, x, roadY + h * 0.06, x + w, roadY + h * 0.06, CREAM, Math.max(2, h * 0.008));
  ctx.fillStyle = SUN;
  for (let i = 0; i < 6; i++) ctx.fillRect(x + w * (0.02 + i * 0.17), roadY + h * 0.34, w * 0.09, h * 0.012);
  // Speed lines behind the bike (drawn before the palms and the bike).
  ctx.save(); ctx.globalAlpha = 0.85;
  for (let i = 0; i < 5; i++) {
    const ly = roadY + h * (0.16 + i * 0.05);
    const lx = x + w * (0.03 + rng() * 0.04);
    seg(ctx, lx, ly, lx + w * (0.08 + rng() * 0.07), ly, i % 2 ? CREAM : SUN, Math.max(2, h * 0.01));
  }
  ctx.restore();
  // Palms framing the road, kept clear of the bike.
  drawPalm(ctx, x + w * 0.07, roadY + h * 0.03, h * 0.20, 0.35, PALM);
  drawPalm(ctx, x + w * 0.93, hz + h * 0.02, h * 0.15, -0.3, PALM);
  // ---- Big pink sport bike, wheelie: rear wheel planted, front wheel high.
  // Wheel radius is capped by panel height so a wide-short panel never
  // pushes the wheels off the bottom edge.
  const R = Math.min(w * 0.115, h * 0.155);
  const rearX = x + w * 0.36, rearY = roadY + h * 0.31;
  const frontX = x + w * 0.70, frontY = rearY - h * 0.27;
  const headX = x + w * 0.585, headY = rearY - h * 0.195;
  // Frame spine + swingarm + raised fork.
  seg(ctx, rearX, rearY, headX, headY, INK, Math.max(4, w * 0.011));
  seg(ctx, rearX, rearY, x + w * 0.45, rearY - h * 0.075, BIKE, Math.max(5, w * 0.012));
  seg(ctx, headX, headY, frontX, frontY, INK, Math.max(4, w * 0.010));
  // Handlebar grip the rider reaches for.
  seg(ctx, headX, headY, x + w * 0.625, headY - h * 0.035, INK, Math.max(3, w * 0.007));
  // Fuel tank, pink.
  poly(ctx, [[x + w * 0.44, rearY - h * 0.115], [x + w * 0.53, rearY - h * 0.185],
    [headX, headY - h * 0.01], [x + w * 0.565, rearY - h * 0.145],
    [x + w * 0.475, rearY - h * 0.095]], BIKE, INK, Math.max(2.5, w * 0.006));
  // Tail, magenta, kicked up behind the seat.
  poly(ctx, [[x + w * 0.185, rearY - h * 0.095], [x + w * 0.30, rearY - h * 0.165],
    [x + w * 0.40, rearY - h * 0.165], [x + w * 0.43, rearY - h * 0.115],
    [x + w * 0.38, rearY - h * 0.065], [x + w * 0.25, rearY - h * 0.04]], MAGENTA, INK, Math.max(2.5, w * 0.006));
  // Dark seat strip.
  poly(ctx, [[x + w * 0.33, rearY - h * 0.175], [x + w * 0.42, rearY - h * 0.175],
    [x + w * 0.43, rearY - h * 0.15], [x + w * 0.34, rearY - h * 0.145]], INK, null);
  // Windscreen + headlight at the raised front.
  poly(ctx, [[x + w * 0.575, headY - h * 0.005], [x + w * 0.625, frontY - h * 0.04],
    [x + w * 0.655, frontY - h * 0.015], [x + w * 0.615, headY + h * 0.005]], SKY, INK, Math.max(2, w * 0.005));
  circle(ctx, x + w * 0.635, frontY + h * 0.015, h * 0.018, SUN, INK, Math.max(2, w * 0.005));
  // Front fender arc over the raised wheel.
  poly(ctx, [[x + w * 0.635, frontY - h * 0.055], [x + w * 0.665, frontY - h * 0.125],
    [x + w * 0.735, frontY - h * 0.125], [x + w * 0.765, frontY - h * 0.055],
    [x + w * 0.735, frontY - h * 0.07], [x + w * 0.665, frontY - h * 0.07]], BIKE, INK, Math.max(2, w * 0.005));
  // Wheels: ink tyres, cream rims, pink hubs, 6 pink spokes.
  for (const [wx, wy] of [[rearX, rearY], [frontX, frontY]]) {
    circle(ctx, wx, wy, R, INK, INK, Math.max(2, w * 0.006));
    circle(ctx, wx, wy, R * 0.60, CREAM, INK, Math.max(2, w * 0.005));
    circle(ctx, wx, wy, R * 0.20, BIKE, INK, Math.max(2, w * 0.005));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      seg(ctx, wx, wy, wx + Math.cos(a) * R * 0.56, wy + Math.sin(a) * R * 0.56, BIKE, Math.max(2, w * 0.005));
    }
  }
  // ---- Rider, leaning back with the wheelie: torso + pink helmet read first.
  const hipX = x + w * 0.385, hipY = rearY - h * 0.175;
  // Legs bent to the pegs near the rear axle.
  seg(ctx, hipX, hipY, x + w * 0.455, rearY - h * 0.115, INK, Math.max(5, w * 0.012));
  seg(ctx, x + w * 0.455, rearY - h * 0.115, x + w * 0.415, rearY - h * 0.035, INK, Math.max(5, w * 0.012));
  seg(ctx, hipX + w * 0.015, hipY + h * 0.01, x + w * 0.465, rearY - h * 0.11, INK, Math.max(5, w * 0.012));
  seg(ctx, x + w * 0.465, rearY - h * 0.11, x + w * 0.43, rearY - h * 0.03, INK, Math.max(5, w * 0.012));
  // Boot on the peg.
  poly(ctx, [[x + w * 0.40, rearY - h * 0.04], [x + w * 0.435, rearY - h * 0.04],
    [x + w * 0.44, rearY - h * 0.015], [x + w * 0.405, rearY - h * 0.015]], INK, null);
  // Torso leaning back, away from the bars.
  poly(ctx, [[x + w * 0.35, hipY + h * 0.01], [x + w * 0.42, hipY + h * 0.005],
    [x + w * 0.375, hipY - h * 0.16], [x + w * 0.315, hipY - h * 0.15]], INK, INK, Math.max(2, w * 0.005));
  // Pink chest stripe so the torso reads against the black gear.
  seg(ctx, x + w * 0.335, hipY - h * 0.085, x + w * 0.395, hipY - h * 0.095, BIKE, Math.max(3, h * 0.018));
  // Arms reaching forward-down to the raised bars.
  seg(ctx, x + w * 0.355, hipY - h * 0.145, x + w * 0.595, headY - h * 0.005, INK, Math.max(4, w * 0.010));
  seg(ctx, x + w * 0.365, hipY - h * 0.125, x + w * 0.605, headY + h * 0.01, INK, Math.max(4, w * 0.010));
  circle(ctx, x + w * 0.60, headY, h * 0.012, INK, null);
  // Helmet: pink, big, with a sky visor facing forward.
  const helX = x + w * 0.315, helY = hipY - h * 0.205;
  circle(ctx, helX, helY, h * 0.048, BIKE, INK, Math.max(2.5, w * 0.006));
  poly(ctx, [[helX + h * 0.02, helY - h * 0.02], [helX + h * 0.05, helY - h * 0.01],
    [helX + h * 0.04, helY + h * 0.015], [helX + h * 0.015, helY + h * 0.01]], SKY, INK, Math.max(1.5, w * 0.004));
  // Ground shadow under the planted rear wheel + faint one under the front.
  ellipse(ctx, rearX + w * 0.02, rearY + R * 0.98, w * 0.17, h * 0.014, 'rgba(12,8,18,0.45)', null);
  ellipse(ctx, frontX, rearY + R * 0.98, w * 0.10, h * 0.010, 'rgba(12,8,18,0.25)', null);
  // Small beach stones on the sand strip.
  circle(ctx, x + w * 0.28, roadY + h * 0.03, h * 0.012, PEACH, INK, Math.max(1.5, w * 0.004));
  circle(ctx, x + w * 0.33, roadY + h * 0.035, h * 0.009, CREAM, INK, Math.max(1.5, w * 0.004));
}

// ---------------------------------------------------------------- 3. neon
function drawNeon(ctx, x, y, w, h, rng) {
  // Dark wall + floor.
  ctx.fillStyle = vgrad(ctx, x, y, w, h, [[0, NIGHT], [0.7, '#1E1440'], [1, '#241A4A']]);
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(12,8,18,0.55)';
  ctx.fillRect(x, y + h * 0.82, w, h * 0.18);
  // Brick seams, faint.
  ctx.save(); ctx.globalAlpha = 0.18; ctx.strokeStyle = CREAM; ctx.lineWidth = Math.max(1, h * 0.004);
  for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(x, y + (h * 0.82 * i) / 6); ctx.lineTo(x + w, y + (h * 0.82 * i) / 6); ctx.stroke(); }
  for (let i = 1; i < 8; i++) { ctx.beginPath(); ctx.moveTo(x + (w * i) / 8, y); ctx.lineTo(x + (w * i) / 8, y + h * 0.82); ctx.stroke(); }
  ctx.restore();
  // Helper: a glowing tube stroke.
  function tube(points, color, lw, closed) {
    ctx.save();
    ctx.shadowColor = color; ctx.shadowBlur = Math.max(8, w * 0.03);
    ctx.strokeStyle = color; ctx.lineWidth = lw;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    if (closed) ctx.closePath();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = CREAM; ctx.lineWidth = Math.max(1.5, lw * 0.28);
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    if (closed) ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
  // Pink arc, upper left.
  ctx.save();
  ctx.shadowColor = BIKE; ctx.shadowBlur = Math.max(10, w * 0.035);
  ctx.strokeStyle = BIKE; ctx.lineWidth = Math.max(6, w * 0.018);
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x + w * 0.30, y + h * 0.42, h * 0.17, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
  ctx.shadowBlur = 0; ctx.strokeStyle = CREAM; ctx.lineWidth = Math.max(2, w * 0.005);
  ctx.beginPath(); ctx.arc(x + w * 0.30, y + h * 0.42, h * 0.17, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
  ctx.restore();
  // Cyan zigzag with OBTUSE corners only (>=120 deg): shallow wide teeth.
  // zh is tied to w (not h) so the corner stays obtuse at any panel
  // aspect: dx = 0.10w per tooth, dy = 0.045w -> corner angle ~138 deg.
  const zx = x + w * 0.52, zy = y + h * 0.18, zw = w * 0.40, zh = w * 0.045;
  const zig = [];
  for (let i = 0; i <= 4; i++) {
    zig.push([zx + (zw * i) / 4, zy + (i % 2 === 0 ? 0 : zh)]);
  }
  tube(zig, SKY, Math.max(6, w * 0.016));
  // Small cyan dots marking each obtuse corner.
  for (const [px, py] of zig) circle(ctx, px, py, Math.max(3, w * 0.008), CREAM, SKY, Math.max(2, w * 0.004));
  // Orange ring, right side.
  ctx.save();
  ctx.shadowColor = ORANGE; ctx.shadowBlur = Math.max(10, w * 0.035);
  ctx.strokeStyle = ORANGE; ctx.lineWidth = Math.max(6, w * 0.018);
  ctx.beginPath(); ctx.arc(x + w * 0.74, y + h * 0.48, h * 0.11, 0, Math.PI * 2); ctx.stroke();
  ctx.shadowBlur = 0; ctx.strokeStyle = CREAM; ctx.lineWidth = Math.max(2, w * 0.005);
  ctx.beginPath(); ctx.arc(x + w * 0.74, y + h * 0.48, h * 0.11, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  // Pink neon star (5-point, drawn as a tube outline).
  const sx = x + w * 0.22, sy = y + h * 0.62, sr = h * 0.09;
  const star = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? sr : sr * 0.45;
    star.push([sx + Math.cos(a) * rad, sy + Math.sin(a) * rad]);
  }
  tube(star, BIKE, Math.max(5, w * 0.014), true);
  // Magenta underline bar under the arc.
  tube([[x + w * 0.12, y + h * 0.52], [x + w * 0.46, y + h * 0.52]], MAGENTA, Math.max(5, w * 0.014));
  // Violet small arc, lower right.
  ctx.save();
  ctx.shadowColor = VIOLET; ctx.shadowBlur = Math.max(8, w * 0.03);
  ctx.strokeStyle = VIOLET; ctx.lineWidth = Math.max(5, w * 0.014); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x + w * 0.68, y + h * 0.70, h * 0.08, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  ctx.restore();
  // Bokeh dots along the floor, seeded.
  for (let i = 0; i < 18; i++) {
    const bx = x + w * (0.05 + rng() * 0.9);
    const by = y + h * (0.86 + rng() * 0.10);
    const br = h * (0.008 + rng() * 0.018);
    const col = [BIKE, SKY, ORANGE, MAGENTA, SUN][i % 5];
    ctx.save(); ctx.globalAlpha = 0.35 + rng() * 0.5;
    circle(ctx, bx, by, br, col, null);
    ctx.restore();
  }
  // Floor reflections of the three main tubes.
  ctx.save(); ctx.globalAlpha = 0.22;
  ellipse(ctx, x + w * 0.30, y + h * 0.88, w * 0.14, h * 0.02, BIKE, null);
  ellipse(ctx, x + w * 0.74, y + h * 0.90, w * 0.10, h * 0.018, ORANGE, null);
  ellipse(ctx, x + w * 0.22, y + h * 0.92, w * 0.09, h * 0.016, BIKE, null);
  ctx.restore();
}

// ---------------------------------------------------------------- 4. hero
function drawHero(ctx, x, y, w, h, rng) {
  // Sunset sky: violet -> magenta -> orange -> peach.
  ctx.fillStyle = vgrad(ctx, x, y, w, h, [[0, VIOLET], [0.35, MAGENTA], [0.62, ORANGE], [0.85, PEACH], [1, CREAM]]);
  ctx.fillRect(x, y, w, h);
  sunDisc(ctx, x + w * 0.50, y + h * 0.38, h * 0.11, SUN, PEACH);
  softCloud(ctx, x + w * 0.18, y + h * 0.10, w * 0.07, CREAM, 0.85);
  softCloud(ctx, x + w * 0.80, y + h * 0.16, w * 0.055, CREAM, 0.8);
  softCloud(ctx, x + w * 0.50, y + h * 0.06, w * 0.04, PEACH, 0.7);
  // Faint skyline behind the couple, low and hazy.
  ctx.save(); ctx.globalAlpha = 0.45;
  skyline(ctx, x, y + h * 0.30, w, h * 0.22, DUSK, rng, false);
  ctx.restore();
  // Horizon glow band.
  ctx.fillStyle = 'rgba(255,194,26,0.35)';
  ctx.fillRect(x, y + h * 0.48, w, h * 0.05);
  // Palm framing from the top corners, silhouettes leaning in.
  drawPalm(ctx, x + w * 0.02, y + h * 0.02, h * 0.30, 0.9, PALM);
  drawPalm(ctx, x + w * 0.98, y + h * 0.02, h * 0.28, -0.9, PALM);
  // Ground shadow strip at the very bottom.
  ctx.fillStyle = 'rgba(12,8,18,0.25)';
  ctx.fillRect(x, y + h * 0.94, w, h * 0.06);
  // ---- Girl, left: black bob, pink hoodie. Face large, lower 2/3.
  const gx = x + w * 0.30, gy = y + h * 0.58, gr = h * 0.17;
  // Hoodie body.
  rr(ctx, gx - w * 0.17, gy + h * 0.10, w * 0.34, h * 0.34, h * 0.03, BIKE, INK, Math.max(3, w * 0.008));
  // Hoodie pocket + drawstrings.
  rr(ctx, gx - w * 0.07, gy + h * 0.28, w * 0.14, h * 0.09, h * 0.015, MAGENTA, INK, Math.max(2, w * 0.005));
  seg(ctx, gx - w * 0.03, gy + h * 0.12, gx - w * 0.05, gy + h * 0.20, CREAM, Math.max(2, w * 0.005));
  seg(ctx, gx + w * 0.03, gy + h * 0.12, gx + w * 0.05, gy + h * 0.20, CREAM, Math.max(2, w * 0.005));
  // Bob hair: big rounded mass behind the face.
  ctx.beginPath();
  ctx.arc(gx, gy - h * 0.02, gr * 1.18, Math.PI * 0.95, Math.PI * 2.05);
  ctx.quadraticCurveTo(gx + gr * 1.25, gy + h * 0.10, gx + gr * 0.95, gy + h * 0.12);
  ctx.lineTo(gx + gr * 0.78, gy - h * 0.02);
  ctx.lineTo(gx - gr * 0.78, gy - h * 0.02);
  ctx.quadraticCurveTo(gx - gr * 1.25, gy + h * 0.10, gx - gr * 1.15, gy + h * 0.08);
  ctx.closePath();
  ctx.fillStyle = INK; ctx.fill();
  ctx.lineWidth = Math.max(2, w * 0.006); ctx.strokeStyle = INK; ctx.stroke();
  // Face.
  ellipse(ctx, gx, gy, gr * 0.82, gr * 0.95, PEACH, INK, Math.max(3, w * 0.007));
  // Fringe across the forehead.
  ctx.beginPath();
  ctx.moveTo(gx - gr * 0.82, gy - h * 0.02);
  ctx.quadraticCurveTo(gx - gr * 0.4, gy - h * 0.10, gx, gy - h * 0.055);
  ctx.quadraticCurveTo(gx + gr * 0.4, gy - h * 0.10, gx + gr * 0.82, gy - h * 0.02);
  ctx.quadraticCurveTo(gx + gr * 0.5, gy - h * 0.13, gx, gy - h * 0.13);
  ctx.quadraticCurveTo(gx - gr * 0.5, gy - h * 0.13, gx - gr * 0.82, gy - h * 0.02);
  ctx.closePath(); ctx.fillStyle = INK; ctx.fill();
  // Eyes: large, dark, with cream highlights.
  for (const ex of [-1, 1]) {
    ellipse(ctx, gx + ex * gr * 0.32, gy + h * 0.005, gr * 0.14, gr * 0.20, INK, null);
    circle(ctx, gx + ex * gr * 0.32 + gr * 0.05, gy - h * 0.008, gr * 0.05, CREAM, null);
    seg(ctx, gx + ex * gr * 0.48, gy - h * 0.035, gx + ex * gr * 0.18, gy - h * 0.045, INK, Math.max(2, w * 0.005));
  }
  // Blush + small smile.
  circle(ctx, gx - gr * 0.48, gy + h * 0.055, gr * 0.11, MAGENTA, null);
  circle(ctx, gx + gr * 0.48, gy + h * 0.055, gr * 0.11, MAGENTA, null);
  ctx.beginPath(); ctx.arc(gx, gy + h * 0.055, gr * 0.18, Math.PI * 0.15, Math.PI * 0.85);
  ctx.strokeStyle = INK; ctx.lineWidth = Math.max(2, w * 0.005); ctx.stroke();
  // ---- Boy, right: short black hair, dark Tokyo streetwear jacket.
  const bx = x + w * 0.70, by = y + h * 0.58, br = h * 0.165;
  // Jacket body: dark violet with subtle fine pattern (dots + thin stripes).
  rr(ctx, bx - w * 0.165, by + h * 0.10, w * 0.33, h * 0.34, h * 0.025, NIGHT, INK, Math.max(3, w * 0.008));
  ctx.save();
  ctx.beginPath(); ctx.rect(bx - w * 0.165, by + h * 0.10, w * 0.33, h * 0.34); ctx.clip();
  ctx.fillStyle = 'rgba(124,58,237,0.55)';
  for (let i = 0; i < 5; i++) circle(ctx, bx - w * 0.12 + i * w * 0.06, by + h * (0.18 + (i % 2) * 0.07), h * 0.008, 'rgba(124,58,237,0.55)', null);
  seg(ctx, bx - w * 0.165, by + h * 0.30, bx + w * 0.165, by + h * 0.30, VIOLET, Math.max(2, w * 0.005));
  seg(ctx, bx - w * 0.165, by + h * 0.36, bx + w * 0.165, by + h * 0.36, VIOLET, Math.max(1.5, w * 0.004));
  ctx.restore();
  // Jacket collar + zip.
  poly(ctx, [[bx - w * 0.05, by + h * 0.10], [bx, by + h * 0.16], [bx + w * 0.05, by + h * 0.10],
    [bx + w * 0.03, by + h * 0.07], [bx - w * 0.03, by + h * 0.07]], VIOLET, INK, Math.max(2, w * 0.005));
  seg(ctx, bx, by + h * 0.16, bx, by + h * 0.42, CREAM, Math.max(2, w * 0.005));
  // Face.
  ellipse(ctx, bx, by, br * 0.84, br * 0.98, PEACH, INK, Math.max(3, w * 0.007));
  // Short black hair with a side sweep.
  ctx.beginPath();
  ctx.moveTo(bx - br * 0.84, by - h * 0.01);
  ctx.quadraticCurveTo(bx - br * 0.9, by - h * 0.16, bx - br * 0.2, by - h * 0.175);
  ctx.quadraticCurveTo(bx + br * 0.5, by - h * 0.19, bx + br * 0.85, by - h * 0.10);
  ctx.quadraticCurveTo(bx + br * 0.88, by - h * 0.02, bx + br * 0.78, by - h * 0.03);
  ctx.quadraticCurveTo(bx + br * 0.4, by - h * 0.09, bx, by - h * 0.075);
  ctx.quadraticCurveTo(bx - br * 0.45, by - h * 0.09, bx - br * 0.82, by - h * 0.04);
  ctx.closePath(); ctx.fillStyle = INK; ctx.fill();
  // Eyes + brows, calm confident look.
  for (const ex of [-1, 1]) {
    ellipse(ctx, bx + ex * br * 0.32, by + h * 0.01, br * 0.12, br * 0.16, INK, null);
    circle(ctx, bx + ex * br * 0.32 + br * 0.04, by - h * 0.002, br * 0.04, CREAM, null);
    seg(ctx, bx + ex * br * 0.46, by - h * 0.045, bx + ex * br * 0.16, by - h * 0.05, INK, Math.max(2, w * 0.005));
  }
  ctx.beginPath(); ctx.arc(bx, by + h * 0.06, br * 0.16, Math.PI * 0.15, Math.PI * 0.85);
  ctx.strokeStyle = INK; ctx.lineWidth = Math.max(2, w * 0.005); ctx.stroke();
  // Small shared detail: two birds between them, high in the sky.
  seg(ctx, x + w * 0.44, y + h * 0.20, x + w * 0.47, y + h * 0.185, INK, Math.max(2, w * 0.005));
  seg(ctx, x + w * 0.47, y + h * 0.185, x + w * 0.50, y + h * 0.20, INK, Math.max(2, w * 0.005));
  seg(ctx, x + w * 0.54, y + h * 0.24, x + w * 0.565, y + h * 0.228, INK, Math.max(2, w * 0.005));
  seg(ctx, x + w * 0.565, y + h * 0.228, x + w * 0.59, y + h * 0.24, INK, Math.max(2, w * 0.005));
}

// ---------------------------------------------------------------- 5. yatai
function drawYatai(ctx, x, y, w, h, rng) {
  // Night street.
  ctx.fillStyle = vgrad(ctx, x, y, w, h, [[0, NIGHT], [0.6, '#241A4A'], [1, '#17102E']]);
  ctx.fillRect(x, y, w, h);
  // Distant windows, faint.
  ctx.save(); ctx.globalAlpha = 0.5;
  skyline(ctx, x, y + h * 0.08, w, h * 0.30, '#1E1440', rng, true);
  ctx.restore();
  // Warm glow behind the stall.
  const glow = ctx.createRadialGradient(x + w * 0.5, y + h * 0.42, h * 0.05, x + w * 0.5, y + h * 0.42, h * 0.55);
  glow.addColorStop(0, 'rgba(255,154,92,0.55)');
  glow.addColorStop(1, 'rgba(255,154,92,0)');
  ctx.fillStyle = glow; ctx.fillRect(x, y, w, h);
  // Stall roof: dark violet awning with scalloped edge.
  poly(ctx, [[x + w * 0.14, y + h * 0.22], [x + w * 0.86, y + h * 0.22],
    [x + w * 0.82, y + h * 0.30], [x + w * 0.18, y + h * 0.30]], VIOLET, INK, Math.max(3, w * 0.007));
  for (let i = 0; i < 7; i++) {
    const ax = x + w * (0.18 + i * 0.093);
    ctx.beginPath(); ctx.arc(ax, y + h * 0.30, w * 0.047, 0, Math.PI); ctx.fillStyle = MAGENTA; ctx.fill();
    ctx.lineWidth = Math.max(2, w * 0.005); ctx.strokeStyle = INK; ctx.stroke();
  }
  seg(ctx, x + w * 0.16, y + h * 0.30, x + w * 0.16, y + h * 0.86, INK, Math.max(3, w * 0.007));
  seg(ctx, x + w * 0.84, y + h * 0.30, x + w * 0.84, y + h * 0.86, INK, Math.max(3, w * 0.007));
  // Hanging warm bulbs on a string.
  ctx.beginPath(); ctx.moveTo(x + w * 0.16, y + h * 0.32);
  ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.42, x + w * 0.84, y + h * 0.32);
  ctx.strokeStyle = INK; ctx.lineWidth = Math.max(2, w * 0.005); ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const t = (i + 0.5) / 5;
    const bx = lerp(lerp(x + w * 0.16, x + w * 0.5, t), x + w * 0.84, t * t);
    const by = lerp(y + h * 0.32, y + h * 0.42, Math.sin(t * Math.PI) * 0.9) + h * 0.02;
    circle(ctx, bx, by, h * 0.018, SUN, INK, Math.max(1.5, w * 0.004));
    circle(ctx, bx, by, h * 0.032, 'rgba(255,194,26,0.35)', null);
  }
  // Red paper lanterns: glowing, abstract marks only (no characters).
  function lantern(lx, ly, r) {
    ctx.save();
    ctx.shadowColor = TORII; ctx.shadowBlur = Math.max(10, w * 0.03);
    ellipse(ctx, lx, ly, r * 0.82, r, TORII, INK, Math.max(3, w * 0.007));
    ctx.restore();
    ctx.save(); ctx.globalAlpha = 0.85;
    ellipse(ctx, lx, ly, r * 0.55, r * 0.72, ORANGE, null);
    ctx.restore();
    // Abstract bands + dots, not writing.
    seg(ctx, lx - r * 0.45, ly - r * 0.35, lx + r * 0.45, ly - r * 0.35, INK, Math.max(2, w * 0.004));
    seg(ctx, lx - r * 0.45, ly + r * 0.35, lx + r * 0.45, ly + r * 0.35, INK, Math.max(2, w * 0.004));
    circle(ctx, lx, ly, r * 0.14, INK, null);
    circle(ctx, lx - r * 0.25, ly + r * 0.05, r * 0.06, CREAM, null);
    circle(ctx, lx + r * 0.25, ly + r * 0.05, r * 0.06, CREAM, null);
    // Tassel.
    seg(ctx, lx, ly + r, lx, ly + r * 1.35, SUN, Math.max(2, w * 0.005));
  }
  lantern(x + w * 0.24, y + h * 0.40, h * 0.075);
  lantern(x + w * 0.76, y + h * 0.40, h * 0.075);
  lantern(x + w * 0.50, y + h * 0.36, h * 0.055);
  // Vendor: middle-aged man, apron + headband, behind the counter.
  const vx = x + w * 0.50, vy = y + h * 0.52;
  // Body + apron.
  rr(ctx, vx - w * 0.09, vy + h * 0.02, w * 0.18, h * 0.20, h * 0.02, VIOLET, INK, Math.max(3, w * 0.007));
  rr(ctx, vx - w * 0.065, vy + h * 0.05, w * 0.13, h * 0.17, h * 0.015, CREAM, INK, Math.max(2, w * 0.005));
  seg(ctx, vx - w * 0.065, vy + h * 0.10, vx + w * 0.065, vy + h * 0.10, INK, Math.max(1.5, w * 0.004));
  // Apron pocket.
  rr(ctx, vx - w * 0.03, vy + h * 0.14, w * 0.06, h * 0.05, h * 0.008, PEACH, INK, Math.max(1.5, w * 0.004));
  // Arms reaching to the counter.
  seg(ctx, vx - w * 0.08, vy + h * 0.06, vx - w * 0.14, vy + h * 0.16, PEACH, Math.max(5, w * 0.011));
  seg(ctx, vx + w * 0.08, vy + h * 0.06, vx + w * 0.13, vy + h * 0.15, PEACH, Math.max(5, w * 0.011));
  // Head: warm skin, grey-streaked hair, headband, moustache.
  circle(ctx, vx, vy - h * 0.04, h * 0.055, PEACH, INK, Math.max(3, w * 0.007));
  ctx.beginPath();
  ctx.arc(vx, vy - h * 0.055, h * 0.056, Math.PI, Math.PI * 2);
  ctx.fillStyle = INK; ctx.fill();
  seg(ctx, vx - h * 0.055, vy - h * 0.055, vx + h * 0.055, vy - h * 0.055, SUN, Math.max(3, w * 0.007));
  circle(ctx, vx + h * 0.055, vy - h * 0.055, h * 0.008, TORII, INK, Math.max(1.5, w * 0.004));
  for (const ex of [-1, 1]) circle(ctx, vx + ex * h * 0.022, vy - h * 0.04, h * 0.005, INK, null);
  seg(ctx, vx - h * 0.018, vy - h * 0.012, vx + h * 0.018, vy - h * 0.012, INK, Math.max(2, w * 0.005));
  // Counter: warm wood, food on top.
  rr(ctx, x + w * 0.16, y + h * 0.68, w * 0.68, h * 0.07, h * 0.01, ORANGE, INK, Math.max(3, w * 0.007));
  seg(ctx, x + w * 0.16, y + h * 0.715, x + w * 0.84, y + h * 0.715, INK, Math.max(1.5, w * 0.004));
  // Skewers (yakitori) on a plate + bowls.
  for (let i = 0; i < 4; i++) {
    const sx = x + w * (0.24 + i * 0.05);
    seg(ctx, sx, y + h * 0.635, sx + w * 0.03, y + h * 0.665, SAND, Math.max(2, w * 0.005));
    circle(ctx, sx + w * 0.008, y + h * 0.645, h * 0.012, TORII, INK, Math.max(1.5, w * 0.004));
    circle(ctx, sx + w * 0.016, y + h * 0.652, h * 0.012, ORANGE, INK, Math.max(1.5, w * 0.004));
  }
  ellipse(ctx, x + w * 0.62, y + h * 0.66, w * 0.05, h * 0.018, CREAM, INK, Math.max(2, w * 0.005));
  ellipse(ctx, x + w * 0.62, y + h * 0.652, w * 0.035, h * 0.01, SUN, null);
  circle(ctx, x + w * 0.74, y + h * 0.655, h * 0.016, MAGENTA, INK, Math.max(1.5, w * 0.004));
  // Steam curls above the food.
  ctx.save(); ctx.strokeStyle = 'rgba(255,243,214,0.8)'; ctx.lineWidth = Math.max(2, w * 0.005); ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const sx = x + w * (0.30 + i * 0.12);
    ctx.beginPath(); ctx.moveTo(sx, y + h * 0.62);
    ctx.quadraticCurveTo(sx + w * 0.015, y + h * 0.585, sx, y + h * 0.555);
    ctx.quadraticCurveTo(sx - w * 0.015, y + h * 0.525, sx, y + h * 0.50);
    ctx.stroke();
  }
  ctx.restore();
  // Dark street + cobble hints at the bottom.
  ctx.fillStyle = 'rgba(12,8,18,0.6)';
  ctx.fillRect(x, y + h * 0.86, w, h * 0.14);
  ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = CREAM;
  for (let i = 0; i < 8; i++) ellipse(ctx, x + w * (0.08 + i * 0.11), y + h * (0.90 + (i % 2) * 0.05), w * 0.03, h * 0.012, CREAM, null);
  ctx.restore();
}

// ---------------------------------------------------------------- 6. torii
function drawTorii(ctx, x, y, w, h, rng) {
  // Dawn sky: magenta -> peach -> sky blue.
  ctx.fillStyle = vgrad(ctx, x, y, w, h * 0.48, [[0, MAGENTA], [0.45, PEACH], [0.8, SKY], [1, CREAM]]);
  ctx.fillRect(x, y, w, h * 0.48);
  // Sun sits above the gate, centred, so it never collides with the lintel.
  sunDisc(ctx, x + w * 0.50, y + h * 0.075, h * 0.05, SUN, PEACH);
  softCloud(ctx, x + w * 0.14, y + h * 0.16, w * 0.05, CREAM, 0.9);
  softCloud(ctx, x + w * 0.86, y + h * 0.14, w * 0.05, CREAM, 0.85);
  // Faint mountains on the horizon.
  const hz = y + h * 0.42;
  ctx.fillStyle = 'rgba(107,78,158,0.55)';
  ctx.beginPath();
  ctx.moveTo(x, hz);
  ctx.lineTo(x + w * 0.18, hz - h * 0.12); ctx.lineTo(x + w * 0.34, hz);
  ctx.lineTo(x + w * 0.52, hz - h * 0.08); ctx.lineTo(x + w * 0.68, hz);
  ctx.lineTo(x + w * 0.84, hz - h * 0.10); ctx.lineTo(x + w, hz);
  ctx.closePath(); ctx.fill();
  // Water: most of the lower panel now, so the gate stands in it.
  ctx.fillStyle = vgrad(ctx, x, hz, w, h - hz, [[0, TEAL], [0.5, DEEP], [1, '#0B4A63']]);
  ctx.fillRect(x, hz, w, h - hz);
  // Mist bands over the water.
  ctx.save(); ctx.globalAlpha = 0.45;
  for (let i = 0; i < 3; i++) {
    ellipse(ctx, x + w * (0.2 + i * 0.3), hz + h * (0.06 + i * 0.10), w * 0.28, h * 0.025, CREAM, null);
  }
  ctx.restore();
  // Drifting petals (drawn before the gate so none sits on top of it).
  for (let i = 0; i < 8; i++) {
    const px = x + w * (0.08 + rng() * 0.84);
    const py = hz + h * (0.12 + rng() * 0.28);
    ellipse(ctx, px, py, h * 0.012, h * 0.006, BIKE, null);
  }
  // ---- Gate: big and whole. Width from the panel width, height capped so
  // the proportions hold on a wide-short panel too.
  const gw = w * 0.60;
  const gh = Math.min(h * 0.62, gw * 0.78);
  const tx = x + w * 0.50;
  const ty = y + h * 0.80 - gh;
  // Torii reflection first (under the gate, flipped, faded).
  ctx.save(); ctx.globalAlpha = 0.35;
  ctx.translate(tx, ty + gh * 1.55); ctx.scale(1, -1); ctx.translate(-tx, -ty);
  drawToriiGate(ctx, tx, ty, gw, gh);
  ctx.restore();
  // Torii gate standing in the water.
  drawToriiGate(ctx, tx, ty, gw, gh);
  // Water ripples around the pillar bases.
  ctx.save(); ctx.strokeStyle = 'rgba(255,243,214,0.7)'; ctx.lineWidth = Math.max(2, w * 0.005);
  for (const px of [tx - gw * 0.315, tx + gw * 0.315]) {
    ctx.beginPath(); ctx.ellipse(px, ty + gh, w * 0.06, h * 0.012, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(px, ty + gh, w * 0.09, h * 0.02, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
  // Sakura branches from the top corners, pink blossoms.
  function sakuraBranch(bx, by, dir) {
    ctx.save();
    ctx.strokeStyle = INK; ctx.lineWidth = Math.max(3, w * 0.008); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + dir * w * 0.12, by + h * 0.06, bx + dir * w * 0.22, by + h * 0.10);
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + dir * w * 0.08, by + h * 0.04);
    ctx.quadraticCurveTo(bx + dir * w * 0.16, by + h * 0.02, bx + dir * w * 0.20, by + h * 0.06);
    ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 9; i++) {
      const px = bx + dir * w * (0.03 + rng() * 0.20);
      const py = by + h * (0.01 + rng() * 0.10);
      const pr = h * (0.012 + rng() * 0.012);
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        circle(ctx, px + Math.cos(a) * pr * 0.7, py + Math.sin(a) * pr * 0.7, pr * 0.55, BIKE, INK, Math.max(1, w * 0.002));
      }
      circle(ctx, px, py, pr * 0.35, SUN, null);
    }
  }
  sakuraBranch(x, y, 1);
  sakuraBranch(x + w, y + h * 0.02, -1);
}

function drawToriiGate(ctx, cx, topY, gw, gh) {
  const lw = Math.max(3, gw * 0.03);
  // Top lintel (kasagi): slightly curved, black cap.
  ctx.beginPath();
  ctx.moveTo(cx - gw * 0.52, topY + gh * 0.06);
  ctx.quadraticCurveTo(cx, topY - gh * 0.04, cx + gw * 0.52, topY + gh * 0.06);
  ctx.lineTo(cx + gw * 0.48, topY + gh * 0.14);
  ctx.quadraticCurveTo(cx, topY + gh * 0.05, cx - gw * 0.48, topY + gh * 0.14);
  ctx.closePath();
  ctx.fillStyle = TORII; ctx.fill();
  ctx.lineWidth = lw * 0.7; ctx.strokeStyle = INK; ctx.stroke();
  // Black cap strip on the lintel.
  ctx.beginPath();
  ctx.moveTo(cx - gw * 0.52, topY + gh * 0.06);
  ctx.quadraticCurveTo(cx, topY - gh * 0.04, cx + gw * 0.52, topY + gh * 0.06);
  ctx.lineTo(cx + gw * 0.50, topY + gh * 0.09);
  ctx.quadraticCurveTo(cx, topY, cx - gw * 0.50, topY + gh * 0.09);
  ctx.closePath(); ctx.fillStyle = INK; ctx.fill();
  // Second beam (shimaki).
  rr(ctx, cx - gw * 0.42, topY + gh * 0.22, gw * 0.84, gh * 0.09, gh * 0.02, TORII, INK, lw * 0.7);
  // Centre plaque (abstract diamond, no characters).
  poly(ctx, [[cx, topY + gh * 0.20], [cx + gw * 0.045, topY + gh * 0.265],
    [cx, topY + gh * 0.33], [cx - gw * 0.045, topY + gh * 0.265]], INK, CREAM, Math.max(2, gw * 0.008));
  circle(ctx, cx, topY + gh * 0.265, gh * 0.02, SUN, null);
  // Two pillars, slightly leaning inward.
  poly(ctx, [[cx - gw * 0.34, topY + gh * 0.30], [cx - gw * 0.30, topY + gh * 0.30],
    [cx - gw * 0.27, topY + gh * 1.0], [cx - gw * 0.36, topY + gh * 1.0]], TORII, INK, lw * 0.7);
  poly(ctx, [[cx + gw * 0.30, topY + gh * 0.30], [cx + gw * 0.34, topY + gh * 0.30],
    [cx + gw * 0.36, topY + gh * 1.0], [cx + gw * 0.27, topY + gh * 1.0]], TORII, INK, lw * 0.7);
  // Tie beam (nuki) between the pillars.
  rr(ctx, cx - gw * 0.36, topY + gh * 0.52, gw * 0.72, gh * 0.08, gh * 0.02, TORII, INK, lw * 0.7);
  // Pillar bases in the water.
  ellipse(ctx, cx - gw * 0.315, topY + gh * 1.0, gw * 0.06, gh * 0.03, INK, null);
  ellipse(ctx, cx + gw * 0.315, topY + gh * 1.0, gw * 0.06, gh * 0.03, INK, null);
}

// ---------------------------------------------------------------- 7. car
function drawCar(ctx, x, y, w, h, rng) {
  // Golden-hour sky. The road + car sit HIGH in the panel (horizon 0.43h):
  // the title band overlaps the bottom of the H panel, so the car's mass
  // must read above it — the mock keeps the car's roof/windows/body visible.
  ctx.fillStyle = vgrad(ctx, x, y, w, h * 0.43, [[0, PEACH], [0.45, ORANGE], [0.75, MAGENTA], [1, VIOLET]]);
  ctx.fillRect(x, y, w, h * 0.43);
  sunDisc(ctx, x + w * 0.80, y + h * 0.26, h * 0.09, SUN, PEACH);
  softCloud(ctx, x + w * 0.22, y + h * 0.08, w * 0.07, CREAM, 0.9);
  softCloud(ctx, x + w * 0.55, y + h * 0.14, w * 0.05, CREAM, 0.75);
  softCloud(ctx, x + w * 0.38, y + h * 0.20, w * 0.045, PEACH, 0.7);
  // Skyline + palms behind the road.
  const hz = y + h * 0.43;
  ctx.save(); ctx.globalAlpha = 0.55;
  skyline(ctx, x, y + h * 0.20, w, h * 0.23, DUSK, rng, true);
  ctx.restore();
  drawPalm(ctx, x + w * 0.07, hz, h * 0.20, 0.3, PALM);
  drawPalm(ctx, x + w * 0.16, hz, h * 0.14, -0.25, PALM);
  drawPalm(ctx, x + w * 0.93, hz, h * 0.18, -0.3, PALM);
  // Road.
  ctx.fillStyle = NIGHT; ctx.fillRect(x, hz, w, h * 0.45);
  ctx.fillStyle = 'rgba(255,243,214,0.14)';
  ctx.fillRect(x, hz, w, h * 0.03);
  ctx.fillStyle = SUN;
  for (let i = 0; i < 5; i++) ctx.fillRect(x + w * (0.03 + i * 0.20), hz + h * 0.36, w * 0.10, h * 0.012);
  // ---- Yellow sports car, side 3/4 view, facing right.
  // Scaled from the panel WIDTH (not height) so it stays big on a
  // wide-short panel; wheel radius is capped by height so the wheels
  // never run off the bottom edge.
  const cw = w * 0.70;
  const cbh = cw * 0.21;
  const cx = x + w * 0.50;
  const R = Math.min(cw * 0.115, h * 0.105);
  const wheelY = hz + h * 0.315;
  const cy = wheelY - cbh * 0.55;
  const OL = Math.max(4, w * 0.011);
  // Ground shadow.
  ellipse(ctx, cx, wheelY + R * 0.72, cw * 0.54, h * 0.022, 'rgba(12,8,18,0.6)', null);
  // Body: long low wedge with a rounded nose. Thick ink outline so the
  // pale graded body still reads against the dark road.
  ctx.beginPath();
  ctx.moveTo(cx - cw * 0.48, cy + cbh * 0.35);
  ctx.lineTo(cx - cw * 0.30, cy + cbh * 0.10);
  ctx.quadraticCurveTo(cx - cw * 0.18, cy - cbh * 0.35, cx + cw * 0.02, cy - cbh * 0.42);
  ctx.quadraticCurveTo(cx + cw * 0.22, cy - cbh * 0.48, cx + cw * 0.34, cy - cbh * 0.18);
  ctx.lineTo(cx + cw * 0.48, cy - cbh * 0.05);
  ctx.quadraticCurveTo(cx + cw * 0.52, cy + cbh * 0.15, cx + cw * 0.46, cy + cbh * 0.35);
  ctx.lineTo(cx + cw * 0.30, cy + cbh * 0.55);
  ctx.lineTo(cx - cw * 0.28, cy + cbh * 0.55);
  ctx.closePath();
  ctx.fillStyle = SUN; ctx.fill();
  ctx.lineWidth = OL; ctx.strokeStyle = INK; ctx.stroke();
  // Dark rocker band along the bottom of the body (wheels cover its ends).
  poly(ctx, [[cx - cw * 0.40, cy + cbh * 0.38], [cx + cw * 0.42, cy + cbh * 0.38],
    [cx + cw * 0.38, cy + cbh * 0.55], [cx - cw * 0.36, cy + cbh * 0.55]], NIGHT, null);
  // Character line.
  seg(ctx, cx - cw * 0.30, cy + cbh * 0.05, cx + cw * 0.38, cy + cbh * 0.02, ORANGE, Math.max(2.5, w * 0.006));
  // Cabin glass: dark now, so it holds against the pale graded body.
  poly(ctx, [[cx - cw * 0.14, cy - cbh * 0.30], [cx + cw * 0.04, cy - cbh * 0.36],
    [cx + cw * 0.20, cy - cbh * 0.14], [cx - cw * 0.02, cy - cbh * 0.12]], NIGHT, INK, Math.max(3, w * 0.008));
  poly(ctx, [[cx + cw * 0.08, cy - cbh * 0.36], [cx + cw * 0.20, cy - cbh * 0.34],
    [cx + cw * 0.30, cy - cbh * 0.14], [cx + cw * 0.22, cy - cbh * 0.14]], NIGHT, INK, Math.max(3, w * 0.008));
  // Glass shine streaks.
  seg(ctx, cx - cw * 0.08, cy - cbh * 0.30, cx - cw * 0.02, cy - cbh * 0.14, CREAM, Math.max(2, w * 0.005));
  seg(ctx, cx + cw * 0.12, cy - cbh * 0.34, cx + cw * 0.16, cy - cbh * 0.16, CREAM, Math.max(2, w * 0.005));
  // Door handle + side mirror + vent.
  rr(ctx, cx + cw * 0.02, cy + cbh * 0.02, cw * 0.07, cbh * 0.07, cbh * 0.03, INK, null);
  poly(ctx, [[cx + cw * 0.20, cy - cbh * 0.18], [cx + cw * 0.27, cy - cbh * 0.22],
    [cx + cw * 0.28, cy - cbh * 0.12], [cx + cw * 0.20, cy - cbh * 0.10]], SUN, INK, Math.max(2, w * 0.005));
  poly(ctx, [[cx - cw * 0.36, cy + cbh * 0.10], [cx - cw * 0.28, cy + cbh * 0.10],
    [cx - cw * 0.28, cy + cbh * 0.28], [cx - cw * 0.36, cy + cbh * 0.28]], INK, null);
  // Headlight + taillight.
  poly(ctx, [[cx + cw * 0.42, cy - cbh * 0.02], [cx + cw * 0.50, cy + cbh * 0.02],
    [cx + cw * 0.46, cy + cbh * 0.12], [cx + cw * 0.40, cy + cbh * 0.08]], CREAM, INK, Math.max(2.5, w * 0.006));
  rr(ctx, cx - cw * 0.50, cy + cbh * 0.02, cw * 0.03, cbh * 0.12, cbh * 0.04, TORII, INK, Math.max(2, w * 0.005));
  // Wheels: ink tyres, cream rims, 5 ink spokes.
  for (const wx of [cx - cw * 0.28, cx + cw * 0.30]) {
    const wy = wheelY;
    circle(ctx, wx, wy, R, INK, INK, Math.max(3, w * 0.008));
    circle(ctx, wx, wy, R * 0.60, CREAM, INK, Math.max(2, w * 0.005));
    circle(ctx, wx, wy, R * 0.18, SUN, INK, Math.max(2, w * 0.005));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      seg(ctx, wx, wy, wx + Math.cos(a) * R * 0.56, wy + Math.sin(a) * R * 0.56, INK, Math.max(2, w * 0.005));
    }
  }
  // Low sun flare on the roof + a bird.
  circle(ctx, cx + cw * 0.05, cy - cbh * 0.38, h * 0.012, CREAM, null);
  seg(ctx, x + w * 0.30, y + h * 0.14, x + w * 0.325, y + h * 0.13, INK, Math.max(2, w * 0.005));
  seg(ctx, x + w * 0.325, y + h * 0.13, x + w * 0.35, y + h * 0.14, INK, Math.max(2, w * 0.005));
}

// ---------------------------------------------------------------- 8. beach
function drawBeach(ctx, x, y, w, h, rng) {
  // Dusk-purple sky, top 60% of the panel.
  ctx.fillStyle = vgrad(ctx, x, y, w, h * 0.60, [[0, DUSK], [0.45, VIOLET], [0.75, MAGENTA], [1, ORANGE]]);
  ctx.fillRect(x, y, w, h * 0.60);
  // Low setting sun, half-sunk on the high horizon.
  const hz = y + h * 0.40;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, hz - y); ctx.clip();
  sunDisc(ctx, x + w * 0.50, hz - h * 0.01, h * 0.085, SUN, PEACH);
  ctx.restore();
  softCloud(ctx, x + w * 0.18, y + h * 0.08, w * 0.07, PEACH, 0.85);
  softCloud(ctx, x + w * 0.78, y + h * 0.12, w * 0.055, CREAM, 0.8);
  softCloud(ctx, x + w * 0.48, y + h * 0.20, w * 0.05, PEACH, 0.7);
  softCloud(ctx, x + w * 0.30, y + h * 0.26, w * 0.04, CREAM, 0.6);
  // Sea: only ~40% of the panel, from the high horizon down.
  ctx.fillStyle = vgrad(ctx, x, hz, w, h * 0.25, [[0, TEAL], [0.55, DEEP], [1, DUSK]]);
  ctx.fillRect(x, hz, w, h * 0.25);
  // Sun glitter on the sea.
  ctx.save(); ctx.globalAlpha = 0.6;
  for (let i = 0; i < 6; i++) {
    const gy = hz + h * 0.03 + i * h * 0.035;
    const gw = w * (0.04 + i * 0.014);
    ctx.fillStyle = SUN;
    ctx.fillRect(x + w * 0.50 - gw / 2, gy, gw, h * 0.010);
  }
  ctx.restore();
  // Gentle wave lines.
  ctx.save(); ctx.strokeStyle = 'rgba(255,243,214,0.55)'; ctx.lineWidth = Math.max(2, w * 0.004); ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const wy = hz + h * (0.06 + i * 0.05);
    ctx.beginPath();
    ctx.moveTo(x + w * (0.10 + i * 0.05), wy);
    ctx.quadraticCurveTo(x + w * 0.35, wy - h * 0.012, x + w * 0.60, wy);
    ctx.quadraticCurveTo(x + w * 0.80, wy + h * 0.012, x + w * 0.92, wy);
    ctx.stroke();
  }
  ctx.restore();
  // Sand: bottom <=35% of the panel.
  const sandY = y + h * 0.65;
  ctx.fillStyle = vgrad(ctx, x, sandY, w, h - sandY, [[0, SAND], [0.6, PEACH], [1, '#D9A86C']]);
  ctx.fillRect(x, sandY, w, h - sandY);
  // Wet sand band at the waterline.
  ctx.fillStyle = 'rgba(14,94,122,0.35)';
  ctx.fillRect(x, sandY, w, h * 0.03);
  // Footprints walking up the sand, seeded, in pairs.
  ctx.save(); ctx.fillStyle = 'rgba(12,8,18,0.35)';
  let fx = x + w * 0.42, fy = sandY + h * 0.10;
  for (let i = 0; i < 7; i++) {
    ellipse(ctx, fx + (i % 2 ? w * 0.015 : -w * 0.015), fy + i * h * 0.032, w * 0.012, h * 0.012, 'rgba(12,8,18,0.35)', null);
    fx += w * (0.004 + rng() * 0.006);
  }
  ctx.restore();
  // Stones + a shell on the sand.
  circle(ctx, x + w * 0.72, sandY + h * 0.16, h * 0.018, DUSK, INK, Math.max(2, w * 0.005));
  circle(ctx, x + w * 0.76, sandY + h * 0.18, h * 0.012, PEACH, INK, Math.max(1.5, w * 0.004));
  circle(ctx, x + w * 0.20, sandY + h * 0.22, h * 0.014, CREAM, INK, Math.max(1.5, w * 0.004));
  ctx.beginPath();
  ctx.arc(x + w * 0.84, sandY + h * 0.24, h * 0.02, Math.PI, Math.PI * 2);
  ctx.fillStyle = MAGENTA; ctx.fill();
  ctx.lineWidth = Math.max(2, w * 0.005); ctx.strokeStyle = INK; ctx.stroke();
  seg(ctx, x + w * 0.84, sandY + h * 0.24, x + w * 0.84, sandY + h * 0.20, INK, Math.max(1.5, w * 0.004));
  // Palm silhouettes left + right, framing the panorama.
  drawPalm(ctx, x + w * 0.04, sandY + h * 0.06, h * 0.34, 0.45, PALM);
  drawPalm(ctx, x + w * 0.10, sandY + h * 0.04, h * 0.22, 0.2, PALM);
  drawPalm(ctx, x + w * 0.96, sandY + h * 0.06, h * 0.32, -0.45, PALM);
  drawPalm(ctx, x + w * 0.90, sandY + h * 0.04, h * 0.20, -0.2, PALM);
  // Long shadows from the palms across the sand.
  ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = INK;
  poly(ctx, [[x + w * 0.04, sandY + h * 0.06], [x + w * 0.30, sandY + h * 0.30],
    [x + w * 0.34, sandY + h * 0.32], [x + w * 0.06, sandY + h * 0.08]], INK, null);
  poly(ctx, [[x + w * 0.96, sandY + h * 0.06], [x + w * 0.72, sandY + h * 0.30],
    [x + w * 0.68, sandY + h * 0.32], [x + w * 0.94, sandY + h * 0.08]], INK, null);
  ctx.restore();
}

// ---------------------------------------------------------------- dispatcher
const SCENE_DRAW = {
  boat: drawBoat,
  bike: drawBike,
  neon: drawNeon,
  hero: drawHero,
  yatai: drawYatai,
  torii: drawTorii,
  car: drawCar,
  beach: drawBeach,
};

export function drawDemoScene(ctx, scene, x, y, w, h) {
  const fn = SCENE_DRAW[scene];
  if (!fn || !ctx) return;
  const rng = rngFor(scene);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  // Base fill so no scene ever leaves a transparent corner.
  ctx.fillStyle = CREAM;
  ctx.fillRect(x, y, w, h);
  fn(ctx, x, y, w, h, rng);
  ctx.restore();
}
