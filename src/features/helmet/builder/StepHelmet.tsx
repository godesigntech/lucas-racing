/* Step 1: helmet model + supply (buy new, or send your own). */
import { useRef } from 'react';
import type { HelmetDesign, HelmetSupply } from '@/core/types';
import { HELMET_MODELS, modelById } from '@/data/helmets';
import { money } from '@/core/util';
import { useMode, useSettings } from '@/store';
import { Field, Icon, Note, Seg, UploadButton } from '@/ui';

type Own = Extract<HelmetSupply, { kind: 'own' }>;
const blankOwn = (): Own => ({ kind: 'own', make: '', model: '', size: '', condition: 'new', photos: [], sendMethod: 'courier', returnMethod: 'delivery', notes: '' });

export function helmetStepIssue(d: HelmetDesign): string | null {
  if (d.supply.kind === 'own' && d.supply.condition === 'used' && d.supply.photos.length === 0) return 'Add at least one photo of your used helmet to continue.';
  return null;
}

export function StepHelmet({ design, onChange }: { design: HelmetDesign; onChange: (d: HelmetDesign) => void }) {
  const { full } = useMode();
  const settings = useSettings();
  const lastOwn = useRef<Own>(design.supply.kind === 'own' ? design.supply : blankOwn());
  const model = modelById(design.modelId);
  const models = HELMET_MODELS.filter((m) => full || m.status === 'launch' || m.id === design.modelId);
  const priceOf = (id: string) => settings.helmet.modelPrices[id] ?? modelById(id).newPrice;

  const chooseModel = (id: string) => {
    const m = modelById(id);
    const supply = design.supply.kind === 'new' && !m.sizes.includes(design.supply.size)
      ? { kind: 'new' as const, size: m.sizes.includes('M') ? 'M' : m.sizes[0] }
      : design.supply;
    onChange({ ...design, modelId: id, supply, spoiler: m.spoilerCompatible ? design.spoiler : { ...design.spoiler, enabled: false } });
  };
  const setSupply = (s: HelmetSupply) => {
    if (s.kind === 'own') lastOwn.current = s;
    onChange({ ...design, supply: s });
  };
  const own = design.supply.kind === 'own' ? design.supply : null;

  return (
    <div className="stack" style={{ '--gap': '18px' } as React.CSSProperties}>
      <section className="stack" style={{ '--gap': '10px' } as React.CSSProperties} aria-labelledby="hb-model">
        <div className="row between">
          <h3 id="hb-model" className="h4">Helmet model</h3>
          {!full && <span className="tiny muted">Launch range · switch to full preview for catalogue slots</span>}
        </div>
        <div className="model-grid" role="radiogroup" aria-label="Helmet model">
          {models.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={m.id === design.modelId} className="model-card" onClick={() => chooseModel(m.id)}>
              <span className="row between nowrap" style={{ alignItems: 'flex-start' }}>
                <span>
                  <span className="eyebrow" style={{ fontSize: 11 }}>{m.brand}</span>
                  <span className="h4" style={{ display: 'block' }}>{m.name}</span>
                </span>
                {m.id === design.modelId && <span className="model-check"><Icon name="check" size={14} /></span>}
              </span>
              <span className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
                {m.status === 'launch' ? <span className="badge launch">Launch model</span> : <span className="badge warn">Unconfirmed model</span>}
                {m.status === 'unconfirmed' && <span className="badge">Quote only</span>}
              </span>
              <span className="small muted">{m.status === 'unconfirmed' || !priceOf(m.id) ? 'Price TBC' : `New helmet ${money(priceOf(m.id))}`}{m.spoilerCompatible ? ' · spoiler ready' : ''}</span>
            </button>
          ))}
        </div>
        {model.status !== 'launch' && (
          <Note>{model.status === 'unconfirmed'
            ? 'This model slot is not confirmed yet, so any design on it goes to the workshop for a quote.'
            : 'Catalogue slot shown for the full specification preview. Availability is still to be confirmed with the client.'}</Note>
        )}
      </section>

      <section className="stack" style={{ '--gap': '10px' } as React.CSSProperties} aria-labelledby="hb-supply">
        <h3 id="hb-supply" className="h4">Helmet supply</h3>
        <Seg label="Helmet supply" value={design.supply.kind} onChange={(k) => setSupply(k === 'new' ? { kind: 'new', size: model.sizes.includes('M') ? 'M' : model.sizes[0] } : lastOwn.current)}
          options={[{ id: 'new', label: 'Buy a new helmet' }, { id: 'own', label: 'Send your own' }]} />

        {design.supply.kind === 'new' && (
          <div className="grid g2" style={{ '--gap': '12px' } as React.CSSProperties}>
            <Field label="Size">
              <select className="select" value={design.supply.size} onChange={(e) => setSupply({ kind: 'new', size: e.target.value })}>
                {model.sizes.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <div className="field">
              <span className="label">Helmet price</span>
              <div className="h3">{model.status === 'unconfirmed' || !priceOf(model.id) ? 'TBC' : money(priceOf(model.id))}</div>
            </div>
          </div>
        )}

        {own && (
          <div className="stack" style={{ '--gap': '12px' } as React.CSSProperties}>
            <p className="small muted">Own-helmet preparation: <strong>{money(settings.helmet.ownHelmetPrepFee)}</strong>. Pick the closest shape above for the preview.</p>
            <div className="grid g3" style={{ '--gap': '10px' } as React.CSSProperties}>
              <Field label="Make"><input className="input" value={own.make} placeholder="e.g. Arai" onChange={(e) => setSupply({ ...own, make: e.target.value })} /></Field>
              <Field label="Model"><input className="input" value={own.model} placeholder="e.g. SK-6" onChange={(e) => setSupply({ ...own, model: e.target.value })} /></Field>
              <Field label="Size"><input className="input" value={own.size} placeholder="e.g. M" onChange={(e) => setSupply({ ...own, size: e.target.value })} /></Field>
            </div>
            <div className="field">
              <span className="label">Condition</span>
              <Seg label="Helmet condition" value={own.condition} onChange={(c) => setSupply({ ...own, condition: c })}
                options={[{ id: 'new', label: 'New / unused' }, { id: 'used', label: 'Used' }]} />
            </div>
            <div className="field">
              <span className="label">Photos {own.condition === 'used' ? <span className="badge warn" style={{ marginLeft: 6 }}>Required for used</span> : <span className="muted" style={{ textTransform: 'none', letterSpacing: 0 }}>· optional</span>}</span>
              <div className="row">
                <UploadButton multiple onFiles={(f) => setSupply({ ...own, photos: [...own.photos, ...f] })} maxDim={900}>Add photos</UploadButton>
                <span className="tiny muted">Shell all round, inside liner, chin strap and any damage.</span>
              </div>
              {own.photos.length > 0 && (
                <div className="photo-grid">
                  {own.photos.map((p, i) => (
                    <figure key={i} className="photo">
                      <img src={p.src} alt={p.name} />
                      <button type="button" className="photo-x" aria-label={`Remove ${p.name}`} onClick={() => setSupply({ ...own, photos: own.photos.filter((_, j) => j !== i) })}><Icon name="x" size={14} /></button>
                    </figure>
                  ))}
                </div>
              )}
              {own.condition === 'used' && own.photos.length === 0 && <span className="tiny" style={{ color: 'var(--red)' }}>Add at least one photo to continue.</span>}
            </div>
            <div className="grid g2" style={{ '--gap': '10px' } as React.CSSProperties}>
              <Field label="How it reaches us">
                <select className="select" value={own.sendMethod} onChange={(e) => setSupply({ ...own, sendMethod: e.target.value as Own['sendMethod'] })}>
                  <option value="courier">Courier</option>
                  <option value="dropoff">Drop-off at workshop</option>
                  <option value="track-handover">Track handover</option>
                </select>
              </Field>
              <Field label="How it comes back">
                <select className="select" value={own.returnMethod} onChange={(e) => setSupply({ ...own, returnMethod: e.target.value as Own['returnMethod'] })}>
                  <option value="delivery">Delivery</option>
                  <option value="collection">Collection from workshop</option>
                  <option value="track-handover">Track handover</option>
                </select>
              </Field>
            </div>
            <Field label="Notes for the workshop">
              <textarea className="textarea" rows={3} value={own.notes} placeholder="Anything we should know: previous paint, stickers to remove, deadlines…" onChange={(e) => setSupply({ ...own, notes: e.target.value })} />
            </Field>
            <Note tone="info">Local track handovers are arranged manually. Used-helmet suitability and any waiver are workshop decisions.</Note>
          </div>
        )}
      </section>
    </div>
  );
}
