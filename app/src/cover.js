// cover.js — layout geometry, compositing, title, emblem.
// Specs: v3-brief.md §2.2/§4, spec-layouts.md, spec-ratios.md, shot-list.md.
//
// Panel maps are fractions of the cover (x 0..1 left->right, y 0..1 top->bottom).
// Title: Anton one line "VICE KEY", 84% width, band y 67-77% (4:5 + 1:1) or
// y 62-78% (16:9), stroke 7-8% of font size (Option 2, user decision 19 Nov).
// Emblem: sun-disc, diameter ~12% of cover width, centre (88%, 12%).

import { gradeImageData } from './grades.js';
import { drawDemoScene } from './demo-art.js';
import { cropRectForPanel } from './photos.js';

export const CAPTION_DEFAULT = 'VICE KEY';
export const TITLE_WIDTH = 0.84;
export const STROKE_RATIO = 0.077; // ~7.7% of font size
export const TITLE_CAP_SHIFT = 0.032; // em-box middle -> cap centre (measured, see renderCover)
export const INK = '#0C0812';

export const EXPORT_SIZES = {
  '4:5': [1080, 1350],
  '1:1': [1080, 1080],
  '16:9': [1920, 1080],
};
export const PREVIEW_SIZES = {
  '4:5': [540, 675],
  '1:1': [540, 540],
  '16:9': [960, 540],
};

// Title band per ratio: [y0, y1] fractions.
const TITLE_BAND = { '4:5': [0.67, 0.77], '1:1': [0.67, 0.77], '16:9': [0.62, 0.78] };

// Panel: {x0,y0,x1,y1, scene, tilt} — tilt in degrees, ±1-3° (spec-layouts).
function p(x0, y0, x1, y1, scene, tilt = 0) {
  return { x0: x0 / 100, y0: y0 / 100, x1: x1 / 100, y1: y1 / 100, scene, tilt };
}

