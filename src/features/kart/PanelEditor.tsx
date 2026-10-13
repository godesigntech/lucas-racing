/* Large canvas editor for one kart panel: select, drag, resize, rotate and freehand draw against the outline. */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KartDesign, KartLayer, PanelId } from '@/core/types';
import { drawPanel } from '@/core/kartRender';
import { bodyworkById, PANELS } from '@/data/kart';
import { uid } from '@/core/util';
import { addLayer, hitTest, layerFrame, localToWorld, mapLayer, moveLayerBy, removeLayer, scaleLayer, toLocal, type DesignUpdater } from './kartEdit';
import type { SetOpts } from './useHistory';

export type Tool = 'select' | 'draw';

interface Props {
  design: KartDesign;
  panel: PanelId;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  tool: Tool;
  brush: { width: number; color: string };
  holographic: boolean;
  tick: number;
  onChange: (fn: DesignUpdater, opts?: SetOpts) => void;
}

type Drag =
  | { kind: 'move'; id: string; start: [number, number]; orig: KartLayer; moved: boolean }
  | { kind: 'resize'; id: string; orig: KartLayer; uniform: boolean; moved: boolean }
  | { kind: 'rotate'; id: string; orig: KartLayer; moved: boolean }
  | { kind: 'draw'; points: [number, number][] };

const MARGIN = 26; // css px around the panel so handles stay reachable
const SEL = '#7aa30f';

