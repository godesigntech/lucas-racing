/* Kart orders & proofs: artwork check (after payment), clean digital proofs, Send to Print gate, post-print changes. */
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { KartOrder, KartOrderStatus } from '@/core/types';
import { fmtDate, money } from '@/core/util';
import {
  canSendToPrint, currentProof, issueProof, postPrintChange, proofEditingOpen, sendToPrint, startArtworkCheck,
} from '@/domain/kart';
import { bodyworkById } from '@/data/kart';
import { preloadKartImages, renderKitSheet } from '@/core/kartRender';
import { simulateEmail, useCollection, useSettings } from '@/store';
import { Icon, Note, SimBadge } from '@/ui';
import { KART_STATUS, attempt, kartSteps, saveKartOrder, stamp, type D } from '../data';
import { Card, History, InvoiceTable, MoneyInput, NotificationList, ProofHistory, ProofStatus, StatusBadge, Stepper } from '../shared';
import { SearchBox } from './common';

const FILTERS: { id: string; label: string; match: (s: KartOrderStatus) => boolean }[] = [
  { id: 'active', label: 'Active (not dispatched)', match: (s) => s !== 'dispatched' },
  { id: 'needs-proof', label: 'Awaiting proof', match: (s) => s === 'paid' || s === 'artwork-check' || s === 'changes-requested' },
  { id: 'proof-sent', label: 'Proof with customer', match: (s) => s === 'proof-sent' },
  { id: 'proof-approved', label: 'Ready to print', match: (s) => s === 'proof-approved' },
  { id: 'printed', label: 'Sent to print / dispatched', match: (s) => s === 'sent-to-print' || s === 'dispatched' },
  { id: 'all', label: 'All orders', match: () => true },
];

export function KartOrdersTab() {
  const { items: orders, loading } = useCollection<D<KartOrder>>('kartOrders');
  const [sp, setSp] = useSearchParams();
  const filter = FILTERS.find((f) => f.id === sp.get('filter')) || FILTERS[0];
  const [q, setQ] = useState('');
  const list = orders.filter((o) => filter.match(o.status) && (!q || `${o.ref} ${o.customer.name} ${o.customer.email}`.toLowerCase().includes(q.toLowerCase())));
  const selId = sp.get('order');
  const sel = orders.find((o) => o.id === selId) || null;
  const setParam = (k: string, v: string | null) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n, { replace: true }); };

  return (
    <div className="wf-split">
      <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
        <select className="select sm" value={filter.id} onChange={(e) => setParam('filter', e.target.value)} aria-label="Filter orders">
          {FILTERS.map((f) => <option key={f.id} value={f.id}>{f.label} ({orders.filter((o) => f.match(o.status)).length})</option>)}
        </select>
        <SearchBox value={q} onChange={setQ} placeholder="Search ref, customer" />
        <div className="wf-list wf-scroll" role="list">
          {loading && !orders.length && <div className="muted small">Loading…</div>}
          {!loading && !list.length && <div className="wf-empty-inline">No orders in this view.</div>}
          {list.map((o) => (
            <button key={o.id} role="listitem" className="wf-item" aria-current={o.id === selId} onClick={() => setParam('order', o.id)}>
              <span className="top"><span className="ref">{o.ref}</span><StatusBadge {...KART_STATUS[o.status]} /></span>
              <span className="sub">{o.customer.name} · {o.items.map((i) => i.label).join(', ')}</span>
              <span className="sub">{o.material}{o.reorderOf ? ` · reorder of ${o.reorderOf.ref}` : ''} · {fmtDate(o.updatedAt)}</span>
            </button>
          ))}
        </div>
      </div>
      <div>{sel ? <AdminKartOrder key={sel.id} order={sel} /> : <div className="empty"><div className="h4">Select an order</div><p className="small">Paid orders appear here for the manual artwork check and proofing.</p></div>}</div>
    </div>
  );
}

