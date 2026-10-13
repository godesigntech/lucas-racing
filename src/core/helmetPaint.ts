/* Paints a HelmetDesign into UV canvases used by the 3D viewer and 2D exports. */
import type { HelmetDesign, Paint, TextLayer, LogoLayer, DrawLayer } from './types';
import { EYE, UV_H, UV_W, eyePortPath } from './uv';
import { cachedImage, loadImage, paintStyle } from './filmRender';
import { templateById } from '@/data/helmets';
import { fontCss } from './util';

export interface PaintOptions {
  watermark?: string | null;
  guides?: boolean;
  selectedZone?: string | null;
  selectedLayer?: string | null;
  scale?: number; // 1 = 2048x1024
}

export const CHROME = '#e3e7ec';
const FILM_SCALE = 1.5;

export function designImages(d: HelmetDesign): string[] {
  const srcs = [...d.logos.map((l) => l.src)];
  if (d.artwork) srcs.push(d.artwork.src);
  const pushPaint = (p: Paint) => { if (p.kind === 'custom-film') srcs.push(p.src); };
  pushPaint(d.basePaint);
  Object.values(d.zonePaints).forEach(pushPaint);
  d.drawing.forEach((l) => pushPaint(l.paint));
  return srcs;
}
export const preloadDesignImages = (d: HelmetDesign) => Promise.all(designImages(d).map(loadImage)).then(() => undefined);

function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** Fill a path on the colour canvas and mark it non-metallic on the PBR canvas. */
function fillBoth(ctx: CanvasRenderingContext2D, pbr: CanvasRenderingContext2D, path: Path2D, paint: Paint, rough: number, rule: CanvasFillRule = 'nonzero') {
  ctx.fillStyle = paintStyle(ctx, paint, FILM_SCALE);
  ctx.fill(path, rule);
  pbr.fillStyle = `rgb(0,${Math.round(rough * 255)},0)`;
  pbr.fill(path, rule);
}

function drawLayer(ctx: CanvasRenderingContext2D, pbr: CanvasRenderingContext2D, l: DrawLayer, rough: number) {
  const p = new Path2D();
  if (l.type === 'stroke') {
    if (l.points.length < 2) return;
    ctx.save(); pbr.save();
    for (const c of [ctx, pbr]) { c.lineWidth = l.width; c.lineCap = 'round'; c.lineJoin = 'round'; }
    p.moveTo(l.points[0][0], l.points[0][1]);
    for (let i = 1; i < l.points.length; i++) p.lineTo(l.points[i][0], l.points[i][1]);
    ctx.strokeStyle = paintStyle(ctx, l.paint, FILM_SCALE);
    ctx.stroke(p);
    pbr.strokeStyle = `rgb(0,${Math.round(rough * 255)},0)`;
    pbr.stroke(p);
    ctx.restore(); pbr.restore();
    return;
  }
  if (l.type === 'stripe') {
    const dx = l.x2 - l.x1, dy = l.y2 - l.y1, len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * (l.width / 2), ny = (dx / len) * (l.width / 2);
    p.moveTo(l.x1 + nx, l.y1 + ny); p.lineTo(l.x2 + nx, l.y2 + ny); p.lineTo(l.x2 - nx, l.y2 - ny); p.lineTo(l.x1 - nx, l.y1 - ny); p.closePath();
    fillBoth(ctx, pbr, p, l.paint, rough);
    return;
  }
  const m = new DOMMatrix().translate(l.x + l.w / 2, l.y + l.h / 2).rotate(l.rotation);
  const shape = new Path2D();
  if (l.type === 'rect') shape.rect(-l.w / 2, -l.h / 2, l.w, l.h);
  else shape.ellipse(0, 0, Math.abs(l.w / 2), Math.abs(l.h / 2), 0, 0, Math.PI * 2);
  p.addPath(shape, m);
  fillBoth(ctx, pbr, p, l.paint, rough);
}

