import { HELMET_MODELS, HELMET_TEMPLATES } from '@/data/helmets';
import type { Settings } from '@/core/types';
import { money } from '@/core/util';
import { Field, Note, ScopeBadge } from '@/ui';
import { Card, MoneyInput } from '../shared';
import { SaveBar, useSettingsDraft } from './common';

type H = Settings['helmet'];
const CHARGES: { key: keyof Omit<H, 'templatePrices' | 'modelPrices'>; label: string; hint: string }[] = [
  { key: 'logoPrice', label: 'Logo (each)', hint: 'Logos alone never force a quote' },
  { key: 'namePrice', label: 'Name', hint: 'Per name layer' },
  { key: 'numberPrice', label: 'Number', hint: 'Per number layer' },
  { key: 'chromePrice', label: 'Chrome base', hint: '' },
  { key: 'satinPrice', label: 'Satin finish', hint: 'Gloss is included' },
  { key: 'baseRubberPrice', label: 'Coloured base rubber', hint: 'Standard black is free' },
  { key: 'eyeRubberPrice', label: 'Coloured eye-port rubber', hint: 'Standard black is free' },
  { key: 'plasticPrice', label: 'Coloured plastics', hint: 'Standard black is free' },
  { key: 'spoilerPrice', label: 'Spoiler', hint: 'Compatible models only' },
  { key: 'ownHelmetPrepFee', label: 'Own-helmet preparation', hint: 'Replaces the new-helmet price' },
];

export function HelmetPricingTab() {
  const { draft, setDraft, dirty, saving, save, discard } = useSettingsDraft('helmet');
  const set = (p: Partial<H>) => setDraft({ ...draft, ...p });
  return (
    <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
      <Note tone="info">All prices are sample values. Standard designs are priced automatically from these values; bespoke work is quoted manually.</Note>
      <div className="wf-layout">
        <Card title="Template starting prices" icon="helmet" actions={<span className="tiny muted">{HELMET_TEMPLATES.length} templates</span>}>
          <div className="table-wrap">
            <table className="table wf-table">
              <thead><tr><th>Template</th><th>Scope</th><th>Default</th><th>Starting price</th></tr></thead>
              <tbody>
                {HELMET_TEMPLATES.map((t) => (
                  <tr key={t.id}>
                    <td><strong>{t.name}</strong><div className="tiny muted">{t.zones.length} zone{t.zones.length === 1 ? '' : 's'}</div></td>
                    <td>{t.launch ? <ScopeBadge tag="launch">Launch</ScopeBadge> : <ScopeBadge tag="future">Catalogue</ScopeBadge>}</td>
                    <td className="muted">{money(t.startPrice)}</td>
                    <td><MoneyInput value={draft.templatePrices[t.id] ?? t.startPrice} onChange={(n) => set({ templatePrices: { ...draft.templatePrices, [t.id]: n } })} label={`Starting price for ${t.name}`} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          <Card title="New helmet prices" icon="basket">
            <div className="table-wrap">
              <table className="table wf-table">
                <thead><tr><th>Model</th><th>Status</th><th>Price</th></tr></thead>
                <tbody>
                  {HELMET_MODELS.map((m) => (
                    <tr key={m.id}>
                      <td className="wrap"><strong>{m.brand} {m.name}</strong></td>
                      <td>{m.status === 'launch' ? <span className="badge launch">Launch</span> : m.status === 'catalogue' ? <span className="badge future">Catalogue</span> : <span className="badge proposed">Unconfirmed → quote</span>}</td>
                      <td><MoneyInput value={draft.modelPrices[m.id] ?? m.newPrice} onChange={(n) => set({ modelPrices: { ...draft.modelPrices, [m.id]: n } })} label={`New price for ${m.brand} ${m.name}`} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card title="Options & charges" icon="wrench">
            <div className="wf-fields">
              {CHARGES.map((c) => (
                <Field key={c.key} label={c.label} hint={c.hint || undefined}>
                  <MoneyInput className="input sm" value={draft[c.key]} onChange={(n) => set({ [c.key]: n } as Partial<H>)} label={c.label} />
                </Field>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onDiscard={discard} />
    </div>
  );
}
