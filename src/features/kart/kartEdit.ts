/* Pure editing helpers for kart sticker designs (panel units, each panel in its own box). */
import type { FontId, KartDesign, KartLayer, KartPanelDesign, PanelId } from '@/core/types';
import { clone, fontCss, uid } from '@/core/util';
import { luminance } from '@/core/color';
import { PANEL_BOX, PANELS } from '@/data/kart';

export type DesignUpdater = (d: KartDesign) => KartDesign;

export const NAME_LAYER = 'Driver name';
export const NUMBER_LAYER = 'Race number';

export const LAYER_TYPE_LABEL: Record<KartLayer['type'], string> = {
  rect: 'Rectangle', ellipse: 'Ellipse', triangle: 'Chevron', stripe: 'Stripe', text: 'Text', image: 'Logo / image', path: 'Freehand',
};
export const LAYER_TYPE_ICON: Record<KartLayer['type'], string> = {
  rect: 'shape', ellipse: 'shape', triangle: 'shape', stripe: 'shape', text: 'text', image: 'image', path: 'brush',
};

export const layerLabel = (l: KartLayer) =>
  l.type === 'text' ? (l.name && l.name !== 'Text' ? `${l.name}: ${l.text}` : `Text: ${l.text}`) : l.name || LAYER_TYPE_LABEL[l.type];

export const layerColor = (l: KartLayer): string | null => (l.type === 'image' ? null : l.color);

/* ---------------- immutable updates ---------------- */
export const mapPanel = (d: KartDesign, panel: PanelId, fn: (p: KartPanelDesign) => KartPanelDesign): KartDesign => ({
  ...d, panels: { ...d.panels, [panel]: fn(d.panels[panel]) },
});

export const mapLayer = (d: KartDesign, panel: PanelId, id: string, fn: (l: KartLayer) => KartLayer): KartDesign =>
  mapPanel(d, panel, (p) => ({ ...p, layers: p.layers.map((l) => (l.id === id ? fn(l) : l)) }));

export const addLayer = (d: KartDesign, panel: PanelId, l: KartLayer): KartDesign =>
  mapPanel(d, panel, (p) => ({ ...p, layers: [...p.layers, l] }));

export const removeLayer = (d: KartDesign, panel: PanelId, id: string): KartDesign =>
  mapPanel(d, panel, (p) => ({ ...p, layers: p.layers.filter((l) => l.id !== id) }));

export function reorderLayer(d: KartDesign, panel: PanelId, id: string, dir: 1 | -1 | 'top' | 'bottom'): KartDesign {
  return mapPanel(d, panel, (p) => {
    const i = p.layers.findIndex((l) => l.id === id);
    if (i < 0) return p;
    const layers = [...p.layers];
    const [l] = layers.splice(i, 1);
    const to = dir === 'top' ? layers.length : dir === 'bottom' ? 0 : Math.max(0, Math.min(layers.length, i + dir));
    layers.splice(to, 0, l);
    return { ...p, layers };
  });
}

export function duplicateLayer(d: KartDesign, panel: PanelId, id: string, newId: string): KartDesign {
  const src = d.panels[panel].layers.find((l) => l.id === id);
  if (!src) return d;
  const keepName = src.name && src.name !== NAME_LAYER && src.name !== NUMBER_LAYER;
  const copy = moveLayerBy({ ...clone(src), id: newId, name: keepName ? src.name : LAYER_TYPE_LABEL[src.type] }, 30, 24);
  return mapPanel(d, panel, (p) => {
    const i = p.layers.findIndex((l) => l.id === id);
    const layers = [...p.layers];
    layers.splice(i + 1, 0, copy);
    return { ...p, layers };
  });
}

/* ---------------- geometry ---------------- */
export function moveLayerBy(l: KartLayer, dx: number, dy: number): KartLayer {
  if (l.type === 'path') return { ...l, points: l.points.map(([x, y]) => [x + dx, y + dy] as [number, number]) };
  return { ...l, x: l.x + dx, y: l.y + dy };
}

