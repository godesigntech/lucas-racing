/* 2D renderer for kart sticker panels. Used by the configurator, proofs and production. */
import type { KartDesign, KartLayer, KartPanelDesign, PanelId } from './types';
import { bodyworkById, PANELS } from '@/data/kart';
import { cachedImage, loadImage } from './filmRender';
import { fontCss } from './util';
import { drawWatermark } from './helmetPaint';

export interface PanelRenderOpts {
  guides?: boolean;
  selectedLayer?: string | null;
  holographic?: boolean;
  /** Draw the cut line outside the shape (proof style). */
  cutLine?: boolean;
}

function layerPath(l: KartLayer): Path2D | null {
  const p = new Path2D();
  if (l.type === 'path') {
    if (l.points.length < 2) return null;
    p.moveTo(l.points[0][0], l.points[0][1]);
    l.points.slice(1).forEach(([x, y]) => p.lineTo(x, y));
    return p;
  }
  if (l.type === 'text' || l.type === 'image') return null;
  const m = new DOMMatrix().translate(l.x, l.y).rotate(l.rotation);
  const s = new Path2D();
  const w = l.w / 2, h = l.h / 2;
  if (l.type === 'rect' || l.type === 'stripe') s.rect(-w, -h, l.w, l.h);
  else if (l.type === 'ellipse') s.ellipse(0, 0, Math.abs(w), Math.abs(h), 0, 0, Math.PI * 2);
  else if (l.type === 'triangle') { s.moveTo(-w, h); s.lineTo(0, -h); s.lineTo(w, h); s.closePath(); }
  p.addPath(s, m);
  return p;
}

/** Bounding box of a layer (panel units) for selection handles. */
export function layerBounds(ctx: CanvasRenderingContext2D, l: KartLayer): { x: number; y: number; w: number; h: number } {
  if (l.type === 'path') {
    const xs = l.points.map((p) => p[0]), ys = l.points.map((p) => p[1]);
    return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  }
  if (l.type === 'text') {
    ctx.save();
    ctx.font = fontCss(l.font, l.size);
    const w = ctx.measureText(l.text).width;
    ctx.restore();
    return { x: l.x - w / 2, y: l.y - l.size / 2, w, h: l.size };
  }
  return { x: l.x - Math.abs(l.w) / 2, y: l.y - Math.abs(l.h) / 2, w: Math.abs(l.w), h: Math.abs(l.h) };
}

export function drawKartLayer(ctx: CanvasRenderingContext2D, l: KartLayer) {
  if (l.type === 'text') {
    ctx.save();
    ctx.translate(l.x, l.y);
    ctx.rotate((l.rotation * Math.PI) / 180);
    ctx.font = fontCss(l.font, l.size);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (l.outline) { ctx.lineWidth = l.size * 0.12; ctx.strokeStyle = l.outline; ctx.lineJoin = 'round'; ctx.strokeText(l.text, 0, 0); }
    ctx.fillStyle = l.color;
    ctx.fillText(l.text, 0, 0);
    ctx.restore();
    return;
  }
  if (l.type === 'image') {
    const img = cachedImage(l.src);
    if (!img) { void loadImage(l.src); return; }
    ctx.save();
    ctx.translate(l.x, l.y);
    ctx.rotate((l.rotation * Math.PI) / 180);
    ctx.drawImage(img, -l.w / 2, -l.h / 2, l.w, l.h);
    ctx.restore();
    return;
  }
  const p = layerPath(l);
  if (!p) return;
  if (l.type === 'path') {
    ctx.save();
    ctx.lineWidth = l.width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = l.color;
    ctx.stroke(p);
    ctx.restore();
  } else {
    ctx.fillStyle = l.color;
    ctx.fill(p);
  }
}

