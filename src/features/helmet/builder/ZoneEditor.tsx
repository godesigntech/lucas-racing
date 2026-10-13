/* Editable template zones: flat map (click a zone) + list, each zone painted with colour or film. */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { HelmetDesign, Paint } from '@/core/types';
import { paintHelmet } from '@/core/helmetPaint';
import { UV_H, UV_W } from '@/core/uv';
import { templateById } from '@/data/helmets';
import { Note } from '@/ui';
import { paintLabel } from '../shared';
import { PaintPicker, PaintSwatch } from './PaintPicker';

const MAP_SCALE = 0.25;

export function ZoneEditor({ design, onChange, allowCustomFilm = false }: {
  design: HelmetDesign; onChange: (d: HelmetDesign) => void; allowCustomFilm?: boolean;
}) {
  const tpl = templateById(design.templateId);
  const [sel, setSel] = useState<string | null>(tpl?.zones[0]?.id ?? null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const hitCtx = useMemo(() => document.createElement('canvas').getContext('2d')!, []);

  useEffect(() => {
    if (tpl && !tpl.zones.some((z) => z.id === sel)) setSel(tpl.zones[0]?.id ?? null);
  }, [tpl, sel]);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !tpl) return;
    const id = requestAnimationFrame(() => {
      const { color } = paintHelmet(design, { guides: true, selectedZone: sel, scale: MAP_SCALE });
      c.width = color.width;
      c.height = color.height;
      c.getContext('2d')!.drawImage(color, 0, 0);
    });
    return () => cancelAnimationFrame(id);
  }, [design, sel, tpl]);

  if (!tpl || design.source !== 'template') {
    return <Note tone="info">Zone colours apply to template designs. Pick a template in the Design step to edit its zones.</Note>;
  }

  const pick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * UV_W, y = ((e.clientY - r.top) / r.height) * UV_H;
    // Topmost zone wins (zones paint in order).
    const hit = [...tpl.zones].reverse().find((z) => hitCtx.isPointInPath(new Path2D(z.path), x, y));
    if (hit) setSel(hit.id);
  };
  const setZone = (id: string, p: Paint) => onChange({ ...design, zonePaints: { ...design.zonePaints, [id]: p } });
  const zone = tpl.zones.find((z) => z.id === sel);

  return (
    <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
      <div className="zone-map">
        <canvas ref={canvas} onClick={pick} role="img" aria-label={`Flat layout of the ${tpl.name} template. Click a zone to select it.`} />
        <div className="zone-map-labels tiny" aria-hidden="true"><span>Rear</span><span>Left</span><span>Front</span><span>Right</span><span>Rear</span></div>
      </div>
      <div className="zone-list" role="list">
        {tpl.zones.map((z) => {
          const p = design.zonePaints[z.id] ?? z.defaultPaint;
          return (
            <button key={z.id} type="button" role="listitem" className="zone-row" aria-pressed={sel === z.id} onClick={() => setSel(z.id)}>
              <PaintSwatch paint={p} size={26} />
              <span className="grow" style={{ textAlign: 'left' }}>
                <strong className="small">{z.name}</strong>
                <span className="tiny muted" style={{ display: 'block' }}>{paintLabel(p)}</span>
              </span>
              {JSON.stringify(p) !== JSON.stringify(z.defaultPaint) && (
                <span className="btn-link tiny" role="button" tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); setZone(z.id, z.defaultPaint); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setZone(z.id, z.defaultPaint); } }}>Reset</span>
              )}
            </button>
          );
        })}
      </div>
      {zone && (
        <div className="panel">
          <div className="label" style={{ marginBottom: 8 }}>{zone.name}</div>
          <PaintPicker key={zone.id} label={zone.name} value={design.zonePaints[zone.id] ?? zone.defaultPaint} onChange={(p) => setZone(zone.id, p)} allowCustomFilm={allowCustomFilm} />
        </div>
      )}
    </div>
  );
}