let measureCtx: CanvasRenderingContext2D | null = null;
function mctx() {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d')!;
  return measureCtx;
}

/** Local (unrotated) box of a layer centred on its anchor, plus its rotation. */
export function layerFrame(l: KartLayer): { cx: number; cy: number; w: number; h: number; rotation: number } {
  if (l.type === 'path') {
    const xs = l.points.map((p) => p[0]), ys = l.points.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const pad = l.width / 2;
    return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2, rotation: 0 };
  }
  if (l.type === 'text') {
    const c = mctx();
    c.font = fontCss(l.font, l.size);
    const w = Math.max(c.measureText(l.text || ' ').width, l.size * 0.4);
    return { cx: l.x, cy: l.y, w, h: l.size, rotation: l.rotation };
  }
  return { cx: l.x, cy: l.y, w: Math.abs(l.w), h: Math.abs(l.h), rotation: l.rotation };
}

/** Point → layer-local coordinates (origin at the layer centre, unrotated). */
export function toLocal(l: KartLayer, x: number, y: number) {
  const f = layerFrame(l);
  const a = (-f.rotation * Math.PI) / 180;
  const dx = x - f.cx, dy = y - f.cy;
  return { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a), f };
}

export function localToWorld(f: { cx: number; cy: number; rotation: number }, lx: number, ly: number): [number, number] {
  const a = (f.rotation * Math.PI) / 180;
  return [f.cx + lx * Math.cos(a) - ly * Math.sin(a), f.cy + lx * Math.sin(a) + ly * Math.cos(a)];
}

function distToSegment(px: number, py: number, a: [number, number], b: [number, number]) {
  const vx = b[0] - a[0], vy = b[1] - a[1];
  const len = vx * vx + vy * vy;
  const t = len ? Math.max(0, Math.min(1, ((px - a[0]) * vx + (py - a[1]) * vy) / len)) : 0;
  return Math.hypot(px - (a[0] + t * vx), py - (a[1] + t * vy));
}

/** Top-most layer under a point (panel units). */
export function hitTest(p: KartPanelDesign, x: number, y: number, tol = 8): string | null {
  for (let i = p.layers.length - 1; i >= 0; i--) {
    const l = p.layers[i];
    if (l.type === 'path') {
      for (let k = 1; k < l.points.length; k++) if (distToSegment(x, y, l.points[k - 1], l.points[k]) <= l.width / 2 + tol) return l.id;
      continue;
    }
    const { x: lx, y: ly, f } = toLocal(l, x, y);
    const hw = f.w / 2 + tol, hh = f.h / 2 + tol;
    if (Math.abs(lx) > hw || Math.abs(ly) > hh) continue;
    if (l.type === 'ellipse') { if ((lx * lx) / (hw * hw) + (ly * ly) / (hh * hh) <= 1) return l.id; continue; }
    if (l.type === 'triangle') {
      // apex at (0,-h/2), base at y=+h/2: half-width grows linearly with y
      const t = (ly + f.h / 2) / Math.max(f.h, 1);
      if (Math.abs(lx) <= (t * f.w) / 2 + tol) return l.id;
      continue;
    }
    return l.id;
  }
  return null;
}

/** Scale a layer about its centre from an original snapshot. */
export function scaleLayer(orig: KartLayer, fx: number, fy = fx): KartLayer {
  const min = 6;
  if (orig.type === 'text') return { ...orig, size: Math.max(min, Math.round(orig.size * fx)) };
  if (orig.type === 'path') {
    const f = layerFrame(orig);
    return { ...orig, points: orig.points.map(([x, y]) => [f.cx + (x - f.cx) * fx, f.cy + (y - f.cy) * fx] as [number, number]) };
  }
  return { ...orig, w: Math.max(min, Math.round(orig.w * fx)), h: Math.max(min, Math.round(orig.h * fy)) };
}