/** Holographic look for previews only (real holographic underprint handling TBC). */
function holoSheen(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  const g = ctx.createLinearGradient(0, 0, w, h);
  ['#ff6ad5', '#c774e8', '#94d0ff', '#8affc1', '#fff39e', '#ff6ad5'].forEach((c, i, a) => g.addColorStop(i / (a.length - 1), c));
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Draw one panel into ctx (already scaled to panel units). */
export function drawPanel(ctx: CanvasRenderingContext2D, design: KartDesign, panel: PanelId, opts: PanelRenderOpts = {}) {
  const bw = bodyworkById(design.bodyworkId);
  const o = bw.outlines[panel];
  const pd: KartPanelDesign = design.panels[panel];
  const clip = new Path2D(o.path);
  ctx.save();
  ctx.clip(clip);
  ctx.fillStyle = pd.background;
  ctx.fillRect(0, 0, o.w, o.h);
  const up = design.uploads[panel];
  if (up) {
    const img = cachedImage(up.src);
    if (img) ctx.drawImage(img, 0, 0, o.w, o.h);
    else void loadImage(up.src);
  }
  pd.layers.forEach((l) => drawKartLayer(ctx, l));
  if (opts.holographic) holoSheen(ctx, o.w, o.h);
  ctx.restore();
  ctx.save();
  ctx.lineWidth = opts.cutLine ? 3 : 4;
  ctx.setLineDash(opts.cutLine ? [12, 8] : []);
  ctx.strokeStyle = opts.cutLine ? '#e3262b' : 'rgba(18,20,18,.55)';
  ctx.stroke(clip);
  ctx.restore();
  if (opts.guides && opts.selectedLayer) {
    const l = pd.layers.find((x) => x.id === opts.selectedLayer);
    if (l) {
      const b = layerBounds(ctx, l);
      ctx.save();
      ctx.strokeStyle = '#7aa30f';
      ctx.setLineDash([10, 6]);
      ctx.lineWidth = 3;
      ctx.strokeRect(b.x - 6, b.y - 6, b.w + 12, b.h + 12);
      ctx.restore();
    }
  }
}

export function preloadKartImages(d: KartDesign) {
  const srcs: string[] = [];
  Object.values(d.panels).forEach((p) => p.layers.forEach((l) => l.type === 'image' && srcs.push(l.src)));
  Object.values(d.uploads).forEach((u) => u && srcs.push(u.src));
  return Promise.all(srcs.map(loadImage)).then(() => undefined);
}

/** Single panel to a canvas of the given pixel width. */
export function renderPanelCanvas(design: KartDesign, panel: PanelId, widthPx: number, opts: PanelRenderOpts = {}) {
  const o = bodyworkById(design.bodyworkId).outlines[panel];
  const s = widthPx / o.w;
  const c = document.createElement('canvas');
  c.width = Math.round(o.w * s);
  c.height = Math.round(o.h * s);
  const ctx = c.getContext('2d')!;
  ctx.scale(s, s);
  drawPanel(ctx, design, panel, opts);
  return c;
}

/**
 * Complete-kit sheet: all four panels with labels. Used for clean digital proofs,
 * customer previews and concept production exports. NOT dimensionally accurate.
 */
export function renderKitSheet(design: KartDesign, opts: PanelRenderOpts & { watermark?: string | null; title?: string; width?: number } = {}) {
  const W = opts.width ?? 1600;
  const pad = W * 0.03;
  const colW = (W - pad * 3) / 2;
  const sc = colW / 1000;
  const rows: [PanelId, PanelId][] = [['leftPod', 'rightPod'], ['frontBumper', 'nassau']];
  const rowH = [340 * sc, Math.max(300 * sc, 520 * sc * 0.62)];
  const head = W * 0.06;
  const H = head + pad * 4 + rowH[0] + rowH[1] + 40;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = Math.round(H);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#121412';
  ctx.font = `800 ${W * 0.026}px 'Barlow Condensed', Arial`;
  ctx.fillText(opts.title || design.name, pad, head * 0.7);
  ctx.font = `500 ${W * 0.011}px Inter, Arial`;
  ctx.fillStyle = '#6b706b';
  ctx.fillText(`${bodyworkById(design.bodyworkId).name} · Illustrative outlines, not to scale`, pad, head * 0.7 + W * 0.018);
  let y = head + pad;
  rows.forEach((row, ri) => {
    row.forEach((pid, ci) => {
      const o = bodyworkById(design.bodyworkId).outlines[pid];
      const s = pid === 'nassau' ? (rowH[1] / o.h) : sc;
      const x = pad + ci * (colW + pad) + (pid === 'nassau' ? (colW - o.w * s) / 2 : 0);
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s, s);
      drawPanel(ctx, design, pid, opts);
      ctx.restore();
      ctx.fillStyle = '#121412';
      ctx.font = `700 ${W * 0.011}px Inter, Arial`;
      ctx.fillText(PANELS.find((p) => p.id === pid)!.name.toUpperCase(), pad + ci * (colW + pad), y + rowH[ri] + W * 0.016);
    });
    y += rowH[ri] + pad;
  });
  if (opts.watermark) drawWatermark(ctx, W, H, opts.watermark, 0.2);
  return c;
}