function drawText(ctx: CanvasRenderingContext2D, pbr: CanvasRenderingContext2D, t: TextLayer, H: number, W: number, rough: number) {
  if (!t.text.trim()) return;
  const px = t.size * H;
  const spots = t.mirror ? [t.u, 1 - t.u] : [t.u];
  for (const u of spots) {
    for (const c of [ctx, pbr]) {
      c.save();
      c.translate(u * W, t.v * H);
      c.rotate(((u === t.u ? t.rotation : -t.rotation) * Math.PI) / 180);
      c.font = fontCss(t.font, px);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      if (c === ctx) {
        if (t.outline) { c.lineWidth = px * 0.12; c.strokeStyle = t.outline; c.lineJoin = 'round'; c.strokeText(t.text, 0, 0); }
        c.fillStyle = t.color;
      } else {
        c.lineWidth = px * 0.12;
        c.strokeStyle = c.fillStyle = `rgb(0,${Math.round(rough * 255)},0)`;
        if (t.outline) c.strokeText(t.text, 0, 0);
      }
      c.fillText(t.text, 0, 0);
      c.restore();
    }
  }
}

function drawLogo(ctx: CanvasRenderingContext2D, pbr: CanvasRenderingContext2D, l: LogoLayer, H: number, W: number, rough: number) {
  const img = cachedImage(l.src);
  if (!img) { void loadImage(l.src); return; }
  const h = l.size * H;
  const w = (img.naturalWidth / Math.max(1, img.naturalHeight)) * h;
  const spots = l.mirror ? [l.u, 1 - l.u] : [l.u];
  for (const u of spots) {
    ctx.save();
    ctx.translate(u * W, l.v * H);
    ctx.rotate(((u === l.u ? l.rotation : -l.rotation) * Math.PI) / 180);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
    pbr.save();
    pbr.translate(u * W, l.v * H);
    pbr.fillStyle = `rgb(0,${Math.round(rough * 255)},0)`;
    pbr.fillRect(-w / 2, -h / 2, w, h);
    pbr.restore();
  }
}

export function drawWatermark(ctx: CanvasRenderingContext2D, w: number, h: number, text: string, alpha = 0.22) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = Math.max(1, h * 0.002);
  const fs = Math.max(14, h * 0.045);
  ctx.font = `800 ${fs}px 'Barlow Condensed', Arial, sans-serif`;
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-0.4);
  const step = fs * 3.2;
  for (let y = -h; y < h; y += step) {
    for (let x = -w; x < w; x += ctx.measureText(text).width + fs * 2) {
      ctx.strokeText(text, x + ((y / step) % 2) * fs * 3, y);
      ctx.fillText(text, x + ((y / step) % 2) * fs * 3, y);
    }
  }
  ctx.restore();
}

/**
 * Paint a design. Returns:
 *  - color: albedo texture (UV space)
 *  - pbr:   G = roughness, B = metalness (three.js convention)
 */