/* ---------------- factories ---------------- */
export function contrastOn(bg: string, a = '#121412', b = '#f5f5f2') {
  try { return luminance(bg) > 0.55 ? a : b; } catch { return a; }
}

export function newShape(type: 'rect' | 'ellipse' | 'triangle' | 'stripe', panel: PanelId, color: string): KartLayer {
  const box = PANEL_BOX[panel];
  const cx = box.w / 2, cy = box.h / 2;
  const s = Math.min(box.w, box.h);
  const dims: Record<typeof type, [number, number, number]> = {
    rect: [s * 0.45, s * 0.3, 0],
    ellipse: [s * 0.4, s * 0.4, 0],
    triangle: [s * 0.5, s * 0.35, 90],
    stripe: [box.w * 0.9, s * 0.08, 0],
  };
  const [w, h, rotation] = dims[type];
  return { id: uid('l'), type, x: cx, y: cy, w: Math.round(w), h: Math.round(h), rotation, color, name: LAYER_TYPE_LABEL[type] };
}

export function newText(panel: PanelId, text: string, color: string, font: FontId = 'barlow', name = 'Text'): KartLayer {
  const box = PANEL_BOX[panel];
  return { id: uid('l'), type: 'text', x: box.w / 2, y: box.h / 2, text, font, size: Math.round(Math.min(box.w, box.h) * 0.2), rotation: 0, color, outline: null, name };
}

export function newImage(panel: PanelId, src: string, aspect: number, name: string): KartLayer {
  const box = PANEL_BOX[panel];
  const maxW = box.w * 0.4, maxH = box.h * 0.5;
  let w = maxW, h = w / (aspect || 1);
  if (h > maxH) { h = maxH; w = h * (aspect || 1); }
  return { id: uid('l'), type: 'image', x: box.w / 2, y: box.h / 2, w: Math.round(w), h: Math.round(h), rotation: 0, src, name: name.replace(/\.[a-z0-9]+$/i, '').slice(0, 28) || 'Logo' };
}

export function imageAspect(src: string): Promise<number> {
  return new Promise((res) => {
    const i = new Image();
    i.onload = () => res(i.naturalWidth && i.naturalHeight ? i.naturalWidth / i.naturalHeight : 1);
    i.onerror = () => res(1);
    i.src = src;
  });
}

/* ---------------- mirror left pod → right pod ---------------- */
export function mirrorLayer(l: KartLayer, W: number): KartLayer {
  const id = uid('l');
  if (l.type === 'path') return { ...l, id, points: l.points.map(([x, y]) => [W - x, y] as [number, number]) };
  // Text and logos keep reading direction; only their placement mirrors.
  return { ...l, id, x: W - l.x, rotation: -l.rotation };
}

export async function flipImageH(src: string): Promise<string> {
  const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const ctx = c.getContext('2d')!;
  ctx.translate(c.width, 0); ctx.scale(-1, 1);
  ctx.drawImage(img, 0, 0);
  return c.toDataURL('image/png');
}

export function mirrorLeftToRight(d: KartDesign, flippedUpload?: { src: string; name: string } | null): KartDesign {
  const W = PANEL_BOX.leftPod.w;
  const left = d.panels.leftPod;
  const uploads = { ...d.uploads };
  // The right pod becomes an exact mirror of the left, including any complete artwork.
  if (flippedUpload) uploads.rightPod = flippedUpload;
  else delete uploads.rightPod;
  return {
    ...d, uploads,
    panels: { ...d.panels, rightPod: { background: left.background, layers: left.layers.map((l) => mirrorLayer(l, W)) } },
  };
}

/* ---------------- name & number quick fields ---------------- */
const PLACEHOLDER: Record<string, (t: string) => boolean> = {
  [NAME_LAYER]: (t) => /^(DRIVER NAME|DRIVER)$/i.test(t.trim()),
  [NUMBER_LAYER]: (t) => /^\d{1,3}$/.test(t.trim()),
};

