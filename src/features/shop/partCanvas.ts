/* PROPOSED 2D parts customiser renderer.
   Draws a product illustration (PartCustomSpec.art, 400x260 viewBox) on a canvas and limits
   customisation (colour, film effect, text, artwork) to PartCustomSpec.mask.
   The art markup is parsed into Path2D objects so rendering is synchronous and the canvas is
   never tainted (thumbnails can always be exported). Illustrative only: no 3D model needed. */
import type { FontId, PartCustomSpec, PartCustomisation } from '@/core/types';
import { filmTile } from '@/core/filmRender';
import { fontCss } from '@/core/util';
import { filmById } from '@/data/films';

export const VB_W = 400;
export const VB_H = 260;

export interface Box { x: number; y: number; w: number; h: number }

/** Editor-only placement of text and artwork, in viewBox units. */
export interface PartLayout {
  textX: number;
  textY: number;
  textSize: number;
  textFont: FontId;
  artX: number;
  artY: number;
  /** Artwork width in viewBox units. */
  artSize: number;
}

/* ------------------------------------------------------------------ */
/* Art parsing                                                         */
/* ------------------------------------------------------------------ */

interface ArtEl {
  path: Path2D;
  fill: string | null;
  fillRule: CanvasFillRule;
  stroke: string | null;
  strokeWidth: number;
  lineCap: CanvasLineCap;
  opacity: number;
}

const num = (el: Element, a: string, d = 0) => {
  const v = parseFloat(el.getAttribute(a) || '');
  return Number.isFinite(v) ? v : d;
};

function roundRectPath(x: number, y: number, w: number, h: number, r: number): Path2D {
  const p = new Path2D();
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  p.moveTo(x + r, y);
  p.lineTo(x + w - r, y);
  p.arcTo(x + w, y, x + w, y + r, r);
  p.lineTo(x + w, y + h - r);
  p.arcTo(x + w, y + h, x + w - r, y + h, r);
  p.lineTo(x + r, y + h);
  p.arcTo(x, y + h, x, y + h - r, r);
  p.lineTo(x, y + r);
  p.arcTo(x, y, x + r, y, r);
  p.closePath();
  return p;
}

const artCache = new Map<string, ArtEl[]>();

