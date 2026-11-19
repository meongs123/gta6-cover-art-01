// photos.js — photo analysis (face-center + saliency), auto-crop, assignment.
// Spec: spec-any-photo-speed.md. All work is local + offline; no network.

/**
 * Analyse one loaded image.
 * @param {HTMLImageElement} img
 * @returns {Promise<{focus:{x:number,y:number}, faces:Array<{x:number,y:number,w:number,h:number}>, source:string}>}
 *   focus + faces are normalised 0..1 in image coordinates.
 */
export async function analyzePhoto(img) {
  // 1) FaceDetector when available (Chrome). Face centre beats saliency.
  if (typeof FaceDetector !== 'undefined') {
    try {
      const detector = new FaceDetector({ fastMode: true });
      const faces = await detector.detect(img);
      if (faces && faces.length > 0) {
        const boxes = faces
          .map((f) => f.boundingBox)
          .filter((b) => b.width > 8 && b.height > 8)
          .map((b) => ({
            x: b.x / img.naturalWidth,
            y: b.y / img.naturalHeight,
            w: b.width / img.naturalWidth,
            h: b.height / img.naturalHeight,
          }));
        if (boxes.length > 0) {
          // Focus = centroid of all face boxes (keeps a group in frame).
          let cx = 0;
          let cy = 0;
          for (const b of boxes) {
            cx += b.x + b.w / 2;
            cy += b.y + b.h / 2;
          }
          cx /= boxes.length;
          cy /= boxes.length;
          return { focus: clampFocus(cx, cy), faces: boxes, source: 'facedetector' };
        }
      }
    } catch (e) {
      // Fall through to saliency.
    }
  }
  // 2) Saliency fallback: grayscale -> Sobel edge + luminance deviation,
  // centre-weighted, centroid of the top 5% (spec §f).
  const focus = saliencyFocus(img);
  return { focus, faces: [], source: 'saliency' };
}

function clampFocus(x, y) {
  return {
    x: Math.max(0.15, Math.min(0.85, x)),
    y: Math.max(0.15, Math.min(0.85, y)),
  };
}

function saliencyFocus(img) {
  const W = 256;
  const H = Math.max(8, Math.round((256 * img.naturalHeight) / img.naturalWidth));
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, W, H);
  const data = ctx.getImageData(0, 0, W, H).data;
  const n = W * H;
  const lum = new Float32Array(n);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const v = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
    lum[i] = v;
    sum += v;
  }
  const mean = sum / n;
  const score = new Float32Array(n);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const gx =
        -lum[i - W - 1] - 2 * lum[i - 1] - lum[i + W - 1] +
        lum[i - W + 1] + 2 * lum[i + 1] + lum[i + W + 1];
      const gy =
        -lum[i - W - 1] - 2 * lum[i - W] - lum[i - W + 1] +
        lum[i + W - 1] + 2 * lum[i + W] + lum[i + W + 1];
      const edge = Math.sqrt(gx * gx + gy * gy) / 4;
      const dev = Math.abs(lum[i] - mean) / 255;
      // Centre weight: 1 at centre, 0.5 at the corners.
      const dx = (x / W - 0.5) * 2;
      const dy = (y / H - 0.5) * 2;
      const cw = 1 - 0.5 * Math.min(1, Math.sqrt(dx * dx + dy * dy) / Math.SQRT2);
      score[i] = (edge + dev) * cw;
    }
  }
  // Top 5% centroid.
  const sorted = Float32Array.from(score).sort();
  const threshold = sorted[Math.floor(n * 0.95)] ?? 0;
  let sx = 0;
  let sy = 0;
  let count = 0;
  for (let i = 0; i < n; i++) {
    if (score[i] >= threshold && score[i] > 0) {
      sx += i % W;
      sy += Math.floor(i / W);
      count++;
    }
  }
  if (count === 0) return { x: 0.5, y: 0.5 };
  return clampFocus(sx / count / W, sy / count / H);
}