/** Template text that plays the role of a name/number but was not labelled as such. */
function isRole(l: KartLayer, name: string) {
  if (l.type !== 'text') return false;
  if (l.name === name) return true;
  const other = name === NAME_LAYER ? NUMBER_LAYER : NAME_LAYER;
  return l.name !== other && PLACEHOLDER[name](l.text);
}

/** Label unlabelled template placeholders ("DRIVER NAME", "29") so quick fields can drive them. */
export function adoptPlaceholders(d: KartDesign, name: string): KartDesign {
  const has = PANELS.some((p) => d.panels[p.id].layers.some((l) => l.type === 'text' && l.name === name));
  if (has) return d;
  const panels = { ...d.panels };
  let changed = false;
  for (const p of PANELS) {
    const pd = panels[p.id];
    if (!pd.layers.some((l) => isRole(l, name))) continue;
    changed = true;
    panels[p.id] = { ...pd, layers: pd.layers.map((l) => (isRole(l, name) ? { ...l, name } : l)) };
  }
  return changed ? { ...d, panels } : d;
}

export function getQuick(d: KartDesign, name: string): string | null {
  const a = adoptPlaceholders(d, name);
  for (const p of PANELS) {
    const l = a.panels[p.id].layers.find((x) => x.type === 'text' && x.name === name);
    if (l && l.type === 'text') return l.text;
  }
  return null;
}

export function setQuick(input: KartDesign, name: string, value: string): KartDesign {
  const d = adoptPlaceholders(input, name);
  let found = false;
  const panels = { ...d.panels };
  for (const p of PANELS) {
    const pd = panels[p.id];
    if (!pd.layers.some((l) => l.type === 'text' && l.name === name)) continue;
    found = true;
    panels[p.id] = { ...pd, layers: pd.layers.map((l) => (l.type === 'text' && l.name === name ? { ...l, text: value } : l)) };
  }
  if (found) return { ...d, panels };
  if (!value) return d;
  // No template layer yet: add one in a sensible place.
  if (name === NUMBER_LAYER) {
    const bg = d.panels.nassau.background;
    const l = newText('nassau', value, contrastOn(bg), 'anton', NUMBER_LAYER);
    return addLayer(d, 'nassau', { ...l, size: 200 } as KartLayer);
  }
  let out = d;
  for (const pid of ['leftPod', 'rightPod'] as PanelId[]) {
    const bg = out.panels[pid].background;
    const l = newText(pid, value, contrastOn(bg), 'barlow', NAME_LAYER);
    out = addLayer(out, pid, { ...l, y: 250, size: 56 } as KartLayer);
  }
  return out;
}

/* ---------------- colours ---------------- */
/** The most used colours across the kit (backgrounds weighted), most frequent first. */
export function topColours(d: KartDesign, n = 3): string[] {
  const count = new Map<string, number>();
  const add = (c: string | null | undefined, w: number) => {
    if (!c || !/^#[0-9a-f]{3,8}$/i.test(c)) return;
    const k = c.toLowerCase();
    count.set(k, (count.get(k) || 0) + w);
  };
  PANELS.forEach((p) => {
    const pd = d.panels[p.id];
    add(pd.background, 6);
    pd.layers.forEach((l) => {
      if (l.type === 'image') return;
      add(l.color, 1);
      if (l.type === 'text') add(l.outline, 0.5);
    });
  });
  return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([c]) => c);
}

export function replaceColour(d: KartDesign, from: string, to: string): KartDesign {
  const f = from.toLowerCase();
  const sw = (c: string) => (c.toLowerCase() === f ? to : c);
  const panels = { ...d.panels };
  PANELS.forEach((p) => {
    const pd = panels[p.id];
    panels[p.id] = {
      background: sw(pd.background),
      layers: pd.layers.map((l) => {
        if (l.type === 'image') return l;
        if (l.type === 'text') return { ...l, color: sw(l.color), outline: l.outline ? sw(l.outline) : null };
        return { ...l, color: sw(l.color) };
      }),
    };
  });
  return { ...d, panels };
}
