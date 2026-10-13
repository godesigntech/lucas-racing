/* From-scratch drawing board on the flat UV layout. Shapes are DrawLayers in UV space
   (2048 x 1024), so the 3D viewer picks them up immediately. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DrawLayer, HelmetDesign, Paint } from '@/core/types';
import { paintHelmet } from '@/core/helmetPaint';
import { paintStyle } from '@/core/filmRender';
import { UV_H, UV_W } from '@/core/uv';
import { uid } from '@/core/util';
import { Icon } from '@/ui';
import { mirrorLayer } from '../aiConcepts';
import { paintLabel } from '../shared';
import { PaintPicker, PaintSwatch } from './PaintPicker';

type Tool = 'brush' | 'stripe' | 'rect' | 'ellipse' | 'select';
type Pt = [number, number];
const TOOLS: { id: Tool; label: string; icon: string }[] = [
  { id: 'brush', label: 'Brush', icon: 'brush' },
  { id: 'stripe', label: 'Stripe', icon: 'minus' },
  { id: 'rect', label: 'Rectangle', icon: 'shape' },
  { id: 'ellipse', label: 'Ellipse', icon: 'eye' },
  { id: 'select', label: 'Select', icon: 'layers' },
];
const SCALE = 0.5; // board canvas = 1024 x 512 internal pixels
const LAYER_NAME: Record<DrawLayer['type'], string> = { stroke: 'Brush stroke', stripe: 'Stripe', rect: 'Rectangle', ellipse: 'Ellipse' };

function layerPath(l: DrawLayer): Path2D {
  const p = new Path2D();
  if (l.type === 'stroke') {
    l.points.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
    return p;
  }
  if (l.type === 'stripe') {
    const dx = l.x2 - l.x1, dy = l.y2 - l.y1, len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * (l.width / 2), ny = (dx / len) * (l.width / 2);
    p.moveTo(l.x1 + nx, l.y1 + ny); p.lineTo(l.x2 + nx, l.y2 + ny); p.lineTo(l.x2 - nx, l.y2 - ny); p.lineTo(l.x1 - nx, l.y1 - ny); p.closePath();
    return p;
  }
  const m = new DOMMatrix().translate(l.x + l.w / 2, l.y + l.h / 2).rotate(l.rotation);
  const s = new Path2D();
  if (l.type === 'rect') s.rect(-l.w / 2, -l.h / 2, l.w, l.h);
  else s.ellipse(0, 0, Math.abs(l.w / 2), Math.abs(l.h / 2), 0, 0, Math.PI * 2);
  p.addPath(s, m);
  return p;
}

function bounds(l: DrawLayer): [number, number, number, number] {
  if (l.type === 'stroke') {
    const xs = l.points.map((p) => p[0]), ys = l.points.map((p) => p[1]);
    return [Math.min(...xs) - l.width / 2, Math.min(...ys) - l.width / 2, Math.max(...xs) + l.width / 2, Math.max(...ys) + l.width / 2];
  }
  if (l.type === 'stripe') return [Math.min(l.x1, l.x2) - l.width / 2, Math.min(l.y1, l.y2) - l.width / 2, Math.max(l.x1, l.x2) + l.width / 2, Math.max(l.y1, l.y2) + l.width / 2];
  return [l.x, l.y, l.x + l.w, l.y + l.h];
}

/** The layer plus its mirror image, unless it sits on the centre line (mirror would duplicate it). */
function withMirror(l: DrawLayer, on: boolean): DrawLayer[] {
  if (!on) return [l];
  const m = mirrorLayer(l);
  const near = (a: number, b: number) => Math.abs(a - b) < 6;
  let same = false;
  if (l.type === 'stripe' && m.type === 'stripe') {
    same = (near(l.x1, m.x1) && near(l.x2, m.x2) && near(l.y1, m.y1) && near(l.y2, m.y2))
      || (near(l.x1, m.x2) && near(l.x2, m.x1) && near(l.y1, m.y2) && near(l.y2, m.y1));
  } else if ((l.type === 'rect' || l.type === 'ellipse') && m.type === l.type) {
    same = near(l.x, m.x) && l.rotation === 0;
  }
  return same ? [l] : [l, m];
}

