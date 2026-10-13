/* Render helpers: redraw once web fonts / uploaded images are ready, and debounced kit-sheet images. */
import { useEffect, useMemo, useState } from 'react';
import type { KartDesign, PanelId } from '@/core/types';
import { preloadKartImages, renderKitSheet, renderPanelCanvas, type PanelRenderOpts } from '@/core/kartRender';
import { drawWatermark } from '@/core/helmetPaint';
import { FONT_CSS } from '@/core/util';

export const UNPAID_WATERMARK = 'LUCAS RACING · UNPAID PREVIEW';

let fontsPromise: Promise<void> | null = null;
/** Ask the browser to load every configurator font so canvas text renders with the right face. */
export function loadKartFonts(): Promise<void> {
  if (fontsPromise) return fontsPromise;
  const fs = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (!fs) return (fontsPromise = Promise.resolve());
  const loaded = Promise.all(Object.values(FONT_CSS).map((f) => fs.load(f.replace('{s}', '40')).catch(() => [])))
    .then(() => fs.ready)
    .then(() => undefined)
    .catch(() => undefined);
  // Never block rendering on fonts (font loading can stall in background tabs).
  fontsPromise = Promise.race([loaded, new Promise<void>((r) => setTimeout(r, 2000))]);
  return fontsPromise;
}

/** A counter that bumps when fonts load or the design's images finish loading. */
export function useRenderTick(design: KartDesign | null): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    void loadKartFonts().then(() => alive && setTick((t) => t + 1));
    return () => { alive = false; };
  }, []);
  const imageKey = useMemo(() => {
    if (!design) return '';
    const srcs: string[] = [];
    Object.values(design.panels).forEach((p) => p.layers.forEach((l) => l.type === 'image' && srcs.push(l.src.slice(-48))));
    Object.values(design.uploads).forEach((u) => u && srcs.push(u.src.slice(-48)));
    return srcs.join('|');
  }, [design]);
  useEffect(() => {
    if (!design || !imageKey) return;
    let alive = true;
    void preloadKartImages(design).then(() => alive && setTick((t) => t + 1));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageKey]);
  return tick;
}

/** Debounced kit-sheet data URL for a design. */
export function useKitSheet(design: KartDesign | null, opts: PanelRenderOpts & { watermark?: string | null; width?: number; title?: string }, delay = 140) {
  const tick = useRenderTick(design);
  const [url, setUrl] = useState<string | null>(null);
  const key = JSON.stringify([opts.holographic, opts.watermark, opts.width, opts.title, opts.cutLine]);
  useEffect(() => {
    if (!design) { setUrl(null); return; }
    const t = setTimeout(() => {
      try { setUrl(renderKitSheet(design, opts).toDataURL('image/png')); } catch { setUrl(null); }
    }, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design, key, tick]);
  return url;
}

/** Panel preview with an optional diagonal watermark across it. */
export function panelDataUrl(design: KartDesign, panel: PanelId, width: number, opts: PanelRenderOpts & { watermark?: string | null } = {}) {
  const c = renderPanelCanvas(design, panel, width, opts);
  if (opts.watermark) drawWatermark(c.getContext('2d')!, c.width, c.height, opts.watermark, 0.22);
  return c.toDataURL('image/png');
}

/** Small JPEG kit sheet for basket thumbnails (keeps localStorage small). */
export async function kitThumb(design: KartDesign, holographic: boolean) {
  await Promise.all([preloadKartImages(design), loadKartFonts()]);
  return renderKitSheet(design, { width: 520, holographic }).toDataURL('image/jpeg', 0.82);
}

/** Watermarked PNG of the complete kit for unpaid downloads. */
export async function watermarkedKit(design: KartDesign, holographic: boolean, width = 1600) {
  await Promise.all([preloadKartImages(design), loadKartFonts()]);
  return renderKitSheet(design, { width, holographic, watermark: UNPAID_WATERMARK }).toDataURL('image/png');
}