export function paintHelmet(d: HelmetDesign, opts: PaintOptions = {}) {
  const s = opts.scale ?? 1;
  const W = Math.round(UV_W * s), H = Math.round(UV_H * s);
  const color = makeCanvas(W, H), pbrC = makeCanvas(W, H);
  const ctx = color.getContext('2d')!, pbr = pbrC.getContext('2d')!;
  ctx.scale(s, s); pbr.scale(s, s);
  const rough = d.finish === 'satin' ? 0.55 : 0.2;

  // Base
  if (d.chrome) {
    ctx.fillStyle = CHROME;
    ctx.fillRect(0, 0, UV_W, UV_H);
    if (d.basePaint.kind === 'solid' && !/^#(f5f5f2|ffffff|a6abb3)$/i.test(d.basePaint.color)) {
      // Candy tint over chrome.
      ctx.globalAlpha = 0.55; ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = d.basePaint.color; ctx.fillRect(0, 0, UV_W, UV_H);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    pbr.fillStyle = `rgb(0,${Math.round(0.06 * 255)},255)`;
    pbr.fillRect(0, 0, UV_W, UV_H);
    if (d.basePaint.kind !== 'solid') fillBoth(ctx, pbr, rectPath(), d.basePaint, rough);
  } else {
    fillBoth(ctx, pbr, rectPath(), d.basePaint, rough);
  }

  // Template zones
  const tpl = templateById(d.templateId);
  if (tpl && (d.source === 'template' || d.source === 'ai')) {
    for (const z of tpl.zones) {
      const p = d.zonePaints[z.id];
      if (p) fillBoth(ctx, pbr, new Path2D(z.path), p, rough);
    }
  }

  // Freehand / shapes
  d.drawing.forEach((l) => drawLayer(ctx, pbr, l, rough));

  // Complete uploaded artwork wraps the whole shell.
  if (d.artwork) {
    const img = cachedImage(d.artwork.src);
    if (img) {
      ctx.drawImage(img, 0, 0, UV_W, UV_H);
      pbr.fillStyle = `rgb(0,${Math.round(rough * 255)},0)`;
      pbr.fillRect(0, 0, UV_W, UV_H);
    } else void loadImage(d.artwork.src);
  }

  d.texts.forEach((t) => drawText(ctx, pbr, t, UV_H, UV_W, rough));
  d.logos.forEach((l) => drawLogo(ctx, pbr, l, UV_H, UV_W, rough));

  // Eye port opening + eye-port rubber
  const eye = new Path2D(eyePortPath(0));
  ctx.fillStyle = '#050606';
  ctx.fill(eye);
  ctx.lineWidth = 26;
  ctx.strokeStyle = d.trims.eyeRubber;
  ctx.stroke(eye);
  pbr.fillStyle = `rgb(0,${Math.round(0.6 * 255)},0)`;
  pbr.fill(eye);
  pbr.lineWidth = 26; pbr.strokeStyle = pbr.fillStyle; pbr.stroke(eye);

  // Base rubber band at the rim
  ctx.fillStyle = d.trims.baseRubber;
  ctx.fillRect(0, UV_H - 22, UV_W, 22);
  pbr.fillStyle = `rgb(0,${Math.round(0.7 * 255)},0)`;
  pbr.fillRect(0, UV_H - 22, UV_W, 22);

  if (opts.guides && tpl && d.source === 'template') {
    ctx.save();
    for (const z of tpl.zones) {
      const sel = opts.selectedZone === z.id;
      ctx.setLineDash(sel ? [] : [14, 10]);
      ctx.lineWidth = sel ? 8 : 3;
      ctx.strokeStyle = sel ? '#c8f031' : 'rgba(0,0,0,.45)';
      ctx.stroke(new Path2D(z.path));
    }
    ctx.restore();
  }

  if (opts.watermark) drawWatermark(ctx, UV_W, UV_H, opts.watermark, 0.28);
  return { color, pbr: pbrC };
}

const rectPath = () => { const p = new Path2D(); p.rect(-2, -2, UV_W + 4, UV_H + 4); return p; };

/** Flat concept UV layout with side labels: used for 2D editing and production concept exports. */
export function renderUVLayout(d: HelmetDesign, opts: PaintOptions & { labels?: boolean } = {}): HTMLCanvasElement {
  const { color } = paintHelmet(d, opts);
  if (!opts.labels) return color;
  const out = makeCanvas(color.width, color.height + 60);
  const c = out.getContext('2d')!;
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, out.width, out.height);
  c.drawImage(color, 0, 0);
  c.fillStyle = '#121412';
  c.font = `700 ${28 * (opts.scale ?? 1)}px Inter, Arial`;
  c.textAlign = 'center';
  const s = opts.scale ?? 1;
  [['REAR', 0.02], ['LEFT', 0.25], ['FRONT / FACE', 0.5], ['RIGHT', 0.75], ['REAR', 0.98]].forEach(([t, u]) => c.fillText(String(t), Number(u) * out.width, color.height + 40 * s));
  c.strokeStyle = 'rgba(0,0,0,.3)';
  c.setLineDash([8, 8]);
  c.strokeRect(EYE.x0 * s, EYE.y0 * s, (EYE.x1 - EYE.x0) * s, (EYE.y1 - EYE.y0) * s);
  return out;
}