export function LayerList({ layers, selected, onSelect, onDelete, onPaint }: {
  layers: DrawLayer[]; selected: string | null; onSelect: (id: string) => void; onDelete: (id: string) => void; onPaint?: (id: string, p: Paint) => void;
}) {
  if (!layers.length) return <p className="tiny muted">No shapes yet.</p>;
  return (
    <div className="zone-list" role="list" aria-label="Layers (top first)">
      {[...layers].reverse().map((l, i) => (
        <div key={l.id} role="listitem" className="zone-row" aria-pressed={selected === l.id}>
          <button type="button" className="layer-pick" onClick={() => onSelect(l.id)} aria-label={`Select ${LAYER_NAME[l.type]} ${layers.length - i}`}>
            <PaintSwatch paint={l.paint} size={24} />
            <span className="grow" style={{ textAlign: 'left' }}>
              <strong className="small">{LAYER_NAME[l.type]} {layers.length - i}</strong>
              <span className="tiny muted" style={{ display: 'block' }}>{paintLabel(l.paint)}</span>
            </span>
          </button>
          <button type="button" className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => onDelete(l.id)} aria-label={`Delete ${LAYER_NAME[l.type]} ${layers.length - i}`}><Icon name="trash" size={15} /></button>
        </div>
      ))}
      {selected && onPaint && (() => {
        const l = layers.find((x) => x.id === selected);
        return l ? (
          <div className="panel" style={{ marginTop: 4 }}>
            <div className="label" style={{ marginBottom: 8 }}>Selected {LAYER_NAME[l.type].toLowerCase()} paint</div>
            <PaintPicker key={l.id} label="Selected layer" value={l.paint} onChange={(p) => onPaint(l.id, p)} />
          </div>
        ) : null;
      })()}
    </div>
  );
}

