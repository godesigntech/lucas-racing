import { useMemo, useState } from 'react';
import type { PartOrder } from '@/core/types';
import { fmtDate, money } from '@/core/util';
import { PRODUCTS } from '@/data/parts';
import { simulateEmail, useCollection } from '@/store';
import { Field, Note, ScopeBadge, Seg } from '@/ui';
import { PART_STATUS, attempt, savePartOrder, type D } from '../data';
import { Card, MoneyInput, StatusBadge } from '../shared';
import { PROPOSED_NOTE, SaveBar, SearchBox, useSettingsDraft } from './common';

export function PartsTab() {
  const { draft, setDraft, dirty, saving, save, discard } = useSettingsDraft('parts');
  const set = (p: Partial<typeof draft>) => setDraft({ ...draft, ...p });
  const [q, setQ] = useState('');
  const products = useMemo(() => PRODUCTS.filter((p) => !q || `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(q.toLowerCase())), [q]);
  const orders = useCollection<D<PartOrder>>('partOrders').items;

  const setStatus = (o: PartOrder, status: PartOrder['status'], subject: string, body: string) => attempt(async () => {
    await savePartOrder({ ...o, status });
    await simulateEmail(o.customer.email, subject, body);
  }, `${o.ref} updated.`);

  return (
    <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
      <Note tone="warn" title="Sample catalogue.">Products, SKUs and prices are placeholders. No live MS Kart / ABRA supplier feed is connected until an authorised feed is supplied.</Note>

      <Card title="Proposed customisation pricing" icon="sparkle" actions={<ScopeBadge tag="proposed" />}>
        <p className="small muted" style={{ marginBottom: 12 }}>2D parts customisation rules are kept separate from helmet and sticker pricing. Every value below is a proposal.</p>
        <div className="wf-fields">
          <Field label="Hydro-dip effect fee" hint={PROPOSED_NOTE}><MoneyInput className="input sm" value={draft.effectFee} onChange={(n) => set({ effectFee: n })} label="Effect fee" /></Field>
          <Field label="Floor-tray sticker" hint={PROPOSED_NOTE}><MoneyInput className="input sm" value={draft.traySticker} onChange={(n) => set({ traySticker: n })} label="Tray sticker price" /></Field>
          <Field label="Custom text fee" hint={PROPOSED_NOTE}><MoneyInput className="input sm" value={draft.textFee} onChange={(n) => set({ textFee: n })} label="Text fee" /></Field>
          <div className="field">
            <span className="label">Uploaded artwork handling</span>
            <Seg label="Artwork handling" value={draft.artworkHandling} onChange={(v) => set({ artworkHandling: v })} options={[{ id: 'quote', label: 'Route to quote' }, { id: 'fixed', label: 'Fixed fee' }]} />
            {draft.artworkHandling === 'fixed' && <MoneyInput className="input sm" value={draft.artworkFee} onChange={(n) => set({ artworkFee: n })} label="Artwork fee" />}
            <span className="tiny muted">{PROPOSED_NOTE}</span>
          </div>
        </div>
      </Card>

      <Card title={`Sample product prices (${PRODUCTS.length})`} icon="wrench">
        <div className="wf-toolbar"><SearchBox value={q} onChange={setQ} placeholder="Search products" /></div>
        <div className="table-wrap" style={{ maxHeight: 460, overflowY: 'auto' }}>
          <table className="table wf-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}><tr><th>Product</th><th>SKU</th><th>Category</th><th>Customisable</th><th>Default</th><th>Price</th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="wrap"><strong>{p.name}</strong></td>
                  <td className="mono">{p.sku}</td>
                  <td>{p.category}</td>
                  <td>{p.custom ? <span className="badge proposed">{p.custom.kind === 'tray-sticker' ? 'Tray sticker' : 'Surface'}</span> : <span className="muted">—</span>}</td>
                  <td className="muted">{money(p.price)}</td>
                  <td><MoneyInput value={draft.prices[p.id] ?? p.price} onChange={(n) => set({ prices: { ...draft.prices, [p.id]: n } })} label={`Price for ${p.name}`} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onDiscard={discard} />

      <Card title={`Parts orders (${orders.length})`} icon="basket">
        {orders.length ? (
          <div className="table-wrap">
            <table className="table wf-table">
              <thead><tr><th>Ref</th><th>Customer</th><th>Lines</th><th className="num">Total</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><strong>{o.ref}</strong><div className="tiny muted">{fmtDate(o.createdAt)}</div></td>
                    <td className="wrap">{o.customer.name}<div className="tiny muted">{o.customer.email}{o.guest ? ' · guest' : ''}</div></td>
                    <td className="wrap small">{o.lines.map((l) => `${l.qty} × ${l.name}${l.needsQuote ? ' (quote)' : ''}`).join(', ')}</td>
                    <td className="num">{money(o.total)}</td>
                    <td><StatusBadge {...PART_STATUS[o.status]} /></td>
                    <td>
                      <div className="row" style={{ '--gap': '6px', flexWrap: 'nowrap' } as React.CSSProperties}>
                        {o.status === 'awaiting-quote' && (
                          <button className="btn btn-ghost btn-xs" onClick={() => setStatus(o, 'paid', `Your quote for ${o.ref}`, 'Quote sent and accepted (simulated). Your order is now confirmed.')}>Mark quoted &amp; paid</button>
                        )}
                        {o.status !== 'dispatched' && (
                          <button className="btn btn-ghost btn-xs" disabled={o.status === 'awaiting-quote'} title={o.status === 'awaiting-quote' ? 'Settle the quote first' : undefined}
                            onClick={() => setStatus(o, 'dispatched', `${o.ref} dispatched`, 'Your parts are on the way (simulated).')}>Mark dispatched</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="wf-empty-inline">No parts orders yet.</div>}
      </Card>
    </div>
  );
}