/** Parse the limited SVG vocabulary used by product illustrations (path, rect, circle, ellipse, line). */
export function parseArt(markup: string): ArtEl[] {
  const hit = artCache.get(markup);
  if (hit) return hit;
  const out: ArtEl[] = [];
  try {
    const doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`, 'image/svg+xml');
    const walk = (parent: Element) => {
      for (const el of Array.from(parent.children)) {
        const tag = el.tagName.toLowerCase();
        let path: Path2D | null = null;
        if (tag === 'g') { walk(el); continue; }
        if (tag === 'path') path = new Path2D(el.getAttribute('d') || '');
        else if (tag === 'rect') path = roundRectPath(num(el, 'x'), num(el, 'y'), num(el, 'width'), num(el, 'height'), num(el, 'rx', num(el, 'ry')));
        else if (tag === 'circle') { path = new Path2D(); path.arc(num(el, 'cx'), num(el, 'cy'), num(el, 'r'), 0, Math.PI * 2); }
        else if (tag === 'ellipse') { path = new Path2D(); path.ellipse(num(el, 'cx'), num(el, 'cy'), num(el, 'rx'), num(el, 'ry'), 0, 0, Math.PI * 2); }
        else if (tag === 'line') { path = new Path2D(); path.moveTo(num(el, 'x1'), num(el, 'y1')); path.lineTo(num(el, 'x2'), num(el, 'y2')); }
        if (!path) continue;
        const fill = el.getAttribute('fill');
        const stroke = el.getAttribute('stroke');
        out.push({
          path,
          // SVG default fill is black; "none" disables it.
          fill: fill === 'none' ? null : fill || (tag === 'line' ? null : '#000000'),
          fillRule: el.getAttribute('fill-rule') === 'evenodd' ? 'evenodd' : 'nonzero',
          stroke: stroke && stroke !== 'none' ? stroke : null,
          strokeWidth: num(el, 'stroke-width', 1),
          lineCap: (el.getAttribute('stroke-linecap') as CanvasLineCap) || 'butt',
          opacity: num(el, 'opacity', 1),
        });
      }
    };
    walk(doc.documentElement);
  } catch { /* unparseable art: render nothing */ }
  artCache.set(markup, out);
  return out;
}

/** "Ink" fills (near-black detail: bolts, hubs, caps) are redrawn above the customisation. */
function isInk(color: string) {
  const m = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return color === 'black' || color === '#000';
  const n = parseInt(m[1], 16);
  return Math.max((n >> 16) & 255, (n >> 8) & 255, n & 255) < 34;
}

function drawArt(ctx: CanvasRenderingContext2D, els: ArtEl[], mode: 'base' | 'ink') {
  for (const el of els) {
    ctx.save();
    ctx.globalAlpha = el.opacity;
    if (el.fill && (mode === 'base' || isInk(el.fill))) {
      ctx.fillStyle = el.fill;
      ctx.fill(el.path, el.fillRule);
    }
    if (el.stroke) {
      ctx.strokeStyle = el.stroke;
      ctx.lineWidth = el.strokeWidth;
      ctx.lineCap = el.lineCap;
      ctx.lineJoin = 'round';
      ctx.stroke(el.path);
    }
    ctx.restore();
  }
}

/* ------------------------------------------------------------------ */
/* Mask geometry                                                       */
/* ------------------------------------------------------------------ */

const maskCache = new Map<string, { path: Path2D; bbox: Box; center: [number, number] }>();

/** Path2D, bounding box and a safe interior point for a mask (sampled with isPointInPath). */
export function maskInfo(mask: string) {
  const hit = maskCache.get(mask);
  if (hit) return hit;
  const path = new Path2D(mask);
  const cv = document.createElement('canvas');
  cv.width = VB_W; cv.height = VB_H;
  const ctx = cv.getContext('2d')!;
  const pts: [number, number][] = [];
  for (let y = 2; y < VB_H; y += 4) for (let x = 2; x < VB_W; x += 4) if (ctx.isPointInPath(path, x, y, 'evenodd')) pts.push([x, y]);
  let bbox: Box = { x: 0, y: 0, w: VB_W, h: VB_H };
  let center: [number, number] = [VB_W / 2, VB_H / 2];
  if (pts.length) {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    bbox = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    if (ctx.isPointInPath(path, cx, cy, 'evenodd')) center = [cx, cy];
    else {
      // e.g. a steering-wheel ring: pick the interior point nearest the top centre.
      let best = pts[0], bd = Infinity;
      for (const p of pts) { const d = (p[0] - cx) ** 2 + (p[1] - y0 - 18) ** 2; if (d < bd) { bd = d; best = p; } }
      center = best;
    }
  }
  const info = { path, bbox, center };
  maskCache.set(mask, info);
  return info;
}

export function defaultLayout(spec: PartCustomSpec): PartLayout {
  const { bbox, center } = maskInfo(spec.mask);
  const tray = spec.kind === 'tray-sticker';
  return {
    textX: center[0],
    textY: tray ? center[1] + bbox.h * 0.18 : center[1],
    textSize: Math.round(tray ? Math.min(48, Math.max(20, bbox.h * 0.3)) : Math.min(36, Math.max(16, bbox.h * 0.14))),
    textFont: 'barlow',
    artX: center[0],
    artY: tray ? center[1] - bbox.h * 0.14 : center[1],
    artSize: Math.round(Math.min(bbox.w, bbox.h) * 0.55),
  };
}

export const defaultCustomisation = (spec: PartCustomSpec): PartCustomisation => ({
  effect: null,
  color: spec.colors[0] || '#121412',
  text: '',
  textColor: spec.colors.find((c) => c.toLowerCase() !== (spec.colors[0] || '').toLowerCase()) || '#f5f5f2',
  artwork: null,
});

/* ------------------------------------------------------------------ */
/* Render                                                              */
/* ------------------------------------------------------------------ */

export interface RenderInput {
  spec: PartCustomSpec;
  custom: PartCustomisation | null;
  layout: PartLayout;
  artwork: HTMLImageElement | null;
  selected?: 'text' | 'art' | null;
}

/** Render onto ctx (canvas sized VB_W*scale x VB_H*scale). Returns hit boxes in viewBox units. */
export function renderPart(ctx: CanvasRenderingContext2D, scale: number, input: RenderInput): { text: Box | null; art: Box | null } {
  const { spec, custom, layout, artwork, selected } = input;
  const els = parseArt(spec.art);
  const { path: mask } = maskInfo(spec.mask);
  const tray = spec.kind === 'tray-sticker';
  const boxes: { text: Box | null; art: Box | null } = { text: null, art: null };

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  drawArt(ctx, els, 'base');
  if (!custom) return boxes;

  // Sticker: soft shadow so it reads as a printed decal laid on the tray floor.
  if (tray) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.45)';
    ctx.shadowBlur = 8 * scale;
    ctx.shadowOffsetY = 2 * scale;
    ctx.fillStyle = custom.color;
    ctx.fill(mask, 'evenodd');
    ctx.restore();
  }

  ctx.save();
  ctx.clip(mask, 'evenodd');

  // Base: colour or tinted film effect (carbon + blue = blue carbon).
  const film = custom.effect ? filmById(custom.effect) : null;
  if (film) {
    const pat = ctx.createPattern(filmTile(film, custom.color), 'repeat');
    if (pat) {
      pat.setTransform(new DOMMatrix().scale(0.42));
      ctx.fillStyle = pat;
    } else ctx.fillStyle = custom.color;
  } else ctx.fillStyle = custom.color;
  ctx.fillRect(0, 0, VB_W, VB_H);

  // Artwork (positioned inside the mask; anything outside is clipped).
  if (custom.artwork && artwork && artwork.naturalWidth) {
    const w = layout.artSize;
    const h = w * (artwork.naturalHeight / artwork.naturalWidth);
    const b = { x: layout.artX - w / 2, y: layout.artY - h / 2, w, h };
    ctx.drawImage(artwork, b.x, b.y, b.w, b.h);
    boxes.art = b;
  }

  // Text.
  if (custom.text.trim() && spec.allowText) {
    ctx.font = fontCss(layout.textFont, layout.textSize);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const t = custom.text.trim();
    const w = ctx.measureText(t).width;
    if (tray) {
      ctx.lineWidth = Math.max(2, layout.textSize * 0.08);
      ctx.strokeStyle = 'rgba(0,0,0,.35)';
      ctx.lineJoin = 'round';
      ctx.strokeText(t, layout.textX, layout.textY + 1.5);
    }
    ctx.fillStyle = custom.textColor;
    ctx.fillText(t, layout.textX, layout.textY);
    boxes.text = { x: layout.textX - w / 2, y: layout.textY - layout.textSize * 0.55, w, h: layout.textSize * 1.1 };
  }

  // Lighting so the surface reads as moulded plastic / a glossy sticker.
  if (tray) {
    const g = ctx.createLinearGradient(0, 40, VB_W, 220);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.42, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,.16)');
    g.addColorStop(0.58, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VB_W, VB_H);
    // White printed border + cut line.
    ctx.strokeStyle = '#fbfaf6';
    ctx.lineWidth = 9;
    ctx.stroke(mask);
    ctx.strokeStyle = 'rgba(0,0,0,.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.stroke(mask);
    ctx.setLineDash([]);
  } else {
    const g = ctx.createLinearGradient(0, 20, 0, 240);
    g.addColorStop(0, 'rgba(255,255,255,.22)');
    g.addColorStop(0.45, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(0,0,0,.26)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VB_W, VB_H);
  }
  ctx.restore();

  // Redraw outline + ink detail so the product still reads correctly.
  drawArt(ctx, els, 'ink');

  // Selection outline (editor only).
  const sel = selected === 'text' ? boxes.text : selected === 'art' ? boxes.art : null;
  if (sel) {
    ctx.save();
    ctx.strokeStyle = '#c8f031';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(sel.x - 4, sel.y - 4, sel.w + 8, sel.h + 8);
    ctx.restore();
  }
  return boxes;
}

/** Small PNG thumbnail of a customised part (for the basket line). */
export function partThumb(input: RenderInput, width = 200): string | undefined {
  try {
    const scale = width / VB_W;
    const cv = document.createElement('canvas');
    cv.width = Math.round(VB_W * scale);
    cv.height = Math.round(VB_H * scale);
    renderPart(cv.getContext('2d')!, scale, { ...input, selected: null });
    return cv.toDataURL('image/png');
  } catch {
    return undefined;
  }
}

export const inBox = (b: Box | null, x: number, y: number, pad = 6) =>
  !!b && x >= b.x - pad && x <= b.x + b.w + pad && y >= b.y - pad && y <= b.y + b.h + pad;
