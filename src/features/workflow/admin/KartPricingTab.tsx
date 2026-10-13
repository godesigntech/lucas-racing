import type { KartMaterial, PanelId } from '@/core/types';
import { BODYWORK, KART_MATERIALS, PANELS } from '@/data/kart';
import { uid } from '@/core/util';
import { Field, Icon, Note } from '@/ui';
import { Card, MoneyInput } from '../shared';
import { SaveBar, useSettingsDraft } from './common';

export function KartPricingTab() {
  const { draft, setDraft, dirty, saving, save, discard } = useSettingsDraft('kart');
  const set = (p: Partial<typeof draft>) => setDraft({ ...draft, ...p });
  return (
    <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
      <Note tone="info">Sticker kits are priced automatically. Customer-created, uploaded or AI artwork does <strong>not</strong> force a quote. Payment is taken before the manual artwork check.</Note>
      <div className="wf-layout">
        <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          <Card title="Complete kit price per bodywork" icon="kart">
            <div className="table-wrap">
              <table className="table wf-table">
                <thead><tr><th>Bodywork</th><th>Kit price</th></tr></thead>
                <tbody>
                  {BODYWORK.map((b) => (
                    <tr key={b.id}><td className="wrap">{b.name}</td><td><MoneyInput value={draft.kitPrices[b.id] ?? 0} onChange={(n) => set({ kitPrices: { ...draft.kitPrices, [b.id]: n } })} label={`Kit price for ${b.name}`} /></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card title="Individual replacement panels" icon="layers">
            <p className="small muted" style={{ marginBottom: 10 }}>Each panel is sold on its own: left and right side pods are independent and never forced together.</p>
            <div className="wf-fields">
              {PANELS.map((p) => (
                <Field key={p.id} label={p.name}>
                  <MoneyInput className="input sm" value={draft.panelPrices[p.id]} onChange={(n) => set({ panelPrices: { ...draft.panelPrices, [p.id as PanelId]: n } })} label={`${p.name} price`} />
                </Field>
              ))}
            </div>
          </Card>
        </div>
        <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          <Card title="Material surcharges" icon="sparkle">
            <div className="wf-fields">
              {KART_MATERIALS.map((m) => (
                <Field key={m.id} label={m.name} hint={m.note}>
                  <MoneyInput className="input sm" value={draft.materialSurcharge[m.id as KartMaterial]} onChange={(n) => set({ materialSurcharge: { ...draft.materialSurcharge, [m.id]: n } })} label={`${m.name} surcharge`} />
                </Field>
              ))}
            </div>
            <p className="tiny muted" style={{ marginTop: 8 }}>Applied in full to a complete kit and pro-rata (per panel of four) to individual replacements.</p>
          </Card>
          <Card title="Production options" icon="wrench" actions={<button className="btn btn-ghost btn-xs" onClick={() => set({ options: [...draft.options, { id: uid('opt-'), label: 'New option', price: 0 }] })}><Icon name="plus" size={14} />Add option</button>}>
            <div className="stack" style={{ '--gap': '8px' } as React.CSSProperties}>
              {draft.options.map((o, i) => (
                <div className="wf-quote-row" key={o.id}>
                  <input className="input sm" value={o.label} aria-label={`Option ${i + 1} label`} onChange={(e) => set({ options: draft.options.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                  <MoneyInput className="input sm" value={o.price} onChange={(n) => set({ options: draft.options.map((x, j) => (j === i ? { ...x, price: n } : x)) })} label={`Option ${i + 1} price`} />
                  <button className="icon-btn" style={{ width: 34, height: 34 }} aria-label={`Remove ${o.label}`} onClick={() => set({ options: draft.options.filter((_, j) => j !== i) })}><Icon name="trash" size={15} /></button>
                </div>
              ))}
              {!draft.options.length && <div className="wf-empty-inline">No production options.</div>}
            </div>
          </Card>
          <Card title="Workshop design service" icon="brush">
            <Field label="Design-service fee (paid upfront)" hint="Charged at checkout when the customer asks the workshop to design the kit.">
              <MoneyInput className="input sm" value={draft.designServiceFee} onChange={(n) => set({ designServiceFee: n })} label="Design-service fee" />
            </Field>
          </Card>
        </div>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onDiscard={discard} />
    </div>
  );
}
