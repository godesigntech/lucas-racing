/* Names, race numbers and sponsor logos placed in UV space. */
import { useState } from 'react';
import type { FontId, HelmetDesign, LogoLayer, TextLayer } from '@/core/types';
import { FONT_LABEL, money, uid } from '@/core/util';
import { SIDE_U } from '@/core/uv';
import { STANDARD_BLACK } from '@/domain/helmet';
import { useSettings } from '@/store';
import { Icon, Note, Seg, Swatches, UploadButton } from '@/ui';

type Side = 'left' | 'right' | 'front' | 'back';
const SIDES: { id: Side; label: string }[] = [
  { id: 'left', label: 'Left' }, { id: 'right', label: 'Right' }, { id: 'front', label: 'Front' }, { id: 'back', label: 'Rear' },
];
function sideOf(u: number): Side {
  const d = (a: number, b: number) => Math.min(Math.abs(a - b), 1 - Math.abs(a - b));
  return SIDES.map((s) => s.id).sort((a, b) => d(u, SIDE_U[a]) - d(u, SIDE_U[b]))[0];
}

function Placement({ u, v, size, rotation, mirror, onChange, sizeMax = 0.35 }: {
  u: number; v: number; size: number; rotation: number; mirror: boolean; sizeMax?: number;
  onChange: (p: Partial<{ u: number; v: number; size: number; rotation: number; mirror: boolean }>) => void;
}) {
  return (
    <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
      <div className="field">
        <span className="label">Side</span>
        <Seg label="Side" value={sideOf(u)} onChange={(s) => onChange({ u: SIDE_U[s] })} options={SIDES} />
      </div>
      <div className="grid g2 sliders" style={{ '--gap': '10px 16px' } as React.CSSProperties}>
        <label className="field"><span className="label">Around · {Math.round(u * 360)}°</span>
          <input type="range" min={0} max={1} step={0.005} value={u} onChange={(e) => onChange({ u: +e.target.value })} /></label>
        <label className="field"><span className="label">Height · {v < 0.4 ? 'crown' : v < 0.7 ? 'mid' : 'low'}</span>
          <input type="range" min={0.05} max={0.96} step={0.005} value={v} onChange={(e) => onChange({ v: +e.target.value })} /></label>
        <label className="field"><span className="label">Size · {Math.round(size * 100)}</span>
          <input type="range" min={0.03} max={sizeMax} step={0.005} value={size} onChange={(e) => onChange({ size: +e.target.value })} /></label>
        <label className="field"><span className="label">Rotation · {rotation}°</span>
          <input type="range" min={-60} max={60} step={1} value={rotation} onChange={(e) => onChange({ rotation: +e.target.value })} /></label>
      </div>
      <label className="check small"><input type="checkbox" checked={mirror} onChange={(e) => onChange({ mirror: e.target.checked })} /> Mirror to both sides</label>
    </div>
  );
}

function TextEditor({ t, onChange, onRemove, price }: { t: TextLayer; onChange: (t: TextLayer) => void; onRemove: () => void; price: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="layer-card">
      <div className="layer-head">
        <span className={'badge ' + (t.kind === 'number' ? 'dark' : '')}>{t.kind === 'number' ? 'No.' : 'Name'}</span>
        <input className="input sm grow" value={t.text} maxLength={t.kind === 'number' ? 3 : 24} aria-label={t.kind === 'number' ? 'Race number' : 'Driver name'}
          onChange={(e) => onChange({ ...t, text: t.kind === 'number' ? e.target.value.replace(/[^0-9a-zA-Z]/g, '') : e.target.value })} />
        <span className="tiny muted nowrap">{t.text.trim() ? '+' + money(price) : 'free'}</span>
        <button type="button" className="icon-btn sm" aria-expanded={open} aria-label={open ? 'Hide options' : 'Style and position'} onClick={() => setOpen(!open)}><Icon name="pencil" size={15} /></button>
        <button type="button" className="icon-btn sm" aria-label="Remove" onClick={onRemove}><Icon name="trash" size={15} /></button>
      </div>
      {open && (
        <div className="layer-body stack" style={{ '--gap': '12px' } as React.CSSProperties}>
          <label className="field"><span className="label">Font</span>
            <select className="select sm" value={t.font} onChange={(e) => onChange({ ...t, font: e.target.value as FontId })}>
              {Object.entries(FONT_LABEL).map(([id, l]) => <option key={id} value={id}>{l}</option>)}
            </select>
          </label>
          <div className="field"><span className="label">Colour</span><Swatches value={t.color} onChange={(c) => onChange({ ...t, color: c })} label="Text colour" /></div>
          <div className="field"><span className="label">Outline</span>
            <div className="row">
              <button type="button" className="chip" aria-pressed={!t.outline} onClick={() => onChange({ ...t, outline: null })}>None</button>
              <Swatches value={t.outline} onChange={(c) => onChange({ ...t, outline: c })} label="Outline colour" />
            </div>
          </div>
          <Placement {...t} onChange={(p) => onChange({ ...t, ...p })} />
        </div>
      )}
    </div>
  );
}

