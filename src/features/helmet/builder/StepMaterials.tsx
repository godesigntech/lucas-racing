/* Step 3: base paint, per-zone overrides, chrome base, finish. */
import type { HelmetDesign } from '@/core/types';
import { money } from '@/core/util';
import { useSettings } from '@/store';
import { Note, Seg } from '@/ui';
import { PaintPicker } from './PaintPicker';
import { ZoneEditor } from './ZoneEditor';

export function StepMaterials({ design, onChange }: { design: HelmetDesign; onChange: (d: HelmetDesign) => void }) {
  const h = useSettings().helmet;
  return (
    <div className="stack" style={{ '--gap': '20px' } as React.CSSProperties}>
      <section className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
        <h3 className="h4">Base paint</h3>
        <p className="small muted">Solid colour or any hydro-dip film from the library. Tintable films can be recoloured (carbon + blue = blue carbon). Stocked films are priced automatically; special-order films go to quote.</p>
        <PaintPicker label="Base" value={design.basePaint} onChange={(p) => onChange({ ...design, basePaint: p })} allowCustomFilm />
      </section>

      <section className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
        <h3 className="h4">Zone materials</h3>
        {design.source === 'template'
          ? <ZoneEditor design={design} onChange={onChange} allowCustomFilm />
          : <Note tone="info">{design.source === 'upload' ? 'Your uploaded artwork covers the shell, so zone materials don\'t apply.' : 'Your drawn shapes keep their own paints. Recolour them in the Design step.'}</Note>}
      </section>

      <section className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
        <div className="row between">
          <h3 className="h4">Chrome base</h3>
          <span className="small muted">+{money(h.chromePrice)}</span>
        </div>
        <label className="toggle-row">
          <input type="checkbox" checked={design.chrome} onChange={(e) => onChange({ ...design, chrome: e.target.checked })} />
          <span className="grow">
            <strong className="small">Chrome base under the graphics</strong>
            <span className="tiny muted" style={{ display: 'block' }}>A solid base colour becomes a candy tint over chrome.</span>
          </span>
        </label>
        {design.chrome && <Note>Chrome is a whole-helmet base layer under your graphics. The 3D preview of chrome is approximate.</Note>}
      </section>

      <section className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
        <div className="row between">
          <h3 className="h4">Finish</h3>
          <span className="small muted">Satin +{money(h.satinPrice)}</span>
        </div>
        <Seg label="Finish" value={design.finish} onChange={(f) => onChange({ ...design, finish: f })}
          options={[{ id: 'gloss', label: 'Gloss clear coat' }, { id: 'satin', label: `Satin · +${money(h.satinPrice)}` }]} />
      </section>
    </div>
  );
}
