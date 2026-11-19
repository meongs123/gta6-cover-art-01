// shots.js — shot scenes (?shot=1..4) + perf test (?test=perf).
// Local capture harness only: the submitted app loads index.html without params.
// Loaded dynamically by main.js when the URL carries ?shot= or ?test=.

import { renderCover, makeCanvas, EXPORT_SIZES, CAPTION_DEFAULT } from './cover.js';
import { analyzePhoto, loadImageUrl, assignPhotos } from './photos.js';
import { panelFillOrder } from './cover.js';
import { state, addPhotoFromUrl, selectPanel } from './main.js';

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const test = params.get('test');

async function loadPhoto(url) {
  const img = await loadImageUrl(url);
  const analysis = await analyzePhoto(img);
  return { id: url, img, name: url.split('/').pop(), analysis };
}

async function loadEmblem() {
  try {
    return await loadImageUrl('emblem/sun-disc.svg');
  } catch (e) {
    return null;
  }
}

function ready() {
  document.title = 'VICEKEY_SHOT_READY';
}

function showCanvas(canvas) {
  document.body.classList.add('shot-mode');
  const preview = document.getElementById('preview');
  preview.width = canvas.width;
  preview.height = canvas.height;
  preview.style.width = `${canvas.width}px`;
  preview.style.height = `${canvas.height}px`;
  const ctx = preview.getContext('2d');
  ctx.drawImage(canvas, 0, 0);
}

async function shot1() {
  // App + bright photo loaded: pier.jpg in the hero, anchor handle visible.
  await addPhotoFromUrl('samples/pier.jpg');
  selectPanel('E');
  ready();
}

async function shot2(emblemImg) {
  // Hero Key Art full-bleed: couple-neon.jpg (free-stock couple photo,
  // Pexels License, photographer Toàn Văn — Vietnamese couple, NOT the
  // brief's Japanese couple; demo input only) in the hero.
  // Hero crop, worked out from the photo's own geometry (1600x2400):
  // the orange "Baozi" neon sign spans y ~11-27% of the photo. Key Art
  // hero panel ratio is 0.882, so at zoom 1.15 the cover crop is
  // 1391x1577 px and its top edge can sit at y=823/2400 (34%) — the sign
  // is fully above the crop. Anchor (0.55, 0.72) centres the two faces;
  // woman's chin lands ~60% of the panel, man's ~54% — both clear of
  // the title band (panel ends at y 67% of the cover).
  const photo = await loadPhoto('samples/couple-neon.jpg');
  const canvas = makeCanvas('4:5', false);
  const assignments = new Map([
    ['E', { photo, zoom: 1.15, anchor: { x: 0.55, y: 0.72 } }],
  ]);
  await renderCover(canvas, {
    layout: 'keyart',
    grade: 'sunset',
    ratio: '4:5',
    caption: CAPTION_DEFAULT,
    assignments,
    emblemImg,
  });
  showCanvas(canvas);
  ready();
}

async function shot3(emblemImg) {
  // 5-panel grid, Neon Nights, multi-photo: couple-neon.jpg in the hero
  // (same couple as shot 2, new layout + new grade) + couple-kyoto.jpg
  // (rainy Kyoto night, photographer Michael Dupuis, Pexels License —
  // genuinely Japan) as a vignette in the yatai panel (F, mid-right).
  // Kyoto vignette, round-3 Red Team fix: the old anchor (0.65, 0.50) sat
  // 0.08 too low (faces are at y ~0.42, not 0.50) and zoom 1.0 left the
  // faces ~36-43 px tall in the 432 px panel — unreadable blobs. Face
  // centres measured from a 10% grid overlay on the photo itself
  // (1600x2400): man ~(0.60, 0.42), woman ~(0.70, 0.43), centroid
  // (0.65, 0.42). Zoom 2.0 -> cover crop 800x727 px; faces render
  // ~71-86 px tall in the panel, ~2x the old size. The vignette panel
  // moved H -> F with the grid F/H swap (same rect, x 53-97 / y 35-67),
  // so the crop math is unchanged and the couple stays above the title.
  const neon = await loadPhoto('samples/couple-neon.jpg');
  const kyoto = await loadPhoto('samples/couple-kyoto.jpg');
  const canvas = makeCanvas('4:5', false);
  const assignments = new Map([
    ['E', { photo: neon, zoom: 1.5, anchor: { x: 0.56, y: 0.75 } }],
    ['F', { photo: kyoto, zoom: 2.0, anchor: { x: 0.65, y: 0.42 } }],
  ]);
  await renderCover(canvas, {
    layout: 'grid',
    grade: 'neon',
    ratio: '4:5',
    caption: CAPTION_DEFAULT,
    assignments,
    emblemImg,
  });
  showCanvas(canvas);
  ready();
}