function LogoEditor({ l, onChange, onRemove, price }: { l: LogoLayer; onChange: (l: LogoLayer) => void; onRemove: () => void; price: number }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="layer-card">
      <div className="layer-head">
        <img src={l.src} alt="" width={34} height={34} className="logo-thumb" />
        <span className="grow small" style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</span>
        <span className="tiny muted nowrap">+{money(price)}</span>
        <button type="button" className="icon-btn sm" aria-expanded={open} aria-label={open ? 'Hide options' : 'Position'} onClick={() => setOpen(!open)}><Icon name="pencil" size={15} /></button>
        <button type="button" className="icon-btn sm" aria-label={`Remove ${l.name}`} onClick={onRemove}><Icon name="trash" size={15} /></button>
      </div>
      {open && <div className="layer-body"><Placement {...l} sizeMax={0.4} onChange={(p) => onChange({ ...l, ...p })} /></div>}
    </div>
  );
}

export function TextLogoEditor({ design, onChange }: { design: HelmetDesign; onChange: (d: HelmetDesign) => void }) {
  const h = useSettings().helmet;
  const setText = (t: TextLayer) => onChange({ ...design, texts: design.texts.map((x) => (x.id === t.id ? t : x)) });
  const setLogo = (l: LogoLayer) => onChange({ ...design, logos: design.logos.map((x) => (x.id === l.id ? l : x)) });
  const addText = (kind: TextLayer['kind']) => onChange({
    ...design,
    texts: [...design.texts, kind === 'name'
      ? { id: uid('tx_'), kind, text: 'NAME', font: 'barlow', color: STANDARD_BLACK, outline: null, u: 0.405, v: 0.83, size: 0.075, rotation: -6, mirror: true }
      : { id: uid('tx_'), kind, text: '1', font: 'anton', color: STANDARD_BLACK, outline: '#f5f5f2', u: 0.5, v: 0.3, size: 0.16, rotation: 0, mirror: false }],
  });
  const addLogos = (files: { name: string; src: string }[]) => onChange({
    ...design,
    logos: [...design.logos, ...files.map((f, i) => ({
      id: uid('lg_'), name: f.name.replace(/\.[a-z0-9]+$/i, ''), src: f.src,
      u: 0.3 + ((design.logos.length + i) % 3) * 0.05, v: 0.72 - ((design.logos.length + i) % 3) * 0.06, size: 0.09, rotation: 0, mirror: true,
    }))],
  });

  return (
    <div className="stack" style={{ '--gap': '18px' } as React.CSSProperties}>
      <section className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
        <div className="row between">
          <h3 className="h4">Names &amp; numbers</h3>
          <span className="tiny muted">Name {money(h.namePrice)} · Number {money(h.numberPrice)}</span>
        </div>
        {design.texts.map((t) => (
          <TextEditor key={t.id} t={t} price={t.kind === 'name' ? h.namePrice : h.numberPrice} onChange={setText}
            onRemove={() => onChange({ ...design, texts: design.texts.filter((x) => x.id !== t.id) })} />
        ))}
        <div className="row">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => addText('name')}><Icon name="plus" />Name</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => addText('number')}><Icon name="plus" />Number</button>
        </div>
      </section>

      <section className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
        <div className="row between">
          <h3 className="h4">Sponsor &amp; team logos</h3>
          <span className="tiny muted">{money(h.logoPrice)} each</span>
        </div>
        {design.logos.map((l) => (
          <LogoEditor key={l.id} l={l} price={h.logoPrice} onChange={setLogo} onRemove={() => onChange({ ...design, logos: design.logos.filter((x) => x.id !== l.id) })} />
        ))}
        <div className="row">
          <UploadButton multiple accept="image/png,image/jpeg,image/svg+xml,image/webp" maxDim={800} onFiles={addLogos}>Upload logos</UploadButton>
          <span className="tiny muted">PNG with transparency works best.</span>
        </div>
        <Note tone="ok">Sponsor logos don't make a design bespoke: they're priced per logo and the design stays a standard order.</Note>
      </section>
    </div>
  );
}