export const LAYOUTS = {
  keyart: {
    name: 'Key Art hero',
    panels: {
      '4:5': {
        A: p(3, 2, 30, 27, 'boat', -1),
        B: p(31, 2, 68, 27, 'bike', 1.5),
        C: p(69, 2, 97, 27, 'neon', -2),
        E: p(3, 28, 46, 67, 'hero', 1),
        F: p(47, 28, 70, 47, 'yatai', -1.5),
        G: p(71, 28, 97, 47, 'torii', 2),
        H: p(47, 48, 97, 67, 'car', -1),
        I: p(3, 68, 97, 97, 'beach', 0.5),
      },
      // 1:1 reflow (spec-ratios §3): top row y 2-24, F/G y 25-44, H y 45-64,
      // hero widens to x 50, panorama becomes a bottom strip y 82-97. The
      // band y 65-81 between them is the dark title band (title sits on it).
      '1:1': {
        A: p(3, 2, 30, 24, 'boat', -1),
        B: p(31, 2, 68, 24, 'bike', 1.5),
        C: p(69, 2, 97, 24, 'neon', -2),
        E: p(3, 28, 50, 67, 'hero', 1),
        F: p(51, 25, 73, 44, 'yatai', -1.5),
        G: p(74, 25, 97, 44, 'torii', 2),
        H: p(51, 45, 97, 64, 'car', -1),
        I: p(3, 82, 97, 97, 'beach', 0.5),
      },
      // 16:9 reflow (spec-ratios §4): top row becomes 3 columns y 2-48,
      // hero bottom-left, car bottom-right, panorama thin bottom strip.
      // F/G are DROPPED in 16:9 (spec allows it; the strip is crowded).
      '16:9': {
        A: p(3, 2, 24, 48, 'boat', -1),
        B: p(25, 2, 68, 48, 'bike', 1.5),
        C: p(69, 2, 97, 48, 'neon', -2),
        E: p(3, 49, 46, 97, 'hero', 1),
        H: p(47, 49, 97, 82, 'car', -1),
        I: p(3, 83, 97, 97, 'beach', 0.5),
      },
    },
  },
  grid: {
    name: '5-panel grid',
    panels: {
      '4:5': {
        E: p(3, 2, 52, 67, 'hero', 1),
        B: p(53, 2, 97, 34, 'bike', 1.5),
        H: p(53, 35, 97, 67, 'car', -1),
        F: p(3, 68, 49, 97, 'yatai', -1.5),
        I: p(50, 68, 97, 97, 'beach', 0.5),
      },
      '1:1': {
        E: p(3, 2, 50, 67, 'hero', 1),
        B: p(51, 2, 97, 34, 'bike', 1.5),
        H: p(51, 35, 97, 67, 'car', -1),
        F: p(3, 68, 49, 97, 'yatai', -1.5),
        I: p(50, 68, 97, 97, 'beach', 0.5),
      },
      '16:9': {
        E: p(3, 2, 46, 97, 'hero', 1),
        B: p(47, 2, 97, 48, 'bike', 1.5),
        H: p(47, 49, 97, 82, 'car', -1),
        F: p(47, 83, 72, 97, 'yatai', -1.5),
        I: p(73, 83, 97, 97, 'beach', 0.5),
      },
    },
  },
  portrait: {
    name: 'Single-scene portrait',
    panels: {
      '4:5': { P: p(0, 0, 100, 100, 'hero', 0) },
      '1:1': { P: p(0, 0, 100, 100, 'hero', 0) },
      '16:9': { P: p(0, 0, 100, 100, 'hero', 0) },
    },
  },
  strip: {
    name: '3-panel strip',
    panels: {
      '4:5': {
        S1: p(3, 2, 33, 97, 'torii', -1),
        S2: p(34, 2, 66, 97, 'hero', 1),
        S3: p(67, 2, 97, 97, 'boat', -1.5),
      },
      '1:1': {
        S1: p(3, 2, 33, 97, 'torii', -1),
        S2: p(34, 2, 66, 97, 'hero', 1),
        S3: p(67, 2, 97, 97, 'boat', -1.5),
      },
      // 16:9: vertical strips would be too narrow — rotate to horizontal bands.
      '16:9': {
        S1: p(3, 2, 97, 32, 'torii', -1),
        S2: p(3, 33, 97, 65, 'hero', 1),
        S3: p(3, 66, 97, 97, 'boat', -1.5),
      },
    },
  },
};

export const LAYOUT_ORDER = ['keyart', 'grid', 'portrait', 'strip'];

/** Panel ids in fill order for a layout+ratio (hero first). */
export function panelFillOrder(layout, ratio) {
  const panels = LAYOUTS[layout].panels[ratio];
  const ids = Object.keys(panels);
  // Hero (E / P / S2) first, then the rest in reading order.
  const heroFirst = ['E', 'P', 'S2'];
  ids.sort((a, b) => {
    const ai = heroFirst.includes(a) ? 0 : 1;
    const bi = heroFirst.includes(b) ? 0 : 1;
    if (ai !== bi) return ai - bi;
    return panels[a].y0 - panels[b].y0 || panels[a].x0 - panels[b].x0;
  });
  return ids;
}

/**
 * Render the cover onto `canvas` (its width/height are the output size).
 * @param {HTMLCanvasElement} canvas
 * @param {Object} opts
 * @param {string} opts.layout - keyart | grid | portrait | strip
 * @param {string} opts.grade - sunset | neon | teal | mono
 * @param {string} opts.ratio - '4:5' | '1:1' | '16:9'
 * @param {string} opts.caption - title text, default 'VICE KEY'
 * @param {Map<string,{photo:{img,analysis},zoom:number,anchor?:{x,y}}>} opts.assignments
 * @param {HTMLImageElement|null} opts.emblemImg - loaded sun-disc SVG or null
 * @param {boolean} opts.yieldBetweenPanels - yield to the event loop between panels (UI mode)
 */
