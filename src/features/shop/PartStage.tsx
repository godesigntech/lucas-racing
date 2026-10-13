/* Canvas stage for the proposed 2D parts customiser: renders the part and lets the customer
   drag text / artwork inside the customisable surface (sliders offer a keyboard alternative). */
import { useEffect, useRef, useState } from 'react';
import type { PartCustomSpec, PartCustomisation } from '@/core/types';
import { inBox, maskInfo, renderPart, VB_H, VB_W, type Box, type PartLayout } from './partCanvas';

export function PartStage({ spec, custom, layout, onLayout, artwork, label }: {
  spec: PartCustomSpec;
  custom: PartCustomisation | null;
  layout: PartLayout;
  onLayout: (l: PartLayout) => void;
  artwork: HTMLImageElement | null;
  label: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const boxes = useRef<{ text: Box | null; art: Box | null }>({ text: null, art: null });
  const drag = useRef<{ target: 'text' | 'art'; dx: number; dy: number } | null>(null);
  const [selected, setSelected] = useState<'text' | 'art' | null>(null);
  const [fontTick, setFontTick] = useState(0);

  // Canvas text needs the web fonts loaded before it draws correctly.
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => alive && setFontTick((t) => t + 1));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const scale = Math.min(3, Math.max(1.5, window.devicePixelRatio || 1) * 1.25);
    const w = Math.round(VB_W * scale), h = Math.round(VB_H * scale);
    if (cv.width !== w) cv.width = w;
    if (cv.height !== h) cv.height = h;
    boxes.current = renderPart(cv.getContext('2d')!, scale, { spec, custom, layout, artwork, selected });
  }, [spec, custom, layout, artwork, selected, fontTick]);

  const toUnits = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * VB_W, ((e.clientY - r.top) / r.height) * VB_H] as const;
  };
  const { bbox } = maskInfo(spec.mask);
  const clampX = (x: number) => Math.max(bbox.x, Math.min(bbox.x + bbox.w, x));
  const clampY = (y: number) => Math.max(bbox.y, Math.min(bbox.y + bbox.h, y));

  const movable = !!custom && (!!custom.text.trim() || !!custom.artwork);

  return (
    <div className={'pd-canvas-wrap' + (movable ? ' movable' : '')}>
      <canvas
        ref={ref}
        className="pd-canvas"
        role="img"
        aria-label={label}
        onPointerDown={(e) => {
          if (!custom) return;
          const [x, y] = toUnits(e);
          const target = inBox(boxes.current.text, x, y) ? 'text' : inBox(boxes.current.art, x, y) ? 'art' : null;
          setSelected(target);
          if (!target) return;
          drag.current = { target, dx: x - (target === 'text' ? layout.textX : layout.artX), dy: y - (target === 'text' ? layout.textY : layout.artY) };
          (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const [x, y] = toUnits(e);
          const nx = clampX(x - d.dx), ny = clampY(y - d.dy);
          onLayout(d.target === 'text' ? { ...layout, textX: nx, textY: ny } : { ...layout, artX: nx, artY: ny });
        }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
      />
      {movable && <div className="pd-canvas-hint tiny">Drag text or artwork to position it</div>}
    </div>
  );
}
