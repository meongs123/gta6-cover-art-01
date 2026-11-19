// main.js — VICE KEY app UI wiring (index.html).
// Preview renders at half resolution for speed; exports render full size.
// All work is local + offline; no network calls after page load.

import {
  renderCover,
  makeCanvas,
  LAYOUTS,
  LAYOUT_ORDER,
  EXPORT_SIZES,
  PREVIEW_SIZES,
  CAPTION_DEFAULT,
  panelFillOrder,
} from './cover.js';
import { GRADE_NAMES } from './grades.js';
import {
  analyzePhoto,
  loadImageFile,
  loadImageUrl,
  assignPhotos,
  cropRectForPanel,
} from './photos.js';

export const state = {
  layout: 'keyart',
  grade: 'sunset',
  ratio: '4:5',
  caption: CAPTION_DEFAULT,
  photos: [],
  assignments: new Map(), // panelId -> {photo, zoom, anchor?}
  selectedPanel: null,
};

let emblemImg = null;
let renderToken = 0;
window.__vicekeyTimings = { previewMs: null, exports: {} };

const $ = (id) => document.getElementById(id);
const previewCanvas = $('preview');
const statusEl = $('status');

const LAYOUT_LABELS = {
  keyart: 'Key Art hero',
  grid: '5-panel grid',
  portrait: 'Single portrait',
  strip: '3-panel strip',
};
const GRADE_LABELS = {
  sunset: 'Sunset',
  neon: 'Neon Nights',
  teal: 'Teal Heat',
  mono: 'Mono Ink',
};
const RATIO_LABELS = { '4:5': '4:5 · 1080×1350', '1:1': '1:1 · 1080×1080', '16:9': '16:9 · 1920×1080' };

function buildRadioRow(el, options, current, onPick) {
  el.innerHTML = '';
  for (const [value, label] of Object.entries(options)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.setAttribute('aria-pressed', value === current ? 'true' : 'false');
    b.addEventListener('click', () => {
      onPick(value);
      for (const sib of el.children) sib.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-pressed', 'true');
    });
    el.appendChild(b);
  }
}

function reassign() {
  // Preserve per-photo zoom/anchor across layout changes.
  const keep = new Map();
  for (const asg of state.assignments.values()) {
    keep.set(asg.photo.id, { zoom: asg.zoom, anchor: asg.anchor });
  }
  const next = assignPhotos(state.photos, panelFillOrder(state.layout, state.ratio));
  for (const asg of next.values()) {
    const prev = keep.get(asg.photo.id);
    if (prev) {
      asg.zoom = prev.zoom;
      asg.anchor = prev.anchor;
    }
  }
  state.assignments = next;
  if (state.selectedPanel && !state.assignments.has(state.selectedPanel)) {
    state.selectedPanel = null;
  }
}

function currentCrop(panelId) {
  const asg = state.assignments.get(panelId);
  if (!asg) return null;
  const panel = LAYOUTS[state.layout].panels[state.ratio][panelId];
  const pw = (panel.x1 - panel.x0) * previewCanvas.width;
  const ph = (panel.y1 - panel.y0) * previewCanvas.height;
  const analysis = asg.photo.analysis ?? { focus: { x: 0.5, y: 0.5 }, faces: [] };
  const faces = analysis.faces ?? [];
  const largest = faces.length
    ? faces.reduce((a, b) => (a.w * a.h >= b.w * b.h ? a : b))
    : null;
  const crop = cropRectForPanel(
    asg.photo.img.naturalWidth,
    asg.photo.img.naturalHeight,
    pw / ph,
    asg.anchor ?? analysis.focus,
    asg.zoom ?? 1,
    largest,
    faces,
  );
  return { panel, pw, ph, crop, asg, faces };
}