export function DrawingBoard({ design, onChange }: { design: HelmetDesign; onChange: (d: HelmetDesign) => void }) {
  const [tool, setTool] = useState<Tool>('brush');
  const [width, setWidth] = useState(40);
  const [paint, setPaint] = useState<Paint>({ kind: 'solid', color: '#e3262b' });
  const [mirror, setMirror] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [undo, setUndo] = useState<DrawLayer[][]>([]);
  const base = useRef<HTMLCanvasElement>(null);
  const over = useRef<HTMLCanvasElement>(null);
  const draft = useRef<{ start: Pt; pts: Pt[]; end: Pt } | null>(null);
  const hitCtx = useMemo(() => document.createElement('canvas').getContext('2d')!, []);

  // Fresh undo history per design.
  useEffect(() => { setUndo([]); setSelected(null); }, [design.id]);

  const commit = useCallback((drawing: DrawLayer[]) => {
    setUndo((u) => [...u.slice(-49), design.drawing]);
    onChange({ ...design, drawing });
  }, [design, onChange]);

  // Render the painted design + guides to the board.
  useEffect(() => {
    const c = base.current;
    if (!c) return;
    const raf = requestAnimationFrame(() => {
      const { color } = paintHelmet(design, { scale: SCALE });
      const ctx = c.getContext('2d')!;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(color, 0, 0);
      ctx.save();
      ctx.scale(SCALE, SCALE);
      ctx.setLineDash([12, 12]);
      ctx.lineWidth = 2 / SCALE;
      ctx.strokeStyle = 'rgba(18,20,18,.35)';
      [0.25, 0.5, 0.75].forEach((u) => { ctx.beginPath(); ctx.moveTo(u * UV_W, 0); ctx.lineTo(u * UV_W, UV_H); ctx.stroke(); });
      ctx.setLineDash([]);
      ctx.font = "700 40px Inter, Arial";
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(18,20,18,.55)';
      [['REAR', 0.035], ['LEFT', 0.25], ['FRONT', 0.5], ['RIGHT', 0.75], ['REAR', 0.965]].forEach(([t, u]) => ctx.fillText(String(t), Number(u) * UV_W, 52));
      const sel = design.drawing.find((l) => l.id === selected);
      if (sel) {
        const [x0, y0, x1, y1] = bounds(sel);
        ctx.setLineDash([16, 10]);
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#c8f031';
        ctx.strokeRect(x0 - 8, y0 - 8, x1 - x0 + 16, y1 - y0 + 16);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#121412';
        ctx.strokeRect(x0 - 8, y0 - 8, x1 - x0 + 16, y1 - y0 + 16);
      }
      ctx.restore();
    });
    return () => cancelAnimationFrame(raf);
  }, [design, selected]);

  const toUV = (e: React.PointerEvent): Pt => {
    const r = e.currentTarget.getBoundingClientRect();
    return [Math.round(((e.clientX - r.left) / r.width) * UV_W), Math.round(((e.clientY - r.top) / r.height) * UV_H)];
  };

  const makeLayer = (d: NonNullable<typeof draft.current>): DrawLayer | null => {
    const [x1, y1] = d.start, [x2, y2] = d.end;
    if (tool === 'brush') return d.pts.length >= 2 ? { id: uid('dl_'), type: 'stroke', points: d.pts, width, paint } : null;
    if (tool === 'stripe') return Math.hypot(x2 - x1, y2 - y1) > 8 ? { id: uid('dl_'), type: 'stripe', x1, y1, x2, y2, width, paint } : null;
    if (tool === 'rect' || tool === 'ellipse') {
      const w = Math.abs(x2 - x1), h = Math.abs(y2 - y1);
      return w > 6 && h > 6 ? { id: uid('dl_'), type: tool, x: Math.min(x1, x2), y: Math.min(y1, y2), w, h, rotation: 0, paint } : null;
    }
    return null;
  };

  const drawDraft = () => {
    const c = over.current, d = draft.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    if (!d) return;
    const l = makeLayer(d);
    if (!l) return;
    ctx.scale(SCALE, SCALE);
    const style = paintStyle(ctx, paint, 1.5);
    for (const layer of withMirror(l, mirror)) {
      const p = layerPath(layer);
      if (layer.type === 'stroke') {
        ctx.lineWidth = layer.width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.strokeStyle = style; ctx.stroke(p);
      } else {
        ctx.fillStyle = style; ctx.fill(p);
      }
    }
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = toUV(e);
    if (tool === 'select') {
      const hit = [...design.drawing].reverse().find((l) => {
        const p = layerPath(l);
        if (l.type === 'stroke') { hitCtx.lineWidth = Math.max(l.width, 20); hitCtx.lineCap = 'round'; return hitCtx.isPointInStroke(p, pt[0], pt[1]); }
        return hitCtx.isPointInPath(p, pt[0], pt[1]);
      });
      setSelected(hit?.id ?? null);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    draft.current = { start: pt, pts: [pt], end: pt };
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = draft.current;
    if (!d) return;
    const pt = toUV(e);
    d.end = pt;
    const last = d.pts[d.pts.length - 1];
    if (tool === 'brush' && Math.hypot(pt[0] - last[0], pt[1] - last[1]) > 5) d.pts.push(pt);
    drawDraft();
  };
  const onUp = () => {
    const d = draft.current;
    draft.current = null;
    drawDraft();
    if (!d) return;
    const l = makeLayer(d);
    if (!l) return;
    commit([...design.drawing, ...withMirror(l, mirror)]);
    setSelected(l.id);
  };

  const doUndo = () => {
    const prev = undo[undo.length - 1];
    if (!prev) return;
    setUndo(undo.slice(0, -1));
    onChange({ ...design, drawing: prev });
    setSelected(null);
  };
  const remove = (id: string) => { commit(design.drawing.filter((l) => l.id !== id)); if (selected === id) setSelected(null); };
  const repaint = (id: string, p: Paint) => commit(design.drawing.map((l) => (l.id === id ? { ...l, paint: p } : l)));

  useEffect(() => {
    if (!expanded) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setExpanded(false);
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [expanded]);

  return (
    <div className={'drawing-board' + (expanded ? ' expanded' : '')}
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); doUndo(); }
        if ((e.key === 'Delete' || e.key === 'Backspace') && selected && !(e.target instanceof HTMLInputElement)) remove(selected);
      }}>
      <div className="db-head row between">
        <div className="db-tools" role="toolbar" aria-label="Drawing tools">
          {TOOLS.map((t) => (
            <button key={t.id} type="button" className="db-tool" aria-pressed={tool === t.id} onClick={() => setTool(t.id)} title={t.label}>
              <Icon name={t.icon} size={16} /><span>{t.label}</span>
            </button>
          ))}
        </div>
        <div className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
          <button type="button" className="btn btn-ghost btn-xs" onClick={doUndo} disabled={!undo.length} aria-label="Undo (Ctrl+Z)"><Icon name="undo" size={14} />Undo</button>
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => { if (design.drawing.length) { commit([]); setSelected(null); } }} disabled={!design.drawing.length}>Clear</button>
          <button type="button" className="btn btn-dark btn-xs" onClick={() => setExpanded(!expanded)}>{expanded ? 'Close board' : 'Open drawing board'}</button>
        </div>
      </div>

      <div className="db-body">
        <div className="db-canvas-wrap">
          <canvas ref={base} width={UV_W * SCALE} height={UV_H * SCALE} className="db-canvas" aria-hidden="true" />
          <canvas ref={over} width={UV_W * SCALE} height={UV_H * SCALE} className="db-canvas db-over" data-tool={tool}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
            tabIndex={0} role="application" aria-label="Drawing canvas: flat layout of the helmet shell. Drag to draw with the selected tool." />
        </div>

        <div className="db-side stack" style={{ '--gap': '12px' } as React.CSSProperties}>
          <div className="grid g2" style={{ '--gap': '12px' } as React.CSSProperties}>
            {(tool === 'brush' || tool === 'stripe') && (
              <label className="field">
                <span className="label">Width · {width}</span>
                <input type="range" min={4} max={200} value={width} onChange={(e) => setWidth(+e.target.value)} />
              </label>
            )}
            <label className="check small" style={{ alignSelf: 'end' }}>
              <input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} /> Mirror left ↔ right
            </label>
          </div>
          <div className="field">
            <span className="label">Paint for new shapes</span>
            <PaintPicker label="New shape" value={paint} onChange={setPaint} />
          </div>
          <div className="field">
            <span className="label">Layers · {design.drawing.length}</span>
            <LayerList layers={design.drawing} selected={selected} onSelect={(id) => { setSelected(id); setTool('select'); }} onDelete={remove} onPaint={repaint} />
          </div>
        </div>
      </div>
    </div>
  );
}