function AdminKartOrder({ order }: { order: KartOrder }) {
  const settings = useSettings();
  const cur = currentProof(order);
  const gate = canSendToPrint(order);
  const editing = proofEditingOpen(order);
  const holo = order.material === 'holographic';
  const [preview, setPreview] = useState<string | null>(null);
  const [proofNote, setProofNote] = useState('');
  const [ppText, setPpText] = useState('');
  const [ppExtra, setPpExtra] = useState(0);
  const title = `Proof — ${order.ref}`;

  useEffect(() => {
    let alive = true;
    preloadKartImages(order.design).catch(() => undefined).then(() => {
      if (!alive) return;
      try { setPreview(renderKitSheet(order.design, { title, holographic: holo, cutLine: true, width: 900 }).toDataURL('image/jpeg', 0.85)); } catch { setPreview(null); }
    });
    return () => { alive = false; };
  }, [order.design, holo, title]);

  const commit = (fn: () => KartOrder | Promise<KartOrder>, ok: string, email?: [string, string]) => attempt(async () => {
    const next = await fn();
    await saveKartOrder(next);
    if (email) await simulateEmail(order.customer.email, email[0], email[1]);
  }, ok);

  const issue = () => commit(async () => {
    await preloadKartImages(order.design).catch(() => undefined);
    // Clean digital proof (no watermark). JPEG keeps browser storage small; the sheet has a white background.
    const img = renderKitSheet(order.design, { title, holographic: holo, cutLine: true, width: 1400 }).toDataURL('image/jpeg', 0.92);
    return issueProof(order, img, proofNote.trim());
  }, 'Proof issued to the customer.', [`Proof ${order.proofs.length + 1} ready for approval (${order.ref})`, proofNote.trim() || 'Please review and approve your sticker proof.']).then((ok) => { if (ok) setProofNote(''); });

  const optLabel = (id: string) => settings.kart.options.find((o) => o.id === id)?.label || id;

  return (
    <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
      <div className="wf-head" style={{ marginBottom: 0 }}>
        <div>
          <div className="eyebrow lime">Kart sticker order{order.reorderOf ? ' · reorder' : ''}</div>
          <h2 className="ref">{order.ref}</h2>
          <div className="wf-meta">
            <span>{order.customer.name}</span><a href={`mailto:${order.customer.email}`}>{order.customer.email}</a>
            <span>{order.guest ? 'Guest' : 'Account'}</span><span>Paid {fmtDate(order.createdAt)}</span><span>{money(order.total)}</span>
          </div>
        </div>
        <StatusBadge {...KART_STATUS[order.status]} />
      </div>
      <Stepper label="Order progress" {...kartSteps(order)} />

      <div className="wf-layout">
        <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          <Card title="Artwork & proofing" icon="image">
            {order.status === 'paid' ? (
              <div className="stack">
                <Note tone="ok">Payment received. Start the manual artwork check before issuing a proof.</Note>
                <button className="btn btn-dark" onClick={() => commit(() => startArtworkCheck(order), 'Artwork check started.')}><Icon name="eye" />Start artwork check</button>
              </div>
            ) : editing ? (
              <div className="stack">
                <div className="wf-section-title">Proof {order.proofs.length + 1} preview (clean, unwatermarked)</div>
                {preview ? <img className="wf-proof" src={preview} alt="Proof preview generated from the order design" /> : <div className="wf-empty-inline">Rendering…</div>}
                {holo && <Note tone="warn">Holographic material: underprint handling is to be confirmed with the print partner.</Note>}
                <label className="field"><span className="label">Note to customer (optional)</span>
                  <textarea className="textarea" rows={2} value={proofNote} onChange={(e) => setProofNote(e.target.value)} placeholder="e.g. Number enlarged for readability; logo moved off the crease." />
                </label>
                <div className="row">
                  <button className="btn btn-primary" onClick={issue}><Icon name="mail" />Issue proof {order.proofs.length + 1}</button>
                  {cur?.status === 'pending' && <span className="tiny muted">Issuing a new proof supersedes pending proof {cur.no}.</span>}
                </div>
                <p className="tiny muted">Artwork edits are made in the sticker builder; the proof is generated from the order&apos;s paid design snapshot.</p>
              </div>
            ) : (
              <div className="wf-lock"><Icon name="lock" /><span className="badge">Proof editing closed</span><span>Sent to Print {fmtDate(order.sentToPrintAt)}</span></div>
            )}
          </Card>

          <Card title="Customer decision" icon="user" actions={cur ? <ProofStatus p={cur} /> : undefined}>
            {!cur ? <div className="wf-empty-inline">No proof issued yet.</div> : (
              <div className="stack" style={{ '--gap': '8px' } as React.CSSProperties}>
                <div className="small">Current proof <strong>{cur.no}</strong> · issued {fmtDate(cur.createdAt)}{cur.decidedAt ? ` · decided ${fmtDate(cur.decidedAt)}` : ''}</div>
                {cur.customerComment ? <blockquote className="wf-msg" style={{ margin: 0, maxWidth: '100%' }}><div className="who">Customer comment</div><p>{cur.customerComment}</p></blockquote>
                  : cur.status === 'pending' ? <span className="small muted">Waiting for the customer to approve or request changes.</span> : null}
                <Link className="btn-link small" to={`/orders/kart/${order.id}`}>Open the customer view</Link>
              </div>
            )}
          </Card>

          <Card title="Send to Print" icon="print">
            {editing ? (
              <div className="stack">
                <button className="btn btn-dark" disabled={!gate.ok} onClick={() => commit(() => sendToPrint(order), 'Sent to Print. Proof editing is now closed.',
                  [`Your stickers have been sent to print (${order.ref})`, 'Ordinary proof changes are now closed. Contact us if anything is urgent.'])}>
                  <Icon name="print" />Send to Print
                </button>
                {!gate.ok && <span className="small" role="note"><Icon name="info" size={13} /> {gate.why} Printing is blocked until the current proof is explicitly approved by the customer.</span>}
                {gate.ok && <span className="small muted">Records the cutoff time, notifies the customer and closes ordinary proof editing.</span>}
              </div>
            ) : (
              <div className="stack">
                <div className="wf-lock"><Icon name="lock" /><span className="badge">Sent to Print</span><span>Cutoff {order.sentToPrintAt ? new Date(order.sentToPrintAt).toLocaleString('en-GB') : '—'}</span></div>
                {order.status === 'sent-to-print' && (
                  <button className="btn btn-ghost btn-sm" onClick={() => commit(() => stamp({ ...order, status: 'dispatched' as const, notifications: [...order.notifications, { at: new Date().toISOString(), to: order.customer.email, subject: `Your stickers are on the way (${order.ref})` }] }, 'Dispatched.'),
                    'Marked dispatched.', [`Your stickers are on the way (${order.ref})`, 'Dispatched (simulated).'])}>Mark dispatched</button>
                )}
              </div>
            )}
          </Card>

          {!editing && (
            <Card title="Post-print change" icon="pencil">
              <p className="small muted" style={{ marginBottom: 10 }}>After the cutoff, changes are handled manually: log a note and optionally raise an additional invoice (or create a replacement order).</p>
              <label className="field"><span className="label">Change note</span><textarea className="textarea" rows={2} value={ppText} onChange={(e) => setPpText(e.target.value)} /></label>
              <div className="row" style={{ marginTop: 8 }}>
                <label className="field"><span className="label">Extra invoice (optional)</span><MoneyInput className="input sm" value={ppExtra} onChange={setPpExtra} label="Extra invoice amount" /></label>
                <button className="btn btn-dark btn-sm" style={{ alignSelf: 'flex-end' }} disabled={!ppText.trim()} onClick={async () => {
                  const ok = await commit(() => postPrintChange(order, ppText.trim(), ppExtra), 'Post-print change logged.',
                    [`${order.ref}: change after print`, `${ppText.trim()}${ppExtra > 0 ? ` Additional invoice: ${money(ppExtra)}.` : ''}`]);
                  if (ok) { setPpText(''); setPpExtra(0); }
                }}>Log change</button>
              </div>
              {order.postPrintNotes.length > 0 && <div style={{ marginTop: 12 }}><History items={order.postPrintNotes} /></div>}
            </Card>
          )}
        </div>

        <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          <Card title="Order details" icon="kart">
            <dl className="wf-kv">
              <dt>Bodywork</dt><dd>{bodyworkById(order.bodyworkId).name}</dd>
              <dt>Material</dt><dd>{holo ? <>Holographic <span className="badge proposed">Underprint TBC</span></> : 'Standard'}</dd>
              <dt>Items</dt><dd>{order.items.map((i) => `${i.label}${i.qty > 1 ? ` × ${i.qty}` : ''} (${money(i.price)})`).join(', ')}</dd>
              <dt>Options</dt><dd>{order.options.length ? order.options.map(optLabel).join(', ') : 'None'}</dd>
              <dt>Design service</dt><dd>{order.designService ? 'Yes · paid upfront' : 'No'}</dd>
              {order.reorderOf && <><dt>Reorder of</dt><dd>{order.reorderOf.ref} · approved proof {order.reorderOf.proofNo}</dd></>}
            </dl>
            {['proof-approved', 'sent-to-print', 'dispatched'].includes(order.status) && <Link className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} to={`/production/kart/${order.id}`}><Icon name="wrench" />Production sheet</Link>}
          </Card>
          <Card title="Proof history" icon="layers"><ProofHistory proofs={order.proofs} /></Card>
          <Card title="Invoices" icon="basket"><InvoiceTable invoices={order.invoices} /></Card>
          <Card title="Customer notifications" icon="mail" actions={<SimBadge>Simulated</SimBadge>}><NotificationList items={[...order.notifications].reverse()} /></Card>
          <Card title="History" icon="flag"><History items={order.history} /></Card>
        </div>
      </div>
    </div>
  );
}