function faceSafeNote() {
  const hero = currentCrop('E') ?? currentCrop('P') ?? currentCrop('S2');
  if (!hero || hero.faces.length === 0) return 'Face safe: n/a (no faces detected)';
  const largest = hero.faces.reduce((a, b) => (a.w * a.h >= b.w * b.h ? a : b));
  const chinPct =
    (((largest.y + largest.h) * hero.asg.photo.img.naturalHeight - hero.crop.sy) / hero.crop.sh) *
    100;
  return chinPct <= 62
    ? `Face safe: OK (chin at ${chinPct.toFixed(0)}% of panel)`
    : `Face safe: CHECK — chin at ${chinPct.toFixed(0)}% (over 62%)`;
}

async function renderPreview() {
  const token = ++renderToken;
  const [w, h] = PREVIEW_SIZES[state.ratio];
  if (previewCanvas.width !== w || previewCanvas.height !== h) {
    previewCanvas.width = w;
    previewCanvas.height = h;
  }
  const t0 = performance.now();
  await renderCover(previewCanvas, {
    layout: state.layout,
    grade: state.grade,
    ratio: state.ratio,
    caption: state.caption,
    assignments: state.assignments,
    emblemImg,
    yieldBetweenPanels: true,
  });
  if (token !== renderToken) return; // superseded
  const ms = performance.now() - t0;
  window.__vicekeyTimings.previewMs = ms;
  drawAnchorHandle();
  updatePanelPanel();
  statusEl.textContent =
    `Preview ${ms.toFixed(0)} ms · ${state.photos.length} photo(s) · ` +
    `${LAYOUT_LABELS[state.layout]} · ${GRADE_LABELS[state.grade]} · ${faceSafeNote()}`;
}