export function PanelEditor({ design, panel, selectedId, onSelect, tool, brush, holographic, tick, onChange }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<Drag | null>(null);
  const snap = useRef<{ x: boolean; y: boolean }>({ x: false, y: false });
  const [width, setWidth] = useState(0);
  const [cursor, setCursor] = useState('default');

  const outline = bodyworkById(design.bodyworkId).outlines[panel];
  const box = { w: outline.w, h: outline.h };

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(el);
    setWidth(Math.floor(el.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, []);

  // Layout: scale panel units to fit the width (capped in height for tall panels).
  const maxH = Math.max(260, Math.min(typeof window !== 'undefined' ? window.innerHeight * 0.6 : 600, 620));
  const s = width ? Math.max(0.05, Math.min((width - MARGIN * 2) / box.w, (maxH - MARGIN * 2) / box.h)) : 0;
  const cssH = Math.round(box.h * s + MARGIN * 2);
  const ox = (width - box.w * s) / 2;
  const oy = MARGIN;

  const selected = design.panels[panel].layers.find((l) => l.id === selectedId) || null;

  const handles = useCallback((l: KartLayer) => {
    const f = layerFrame(l);
    const pad = 6 / s;
    const resize = localToWorld(f, f.w / 2 + pad, f.h / 2 + pad);
    const rotate = l.type === 'path' ? null : localToWorld(f, 0, -f.h / 2 - pad - 30 / s);
    const top = localToWorld(f, 0, -f.h / 2 - pad);
    return { f, pad, resize, rotate, top };
  }, [s]);

  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (!c || !width || !s) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const pw = Math.round(width * dpr), ph = Math.round(cssH * dpr);
    if (c.width !== pw || c.height !== ph) { c.width = pw; c.height = ph; }
    const ctx = c.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, cssH);
    // faint workshop grid (visible outside the sticker outline)
    ctx.strokeStyle = 'rgba(18,20,18,.05)';
    ctx.lineWidth = 1;
    const step = 50 * s;
    if (step > 6) {
      ctx.beginPath();
      for (let x = ox % step; x < width; x += step) { ctx.moveTo(Math.round(x) + 0.5, 0); ctx.lineTo(Math.round(x) + 0.5, cssH); }
      for (let y = oy % step; y < cssH; y += step) { ctx.moveTo(0, Math.round(y) + 0.5); ctx.lineTo(width, Math.round(y) + 0.5); }
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(s, s);
    drawPanel(ctx, design, panel, { holographic });

    // snap guides while dragging
    const d = drag.current;
    if (d && d.kind === 'move') {
      ctx.save();
      ctx.strokeStyle = '#ec4c9b';
      ctx.lineWidth = 1.5 / s;
      ctx.setLineDash([6 / s, 4 / s]);
      if (snap.current.x) { ctx.beginPath(); ctx.moveTo(box.w / 2, 0); ctx.lineTo(box.w / 2, box.h); ctx.stroke(); }
      if (snap.current.y) { ctx.beginPath(); ctx.moveTo(0, box.h / 2); ctx.lineTo(box.w, box.h / 2); ctx.stroke(); }
      ctx.restore();
    }

    // selection frame + handles
    if (selected && tool === 'select') {
      const { f, pad, resize, rotate, top } = handles(selected);
      ctx.save();
      ctx.translate(f.cx, f.cy);
      ctx.rotate((f.rotation * Math.PI) / 180);
      ctx.strokeStyle = SEL;
      ctx.lineWidth = 2 / s;
      ctx.setLineDash([7 / s, 5 / s]);
      ctx.strokeRect(-f.w / 2 - pad, -f.h / 2 - pad, f.w + pad * 2, f.h + pad * 2);
      ctx.restore();
      ctx.save();
      ctx.lineWidth = 2 / s;
      ctx.strokeStyle = SEL;
      if (rotate) {
        ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(rotate[0], rotate[1]); ctx.stroke();
        ctx.beginPath(); ctx.arc(rotate[0], rotate[1], 8 / s, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
      }
      const hs = 13 / s;
      ctx.fillStyle = '#c8f031';
      ctx.strokeStyle = '#121412';
      ctx.fillRect(resize[0] - hs / 2, resize[1] - hs / 2, hs, hs);
      ctx.strokeRect(resize[0] - hs / 2, resize[1] - hs / 2, hs, hs);
      ctx.restore();
    }

    // in-progress freehand stroke
    if (d && d.kind === 'draw' && d.points.length) {
      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = brush.color; ctx.lineWidth = brush.width;
      ctx.beginPath();
      ctx.moveTo(d.points[0][0], d.points[0][1]);
      d.points.forEach(([x, y]) => ctx.lineTo(x, y));
      if (d.points.length === 1) ctx.lineTo(d.points[0][0] + 0.1, d.points[0][1]);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }, [width, s, cssH, ox, oy, design, panel, holographic, selected, tool, handles, brush, box.w, box.h]);

  useEffect(() => { draw(); }, [draw, tick]);

  const toPanel = (e: React.PointerEvent): [number, number] => {
    const r = canvasRef.current!.getBoundingClientRect();
    return [(e.clientX - r.left - ox) / s, (e.clientY - r.top - oy) / s];
  };

  const handleAt = (x: number, y: number): 'resize' | 'rotate' | null => {
    if (!selected || tool !== 'select') return null;
    const { resize, rotate } = handles(selected);
    const tol = 16 / s; // generous for touch
    if (Math.hypot(x - resize[0], y - resize[1]) <= tol) return 'resize';
    if (rotate && Math.hypot(x - rotate[0], y - rotate[1]) <= tol) return 'rotate';
    return null;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointer already released */ }
    e.currentTarget.focus({ preventScroll: true });
    const [x, y] = toPanel(e);
    if (tool === 'draw') {
      drag.current = { kind: 'draw', points: [[x, y]] };
      draw();
      return;
    }
    const h = handleAt(x, y);
    if (h && selected) {
      drag.current = h === 'resize' ? { kind: 'resize', id: selected.id, orig: selected, uniform: selected.type !== 'rect' && selected.type !== 'ellipse' && selected.type !== 'triangle' && selected.type !== 'stripe', moved: false } : { kind: 'rotate', id: selected.id, orig: selected, moved: false };
      return;
    }
    const id = hitTest(design.panels[panel], x, y, 6 / s);
    onSelect(id);
    if (id) {
      const orig = design.panels[panel].layers.find((l) => l.id === id)!;
      drag.current = { kind: 'move', id, start: [x, y], orig, moved: false };
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const [x, y] = toPanel(e);
    const d = drag.current;
    if (!d) {
      if (tool === 'draw') return setCursor('crosshair');
      const h = handleAt(x, y);
      setCursor(h === 'resize' ? 'nwse-resize' : h === 'rotate' ? 'grab' : hitTest(design.panels[panel], x, y, 6 / s) ? 'move' : 'default');
      return;
    }
    if (d.kind === 'draw') {
      const last = d.points[d.points.length - 1];
      if (Math.hypot(x - last[0], y - last[1]) >= 2 / s) {
        d.points.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
        draw();
      }
      return;
    }
    const opts: SetOpts = d.moved ? { transient: true } : {};
    if (d.kind === 'move') {
      let dx = x - d.start[0], dy = y - d.start[1];
      if (!d.moved && Math.hypot(dx, dy) < 3 / s) return;
      const f = layerFrame(d.orig);
      const tol = 8 / s;
      snap.current = { x: false, y: false };
      if (Math.abs(f.cx + dx - box.w / 2) < tol) { dx = box.w / 2 - f.cx; snap.current.x = true; }
      if (Math.abs(f.cy + dy - box.h / 2) < tol) { dy = box.h / 2 - f.cy; snap.current.y = true; }
      const next = moveLayerBy(d.orig, Math.round(dx), Math.round(dy));
      onChange((des) => mapLayer(des, panel, d.id, () => next), opts);
    } else if (d.kind === 'resize') {
      const { x: lx, y: ly, f } = toLocal(d.orig, x, y);
      let next: KartLayer;
      if (d.uniform || e.shiftKey) {
        const k = Math.hypot(lx, ly) / Math.max(1, Math.hypot(f.w / 2, f.h / 2));
        next = scaleLayer(d.orig, Math.max(0.05, k));
      } else {
        next = scaleLayer(d.orig, Math.max(0.02, Math.abs(lx) / Math.max(1, f.w / 2)), Math.max(0.02, Math.abs(ly) / Math.max(1, f.h / 2)));
      }
      onChange((des) => mapLayer(des, panel, d.id, () => next), opts);
    } else if (d.kind === 'rotate') {
      const f = layerFrame(d.orig);
      let a = (Math.atan2(y - f.cy, x - f.cx) * 180) / Math.PI + 90;
      a = ((Math.round(a) + 540) % 360) - 180;
      if (e.shiftKey) a = Math.round(a / 15) * 15;
      const next = { ...d.orig, rotation: a } as KartLayer;
      onChange((des) => mapLayer(des, panel, d.id, () => next), opts);
    }
    d.moved = true;
  };

  const endDrag = () => {
    const d = drag.current;
    drag.current = null;
    snap.current = { x: false, y: false };
    if (d && d.kind === 'draw') {
      if (d.points.length >= 2) {
        const layer: KartLayer = { id: uid('l'), type: 'path', points: d.points, width: brush.width, color: brush.color, name: 'Freehand' };
        onChange((des) => addLayer(des, panel, layer));
      } else if (d.points.length === 1) {
        const [px, py] = d.points[0];
        const layer: KartLayer = { id: uid('l'), type: 'path', points: [[px, py], [px + 0.5, py]], width: brush.width, color: brush.color, name: 'Dot' };
        onChange((des) => addLayer(des, panel, layer));
      }
    }
    draw();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!selected) return;
    const step = e.shiftKey ? 20 : 4;
    const mv: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (mv[e.key]) {
      e.preventDefault();
      const [dx, dy] = mv[e.key];
      onChange((des) => mapLayer(des, panel, selected.id, (l) => moveLayerBy(l, dx, dy)), { key: 'nudge:' + selected.id });
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      onChange((des) => removeLayer(des, panel, selected.id));
      onSelect(null);
    } else if (e.key === 'Escape') {
      onSelect(null);
    }
  };

  const panelName = PANELS.find((p) => p.id === panel)!.name;
  return (
    <div className="ke-canvas-wrap" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className="ke-canvas"
        style={{ width: width || '100%', height: cssH || 300, cursor }}
        tabIndex={0}
        role="application"
        aria-label={`${panelName} editor. ${tool === 'draw' ? 'Draw mode: drag to draw.' : 'Click a layer to select it, drag to move, use the corner handle to resize. Arrow keys nudge, Delete removes.'}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
      />
      <span className="ke-tag">Illustrative outline · not to scale</span>
    </div>
  );
}
