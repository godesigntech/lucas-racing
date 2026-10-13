/* Small, memoised 2D previews of helmet designs (template cards, saved designs, AI concepts).
   We paint the UV texture at low resolution and wrap the left-hand side into a stylised
   side-profile silhouette: cheap, recognisable, and needs no WebGL context. */
import { useEffect, useMemo, useState } from 'react';
import type { HelmetDesign, HelmetTemplate } from '@/core/types';
import { designImages, paintHelmet, preloadDesignImages } from '@/core/helmetPaint';
import { cachedImage } from '@/core/filmRender';
import { designHash, newHelmetDesign, applyTemplate } from '@/domain/helmet';

const cache = new Map<string, string>();
const MAX = 240;

function remember(key: string, url: string) {
  if (cache.size > MAX) cache.delete(cache.keys().next().value as string);
  cache.set(key, url);
  return url;
}

/** Side-profile silhouette (unit box, facing right: rear on the left, visor on the right). */
function silhouette(w: number, h: number) {
  const p = new Path2D();
  const X = (x: number) => x * w, Y = (y: number) => y * h;
  p.moveTo(X(0.07), Y(0.9));
  p.bezierCurveTo(X(0.0), Y(0.52), X(0.12), Y(0.07), X(0.5), Y(0.05));
  p.bezierCurveTo(X(0.82), Y(0.04), X(0.98), Y(0.32), X(0.96), Y(0.64));
  p.lineTo(X(0.92), Y(0.92));
  p.closePath();
  return p;
}

export function helmetThumb(d: HelmetDesign, width = 220): string {
  const ready = designImages(d).every((s) => !!cachedImage(s));
  const key = designHash(d) + '|' + width + '|' + (ready ? 1 : 0);
  const hit = cache.get(key);
  if (hit) return hit;
  const w = width, h = Math.round(width * 0.82);
  const { color } = paintHelmet(d, { scale: 0.18 });
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  const sil = silhouette(w, h);
  ctx.save();
  ctx.clip(sil);
  // Left half of UV space = rear (x 0) → face (x 1024): a right-facing side view.
  ctx.drawImage(color, 0, 0, color.width / 2, color.height, 0, 0, w, h);
  // Gloss highlight + shading
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(255,255,255,.32)');
  g.addColorStop(0.35, 'rgba(255,255,255,.04)');
  g.addColorStop(1, 'rgba(0,0,0,.22)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  ctx.lineWidth = Math.max(1, w / 140);
  ctx.strokeStyle = 'rgba(18,20,18,.35)';
  ctx.stroke(sil);
  return remember(key, c.toDataURL('image/png'));
}

/** React hook: thumbnail that refreshes once uploaded images (logos, artwork) have loaded. */
export function useHelmetThumb(d: HelmetDesign | null, width = 220): string {
  const [tick, bump] = useState(0);
  useEffect(() => {
    if (!d) return;
    let alive = true;
    const pending = designImages(d).some((s) => !cachedImage(s));
    if (pending) preloadDesignImages(d).then(() => { if (alive) bump((n) => n + 1); });
    return () => { alive = false; };
  }, [d]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => (d ? helmetThumb(d, width) : ''), [d, width, tick]);
}

const tplBase = new Map<string, HelmetDesign>();
/** Preview of a template on its own (no names/logos), memoised per template. */
export function templateThumb(tpl: HelmetTemplate, width = 200): string {
  let d = tplBase.get(tpl.id);
  if (!d) {
    d = { ...applyTemplate(newHelmetDesign('arai-sk6', null), tpl), texts: [] };
    tplBase.set(tpl.id, d);
  }
  return helmetThumb(d, width);
}