function drawAnchorHandle() {
  const id = state.selectedPanel;
  if (!id) return;
  const info = currentCrop(id);
  if (!info) return;
  const { panel, pw, ph, crop, asg } = info;
  const analysis = asg.photo.analysis ?? { focus: { x: 0.5, y: 0.5 } };
  const focus = asg.anchor ?? analysis.focus;
  const fx = panel.x0 * previewCanvas.width + ((focus.x * asg.photo.img.naturalWidth - crop.sx) / crop.sw) * pw;
  const fy = panel.y0 * previewCanvas.height + ((focus.y * asg.photo.img.naturalHeight - crop.sy) / crop.sh) * ph;
  const ctx = previewCanvas.getContext('2d');
  ctx.save();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(fx, fy, 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(fx - 18, fy);
  ctx.lineTo(fx + 18, fy);
  ctx.moveTo(fx, fy - 18);
  ctx.lineTo(fx, fy + 18);
  ctx.stroke();
  ctx.fillStyle = '#FFC21A';
  ctx.beginPath();
  ctx.arc(fx, fy, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function updatePanelPanel() {
  const id = state.selectedPanel;
  const label = $('panel-label');
  const slider = $('zoom-slider');
  const resetBtn = $('reset-anchor');
  if (!id || !state.assignments.has(id)) {
    label.textContent = 'No panel selected.';
    slider.disabled = true;
    resetBtn.disabled = true;
    return;
  }
  const asg = state.assignments.get(id);
  label.textContent = `Panel ${id} — ${asg.photo.name} (${asg.photo.analysis?.source ?? '?'})`;
  slider.disabled = false;
  slider.value = String(asg.zoom ?? 1);
  $('zoom-value').textContent = `${(asg.zoom ?? 1).toFixed(2)}×`;
  resetBtn.disabled = !asg.anchor;
}

export function selectPanel(id) {
  state.selectedPanel = id;
  renderPreview();
}

export async function addPhoto(img, name) {
  if (state.photos.length >= 6) {
    statusEl.textContent = 'Photo limit reached (6). Remove a photo first — not implemented; reload to start over.';
    return null;
  }
  const analysis = await analyzePhoto(img);
  const photo = {
    id: `p${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    img,
    name,
    analysis,
  };
  state.photos.push(photo);
  reassign();
  renderPhotoStrip();
  await renderPreview();
  return photo;
}

export async function addPhotoFromUrl(url) {
  const img = await loadImageUrl(url);
  const name = url.split('/').pop() ?? url;
  return addPhoto(img, name);
}

function renderPhotoStrip() {
  const strip = $('photo-strip');
  strip.innerHTML = '';
  for (const photo of state.photos) {
    const fig = document.createElement('figure');
    const inUse = [...state.assignments.values()].some((a) => a.photo.id === photo.id);
    fig.setAttribute('aria-pressed', inUse ? 'true' : 'false');
    const thumb = document.createElement('img');
    thumb.src = photo.img.src;
    thumb.alt = photo.name;
    const cap = document.createElement('figcaption');
    cap.textContent = `${photo.name} · ${photo.analysis.faces.length} face(s) · ${photo.analysis.source}`;
    fig.appendChild(thumb);
    fig.appendChild(cap);
    fig.addEventListener('click', () => {
      const target = state.selectedPanel ?? 'E';
      state.assignments.set(target, { photo, zoom: 1 });
      renderPreview();
      renderPhotoStrip();
    });
    strip.appendChild(fig);
  }
  $('photo-note').textContent =
    state.photos.length === 0
      ? 'No photos yet — the cover uses built-in demo art.'
      : `${state.photos.length} photo(s) loaded. Click a thumbnail to assign it to the selected panel (or hero).`;
}

function downloadCanvas(canvas, filename) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      resolve(blob?.size ?? 0);
    }, 'image/png');
  });
}

async function exportSize(ratio) {
  const canvas = makeCanvas(ratio, false);
  const t0 = performance.now();
  await renderCover(canvas, {
    layout: state.layout,
    grade: state.grade,
    ratio,
    caption: state.caption,
    assignments: state.assignments,
    emblemImg,
  });
  const ms = performance.now() - t0;
  window.__vicekeyTimings.exports[ratio] = ms;
  const size = await downloadCanvas(canvas, `vice-key-${ratio.replace(':', 'x')}.png`);
  statusEl.textContent =
    `Exported ${ratio} in ${ms.toFixed(0)} ms (${(size / 1024).toFixed(0)} KiB PNG) · ${faceSafeNote()}`;
  return ms;
}

export async function exportAll() {
  const times = {};
  for (const ratio of ['4:5', '1:1', '16:9']) {
    times[ratio] = await exportSize(ratio);
  }
  const total = Object.values(times).reduce((a, b) => a + b, 0);
  statusEl.textContent =
    `All 3 sizes exported in ${total.toFixed(0)} ms ` +
    `(${Object.entries(times).map(([r, ms]) => `${r} ${ms.toFixed(0)} ms`).join(' · ')})`;
  return times;
}

function hitTestPanel(px, py) {
  const panels = LAYOUTS[state.layout].panels[state.ratio];
  for (const [id, panel] of Object.entries(panels)) {
    const x0 = panel.x0 * previewCanvas.width;
    const x1 = panel.x1 * previewCanvas.width;
    const y0 = panel.y0 * previewCanvas.height;
    const y1 = panel.y1 * previewCanvas.height;
    if (px >= x0 && px <= x1 && py >= y0 && py <= y1) return id;
  }
  return null;
}

function canvasPoint(e) {
  const rect = previewCanvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * previewCanvas.width,
    y: ((e.clientY - rect.top) / rect.height) * previewCanvas.height,
  };
}

let draggingAnchor = false;

function wirePointer() {
  previewCanvas.addEventListener('pointerdown', (e) => {
    const pt = canvasPoint(e);
    const id = hitTestPanel(pt.x, pt.y);
    if (!id) return;
    state.selectedPanel = id;
    const info = currentCrop(id);
    if (info) {
      const { panel, pw, ph, crop, asg } = info;
      const analysis = asg.photo.analysis ?? { focus: { x: 0.5, y: 0.5 } };
      const focus = asg.anchor ?? analysis.focus;
      const fx = panel.x0 * previewCanvas.width + ((focus.x * asg.photo.img.naturalWidth - crop.sx) / crop.sw) * pw;
      const fy = panel.y0 * previewCanvas.height + ((focus.y * asg.photo.img.naturalHeight - crop.sy) / crop.sh) * ph;
      if (Math.hypot(pt.x - fx, pt.y - fy) < 24) draggingAnchor = true;
    }
    previewCanvas.setPointerCapture(e.pointerId);
    renderPreview();
  });
  previewCanvas.addEventListener('pointermove', (e) => {
    if (!draggingAnchor || !state.selectedPanel) return;
    const pt = canvasPoint(e);
    const info = currentCrop(state.selectedPanel);
    if (!info) return;
    const { panel, pw, ph, crop, asg } = info;
    const lx = pt.x - panel.x0 * previewCanvas.width;
    const ly = pt.y - panel.y0 * previewCanvas.height;
    const imgX = crop.sx + (lx / pw) * crop.sw;
    const imgY = crop.sy + (ly / ph) * crop.sh;
    asg.anchor = {
      x: Math.max(0.05, Math.min(0.95, imgX / asg.photo.img.naturalWidth)),
      y: Math.max(0.05, Math.min(0.95, imgY / asg.photo.img.naturalHeight)),
    };
    renderPreview();
  });
  previewCanvas.addEventListener('pointerup', () => {
    draggingAnchor = false;
  });
}

async function init() {
  buildRadioRow($('layout-row'), LAYOUT_LABELS, state.layout, (v) => {
    state.layout = v;
    reassign();
    renderPreview();
  });
  buildRadioRow($('grade-row'), GRADE_LABELS, state.grade, (v) => {
    state.grade = v;
    renderPreview();
  });
  buildRadioRow($('ratio-row'), RATIO_LABELS, state.ratio, (v) => {
    state.ratio = v;
    reassign();
    renderPreview();
  });
  $('caption-input').addEventListener('input', (e) => {
    state.caption = e.target.value;
    renderPreview();
  });
  $('file-input').addEventListener('change', async (e) => {
    for (const file of e.target.files) {
      try {
        const img = await loadImageFile(file);
        await addPhoto(img, file.name);
      } catch (err) {
        statusEl.textContent = `Could not load ${file.name}.`;
      }
    }
    e.target.value = '';
  });
  $('sample-pier').addEventListener('click', () => addPhotoFromUrl('samples/pier.jpg'));
  $('sample-boulevard').addEventListener('click', () => addPhotoFromUrl('samples/boulevard.jpg'));
  $('zoom-slider').addEventListener('input', (e) => {
    const asg = state.assignments.get(state.selectedPanel);
    if (!asg) return;
    asg.zoom = parseFloat(e.target.value);
    $('zoom-value').textContent = `${asg.zoom.toFixed(2)}×`;
    renderPreview();
  });
  $('reset-anchor').addEventListener('click', () => {
    const asg = state.assignments.get(state.selectedPanel);
    if (!asg) return;
    delete asg.anchor;
    renderPreview();
  });
  $('export-4-5').addEventListener('click', () => exportSize('4:5'));
  $('export-1-1').addEventListener('click', () => exportSize('1:1'));
  $('export-16-9').addEventListener('click', () => exportSize('16:9'));
  $('export-all').addEventListener('click', exportAll);
  wirePointer();

  // Fonts + emblem (both local; render proceeds without the emblem if it fails).
  try {
    await document.fonts.load('100px Anton');
    await document.fonts.ready;
  } catch (e) {
    // Canvas falls back to sans-serif; the title still renders at 84% width.
  }
  try {
    emblemImg = await loadImageUrl('emblem/sun-disc.svg');
  } catch (e) {
    emblemImg = null;
  }
  renderPhotoStrip();
  await renderPreview();

  // Shot / test harness (?shot=N / ?test=perf) — local capture only.
  const params = new URLSearchParams(location.search);
  if (params.has('shot') || params.has('test')) {
    await import('./shots.js');
  }
}

init();