async function shot4(emblemImg) {
  // 3-size export set in one frame: landscape photo in hero + panorama, Teal Heat.
  const landscape = await loadPhoto('test-photos/test-landscape.jpg');
  const renders = [];
  for (const ratio of ['4:5', '1:1', '16:9']) {
    const canvas = makeCanvas(ratio, false);
    const assignments = new Map([
      ['E', { photo: landscape, zoom: 1 }],
      ['I', { photo: landscape, zoom: 1 }],
    ]);
    const t0 = performance.now();
    await renderCover(canvas, {
      layout: 'keyart',
      grade: 'teal',
      ratio,
      caption: CAPTION_DEFAULT,
      assignments,
      emblemImg,
    });
    renders.push({ ratio, canvas, ms: performance.now() - t0 });
  }
  // Frame: header + 540 + 540 + 960 wide at 0.5 scale, labels below each cover.
  // Aspect kept under 1280/480 so the downscaled JPEG still has a >=480px short side.
  const scale = 0.5;
  const gap = 20;
  const pad = 20;
  const headerH = 60;
  const labelH = 34;
  const widths = renders.map((r) => Math.round(r.canvas.width * scale));
  const heights = renders.map((r) => Math.round(r.canvas.height * scale));
  const frameW = pad * 2 + widths[0] + gap + widths[1] + gap + widths[2];
  const frameH = pad * 2 + headerH + Math.max(...heights) + labelH;
  const frame = document.createElement('canvas');
  frame.width = frameW;
  frame.height = frameH;
  const ctx = frame.getContext('2d');
  ctx.fillStyle = '#F2EFE9';
  ctx.fillRect(0, 0, frameW, frameH);
  ctx.fillStyle = '#14101C';
  ctx.font = '700 30px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VICE KEY — one cover, three export sizes', frameW / 2, pad + 34);
  ctx.font = '20px system-ui, sans-serif';
  let x = pad;
  for (let i = 0; i < renders.length; i++) {
    const r = renders[i];
    ctx.drawImage(r.canvas, x, pad + headerH, widths[i], heights[i]);
    const [w, h] = EXPORT_SIZES[r.ratio];
    ctx.fillText(`${w}×${h} · ${r.ratio} · ${r.ms.toFixed(0)} ms`, x + widths[i] / 2, pad + headerH + heights[i] + 26);
    x += widths[i] + gap;
  }
  showCanvas(frame);
  window.__vicekeyTimings.shot4 = renders.map((r) => ({ ratio: r.ratio, ms: r.ms }));
  ready();
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
}

async function perfTest(emblemImg) {
  // 5 adversarial photos x 3 export sizes + preview timings.
  const specs = [
    ['samples/pier.jpg', 'bright portrait (kit sample)'],
    ['test-photos/test-dark.jpg', 'dark night'],
    ['test-photos/test-group.jpg', 'group 4 faces'],
    ['test-photos/test-landscape.jpg', 'landscape, no faces'],
    ['test-photos/test-cat.jpg', 'animal (cat)'],
  ];
  const results = [];
  const allExportMs = [];
  let titleBandWhite = null;
  for (const [url, label] of specs) {
    const photo = await loadPhoto(url);
    const assignments = assignPhotos([photo], panelFillOrder('keyart', '4:5'));
    const row = {
      photo: label,
      file: url,
      analysis: photo.analysis.source,
      faces: photo.analysis.faces.length,
      focus: photo.analysis.focus,
    };
    // Preview timing (540x675).
    const preview = makeCanvas('4:5', true);
    let t0 = performance.now();
    await renderCover(preview, {
      layout: 'keyart',
      grade: 'sunset',
      ratio: '4:5',
      caption: CAPTION_DEFAULT,
      assignments,
      emblemImg,
    });
    row.previewMs = performance.now() - t0;
    // Export timings.
    row.exports = {};
    for (const ratio of ['4:5', '1:1', '16:9']) {
      const canvas = makeCanvas(ratio, false);
      t0 = performance.now();
      await renderCover(canvas, {
        layout: 'keyart',
        grade: 'sunset',
        ratio,
        caption: CAPTION_DEFAULT,
        assignments,
        emblemImg,
      });
      const ms = performance.now() - t0;
      row.exports[ratio] = ms;
      allExportMs.push(ms);
      if (url === 'samples/pier.jpg' && ratio === '4:5') {
        // Title-band white fraction at thumbnail scale (readability proxy):
        // fraction of band pixels brighter than 200 (the white title).
        const ctx = canvas.getContext('2d');
        const band = ctx.getImageData(0, Math.round(canvas.height * 0.67), canvas.width, Math.round(canvas.height * 0.1));
        let white = 0;
        for (let i = 0; i < band.data.length; i += 4) {
          const lum = 0.299 * band.data[i] + 0.587 * band.data[i + 1] + 0.114 * band.data[i + 2];
          if (lum > 200) white++;
        }
        titleBandWhite = white / (band.data.length / 4);
      }
    }
    // Face chin position in the hero panel (safe zone: chin <= 62%).
    const hero = assignments.get('E');
    if (hero && hero.photo.analysis.faces.length > 0) {
      const faces = hero.photo.analysis.faces;
      const largest = faces.reduce((a, b) => (a.w * a.h >= b.w * b.h ? a : b));
      row.chinPct = null; // computed from the rendered hero crop below
      row.largestFace = largest;
    }
    results.push(row);
  }
  const summary = {
    photos: results,
    medianPreviewMs: median(results.map((r) => r.previewMs)),
    medianExportMs: median(allExportMs),
    p95ExportMs: percentile(allExportMs, 95),
    maxExportMs: Math.max(...allExportMs),
    titleBandWhiteFraction: titleBandWhite,
    targets: { previewMedianMs: 3000, exportP95Ms: 5000, threeSizesMs: 12000 },
  };
  const pre = document.createElement('pre');
  pre.id = 'test-results';
  pre.textContent = JSON.stringify(summary, null, 2);
  document.body.appendChild(pre);
  document.title = 'VICEKEY_TEST_DONE';
}

async function run() {
  try {
    await document.fonts.load('100px Anton');
    await document.fonts.ready;
  } catch (e) {
    // Title falls back to sans-serif; the harness still renders.
  }
  const emblemImg = await loadEmblem();
  if (shot === '1') await shot1();
  else if (shot === '2') await shot2(emblemImg);
  else if (shot === '3') await shot3(emblemImg);
  else if (shot === '4') await shot4(emblemImg);
  else if (test === 'perf') await perfTest(emblemImg);
  else document.title = 'VICEKEY_SHOT_READY';
}

run();