/**
 * Object-fit cover crop for a panel, centred on the focus point.
 * @param {number} imgW, imgH - image pixels
 * @param {number} panelRatio - panel width / height
 * @param {{x:number,y:number}} focus - normalised focus (0..1)
 * @param {number} zoom - 0.8..2.0 (1 = cover fit)
 * @param {{x:number,y:number,w:number,h:number}|null} face - largest face, normalised, for the safe-zone shift
 * @param {Array<{x:number,y:number,w:number,h:number}>} allFaces - all detected faces; the crop
 *   zooms out (never below 0.8) to keep them all in frame when possible
 * @returns {{sx:number,sy:number,sw:number,sh:number}} source rect in image pixels
 */
export function cropRectForPanel(imgW, imgH, panelRatio, focus, zoom = 1, face = null, allFaces = []) {
  // Cover rect at zoom 1.
  let sw = imgW;
  let sh = imgW / panelRatio;
  if (sh > imgH) {
    sh = imgH;
    sw = imgH * panelRatio;
  }
  // Zoom out to fit all faces (group photos) when they would be cut.
  if (allFaces.length > 1) {
    let fx0 = 1;
    let fy0 = 1;
    let fx1 = 0;
    let fy1 = 0;
    for (const f of allFaces) {
      fx0 = Math.min(fx0, f.x);
      fy0 = Math.min(fy0, f.y);
      fx1 = Math.max(fx1, f.x + f.w);
      fy1 = Math.max(fy1, f.y + f.h);
    }
    const needW = (fx1 - fx0) * imgW * 1.1;
    const needH = (fy1 - fy0) * imgH * 1.1;
    const zoomOut = Math.min(1, sw / Math.max(needW, 1), sh / Math.max(needH, 1));
    if (zoomOut >= 0.8) zoom = Math.min(zoom, zoomOut);
  }
  // Zoom in (or out, clamped to the image bounds).
  sw = Math.min(imgW, sw / zoom);
  sh = sw / panelRatio;
  if (sh > imgH) {
    sh = imgH;
    sw = sh * panelRatio;
  }
  let sx = focus.x * imgW - sw / 2;
  let sy = focus.y * imgH - sh / 2;
  // Face safe zone: the chin (bottom of the largest face) must sit at or
  // above y = 62% of the panel, so the title band never covers a face.
  if (face) {
    const chinY = (face.y + face.h) * imgH;
    const minSy = chinY - 0.62 * sh;
    if (sy < minSy) sy = minSy;
    // Keep the face horizontally inside the middle 80% of the panel.
    const faceCx = (face.x + face.w / 2) * imgW;
    const minSx = faceCx - 0.9 * sw;
    const maxSx = faceCx - 0.1 * sw;
    if (sx < minSx) sx = minSx;
    if (sx > maxSx) sx = maxSx;
  }
  sx = Math.max(0, Math.min(imgW - sw, sx));
  sy = Math.max(0, Math.min(imgH - sh, sy));
  return { sx, sy, sw, sh };
}

/**
 * Default assignment of loaded photos to panels (spec §assignment):
 * hero <- first photo with faces, else first photo; remaining photos fill
 * vignette panels in order; panels without a photo get demo art.
 * @param {Array<{id:string,img:HTMLImageElement,analysis:Object}>} photos
 * @param {Array<string>} panelOrder - panel ids in fill order (hero first)
 * @returns {Map<string,{photo:Object,zoom:number}>}
 */
export function assignPhotos(photos, panelOrder) {
  const assigned = new Map();
  if (photos.length === 0) return assigned;
  const withFaces = photos.find((p) => p.analysis && p.analysis.faces.length > 0);
  const heroPhoto = withFaces ?? photos[0];
  assigned.set(panelOrder[0], { photo: heroPhoto, zoom: 1 });
  const rest = photos.filter((p) => p !== heroPhoto);
  let i = 0;
  for (const panel of panelOrder.slice(1)) {
    if (i >= rest.length) break;
    assigned.set(panel, { photo: rest[i], zoom: 1 });
    i++;
  }
  return assigned;
}

/** Load an image file (File/Blob) into an <img>. */
export function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`cannot load ${file.name}`));
    };
    img.src = url;
  });
}

/** Load a same-origin image URL into an <img>. */
export function loadImageUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load ${url}`));
    img.src = url;
  });
}
