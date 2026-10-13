/* Step 4: names/numbers/logos, trims and spoiler. */
import type { HelmetDesign } from '@/core/types';
import { PALETTE, TRIM_COLOURS, colourName } from '@/core/color';
import { money } from '@/core/util';
import { modelById } from '@/data/helmets';
import { STANDARD_BLACK } from '@/domain/helmet';
import { useSettings } from '@/store';
import { Note, Swatches } from '@/ui';
import { TextLogoEditor } from './TextLogoEditor';

type TrimKey = keyof HelmetDesign['trims'];

export function StepDetails({ design, onChange }: { design: HelmetDesign; onChange: (d: HelmetDesign) => void }) {
  const h = useSettings().helmet;
  const model = modelById(design.modelId);
  const trims: { key: TrimKey; label: string; price: number }[] = [
    { key: 'baseRubber', label: 'Base rubber', price: h.baseRubberPrice },
    { key: 'eyeRubber', label: 'Eye-port rubber', price: h.eyeRubberPrice },
    { key: 'plastic', label: 'Plastics (vents & pivots)', price: h.plasticPrice },
  ];
  return (
    <div className="stack" style={{ '--gap': '22px' } as React.CSSProperties}>
      <TextLogoEditor design={design} onChange={onChange} />

      <section className="stack" style={{ '--gap': '12px' } as React.CSSProperties}>
        <h3 className="h4">Trims</h3>
        {trims.map((t) => {
          const v = design.trims[t.key];
          const charged = v.toLowerCase() !== STANDARD_BLACK;
          return (
            <div key={t.key} className="trim-row">
              <div>
                <div className="small" style={{ fontWeight: 600 }}>{t.label}</div>
                <div className="tiny muted">{colourName(v)} · {charged ? `+${money(t.price)}` : `black is standard, colours +${money(t.price)}`}</div>
              </div>
              <Swatches square allowCustom={false} colors={TRIM_COLOURS} value={v} label={t.label}
                onChange={(c) => onChange({ ...design, trims: { ...design.trims, [t.key]: c } })} />
            </div>
          );
        })}
      </section>

      <section className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
        <div className="row between">
          <h3 className="h4">Spoiler</h3>
          <span className="small muted">+{money(h.spoilerPrice)}</span>
        </div>
        <label className="toggle-row" aria-disabled={!model.spoilerCompatible}>
          <input type="checkbox" disabled={!model.spoilerCompatible} checked={design.spoiler.enabled && model.spoilerCompatible}
            onChange={(e) => onChange({ ...design, spoiler: { ...design.spoiler, enabled: e.target.checked } })} />
          <span className="grow">
            <strong className="small">Rear spoiler</strong>
            <span className="tiny muted" style={{ display: 'block' }}>{model.spoilerCompatible ? 'Fitted to the rear crown, painted to match.' : `Not available on the ${model.brand} ${model.name}.`}</span>
          </span>
        </label>
        {!model.spoilerCompatible && <Note tone="info">This helmet shape has no spoiler mounting. Choose a spoiler-compatible model in step 1 to add one.</Note>}
        {design.spoiler.enabled && model.spoilerCompatible && (
          <div className="field">
            <span className="label">Spoiler colour</span>
            <Swatches square colors={PALETTE} value={design.spoiler.color} label="Spoiler colour"
              onChange={(c) => onChange({ ...design, spoiler: { ...design.spoiler, color: c } })} />
          </div>
        )}
      </section>
    </div>
  );
}