export async function renderCover(canvas, opts) {
  const layout = opts.layout ?? 'keyart';
  const grade = opts.grade ?? 'sunset';
  const ratio = opts.ratio ?? '4:5';
  const caption = (opts.caption ?? CAPTION_DEFAULT).trim() || CAPTION_DEFAULT;
  const assignments = opts.assignments ?? new Map();
  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);

  const panels = LAYOUTS[layout].panels[ratio];
  for (const [id, panel] of Object.entries(panels)) {
    const pw = Math.max(2, Math.round((panel.x1 - panel.x0) * W));
    const ph = Math.max(2, Math.round((panel.y1 - panel.y0) * H));
    const off = document.createElement('canvas');
    off.width = pw;
    off.height = ph;
    const octx = off.getContext('2d', { willReadFrequently: true });
    const asg = assignments.get(id);
    let faceBoxesPx = [];
    if (asg && asg.photo && asg.photo.img) {
      const img = asg.photo.img;
      const analysis = asg.photo.analysis ?? { focus: { x: 0.5, y: 0.5 }, faces: [] };
      const focus = asg.anchor ?? analysis.focus;
      const faces = analysis.faces ?? [];
      const largest = faces.length
        ? faces.reduce((a, b) => (a.w * a.h >= b.w * b.h ? a : b))
        : null;
      const crop = cropRectForPanel(
        img.naturalWidth,
        img.naturalHeight,
        pw / ph,
        focus,
        asg.zoom ?? 1,
        largest,
      );
      octx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, pw, ph);
      // Face boxes in panel pixels (edge ink is halved there).
      faceBoxesPx = faces.map((f) => ({
        x: ((f.x * img.naturalWidth - crop.sx) / crop.sw) * pw,
        y: ((f.y * img.naturalHeight - crop.sy) / crop.sh) * ph,
        w: (f.w * img.naturalWidth / crop.sw) * pw,
        h: (f.h * img.naturalHeight / crop.sh) * ph,
      }));
    } else {
      drawDemoScene(octx, panel.scene, 0, 0, pw, ph);
    }
    const imageData = octx.getImageData(0, 0, pw, ph);
    gradeImageData(imageData, grade, faceBoxesPx);
    octx.putImageData(imageData, 0, 0);
    // Composite with a slight tilt around the panel centre.
    const cx = ((panel.x0 + panel.x1) / 2) * W;
    const cy = ((panel.y0 + panel.y1) / 2) * H;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((panel.tilt * Math.PI) / 180);
    ctx.drawImage(off, -pw / 2, -ph / 2, pw, ph);
    ctx.restore();
    if (opts.yieldBetweenPanels) {
      await new Promise((r) => requestAnimationFrame(r));
    }
  }

  // Emblem: sun-disc, diameter ~12% of cover width, centre (88%, 12%).
  // A dark backing disc first, so the badge reads over any panel behind it.
  if (opts.emblemImg) {
    const d = 0.12 * W;
    ctx.save();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(0.88 * W, 0.12 * H, (d * 1.13) / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.drawImage(opts.emblemImg, 0.88 * W - d / 2, 0.12 * H - d / 2, d, d);
  }

  // Title: Anton one line, 84% width, centred in the band.
  // Measured (offscreen render, 1080x1350): drawing at the band centre puts
  // the CAP centre at 68.8% (caps 59.6-78.1%), because 'middle' centres the
  // em box, not the caps. Shift +3.2% so the caps centre on the band (72%),
  // matching the verified Anton specimen (caps 62.5-81.5%).
  const [by0, by1] = TITLE_BAND[ratio];
  const bandCy = ((by0 + by1) / 2 + TITLE_CAP_SHIFT) * H;
  const targetWidth = TITLE_WIDTH * W;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `100px Anton, sans-serif`;
  const trial = ctx.measureText(caption).width || 1;
  const fontSize = Math.round((100 * targetWidth) / trial);
  ctx.font = `${fontSize}px Anton, sans-serif`;
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(2, STROKE_RATIO * fontSize);
  ctx.strokeText(caption, W / 2, bandCy);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(caption, W / 2, bandCy);
}

/** Create a fresh canvas at the export (or preview) size for a ratio. */
export function makeCanvas(ratio, preview = false) {
  const [w, h] = preview ? PREVIEW_SIZES[ratio] : EXPORT_SIZES[ratio];
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
