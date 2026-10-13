/* Customer view of a kart sticker order: payment-first proofing, Sent to Print cutoff, reorders. */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { KartOrder, PanelId } from '@/core/types';
import { fmtDate, money, nowISO, uid } from '@/core/util';
import { approvedProofOf, currentProof, decideProof, priceKart, proofEditingOpen, reorderEligibility } from '@/domain/kart';
import { bodyworkById, PANELS } from '@/data/kart';
import { renderKitSheet, preloadKartImages } from '@/core/kartRender';
import { simulateEmail, toast, useAuth, useBasket, useSettings } from '@/store';
import { Icon, Note, PriceLines, Seg, SimBadge } from '@/ui';
import { KART_STATUS, WORKSHOP_INBOX, attempt, kartSteps, saveKartOrder, stamp } from './data';
import { Card, History, InvoiceTable, NotificationList, ProofHistory, ProofStatus, StatusBadge, Stepper } from './shared';

export function KartOrderDetail({ order }: { order: KartOrder }) {
  const { user } = useAuth();
  const cur = currentProof(order);
  const [comment, setComment] = useState('');
  const st = KART_STATUS[order.status];
  const editing = proofEditingOpen(order);
  const bw = bodyworkById(order.bodyworkId);
  const settings = useSettings();
  const optLabel = (id: string) => settings.kart.options.find((o) => o.id === id)?.label || id;

  const decide = (approve: boolean) => attempt(async () => {
    if (!cur) return;
    if (!approve && !comment.trim()) throw new Error('Describe the changes you need so the workshop can update the proof.');
    const next = decideProof(order, cur.no, approve, comment.trim());
    await saveKartOrder(next);
    await simulateEmail(WORKSHOP_INBOX, `${order.ref}: proof ${cur.no} ${approve ? 'approved' : 'changes requested'}`, comment.trim() || (approve ? 'Approved.' : ''));
    setComment('');
  }, approve ? `Proof ${cur?.no} approved. The workshop can now send it to print.` : 'Change request sent to the workshop.');

  const payInvoice = (id: string) => attempt(async () => {
    const next = stamp({ ...order, invoices: order.invoices.map((i) => (i.id === id ? { ...i, status: 'paid' as const, paidAt: nowISO() } : i)) }, 'Invoice paid (simulated).');
    await saveKartOrder(next);
  }, 'Invoice paid (simulated).');

  return (
    <div className="stack" style={{ '--gap': '18px' } as React.CSSProperties}>
      <div className="wf-head">
        <div>
          <Link to="/orders" className="wf-back"><Icon name="back" size={14} />All orders</Link>
          <div className="eyebrow lime">Kart sticker kit{order.reorderOf ? ' · reorder' : ''}</div>
          <h1 className="ref">{order.ref}</h1>
          <div className="wf-meta">
            <span>Paid {fmtDate(order.createdAt)}</span><span>{bw.name}</span><span>{order.material === 'holographic' ? 'Holographic' : 'Standard'} material</span>
            {order.reorderOf && <span>Reorder of {order.reorderOf.ref} (proof {order.reorderOf.proofNo})</span>}
          </div>
        </div>
        <div className="row"><StatusBadge {...st} />{order.guest && <span className="badge sim">Guest order</span>}</div>
      </div>
      <Stepper label="Sticker order progress" {...kartSteps(order)} />

      <div className="wf-layout">
        <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          <Card title={cur ? `Current proof · ${cur.no}` : 'Proof'} icon="image" actions={cur ? <ProofStatus p={cur} /> : undefined}>
            {!cur ? (
              <Note tone="info">
                {order.status === 'paid' ? 'Payment received. Your artwork is queued for a manual check by the workshop.' : 'The workshop is checking your artwork and preparing a clean digital proof.'}
                {' '}You&apos;ll be notified when a proof is ready to approve.
              </Note>
            ) : (
              <div className="stack">
                <img className="wf-proof" src={cur.image} alt={`Proof ${cur.no} for ${order.ref}`} />
                <div className="tiny muted">Issued {fmtDate(cur.createdAt)}{cur.note ? ` · ${cur.note}` : ''}</div>
                {cur.status === 'pending' && editing && (
                  <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
                    <label className="field">
                      <span className="label">Comment (required to request changes)</span>
                      <textarea className="textarea" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="e.g. Move the number further forward on the left pod." />
                    </label>
                    <div className="row">
                      <button className="btn btn-primary" onClick={() => decide(true)}><Icon name="check" />Approve proof</button>
                      <button className="btn btn-ghost" onClick={() => decide(false)}><Icon name="pencil" />Request changes</button>
                    </div>
                    <span className="tiny muted">Nothing is printed until you explicitly approve the current proof.</span>
                  </div>
                )}
                {cur.status === 'changes-requested' && <Note tone="info">Changes requested. The workshop will send an updated proof.</Note>}
                {cur.status === 'approved' && editing && <Note tone="ok">Approved. The workshop will send it to print.</Note>}
              </div>
            )}
          </Card>

          {!editing && (
            <Card title="Sent to Print" icon="print">
              <div className="wf-lock" style={{ marginBottom: 12 }}>
                <Icon name="lock" /><span className="badge">Proof editing closed</span><span>Cutoff {fmtDate(order.sentToPrintAt)}</span>
              </div>
              <p className="small">
                Your approved artwork went to print on {order.sentToPrintAt ? new Date(order.sentToPrintAt).toLocaleString('en-GB') : '—'}.
                Ordinary proof changes are no longer possible. If something needs changing now, contact the workshop: post-print changes
                are handled manually and may need an additional invoice or a replacement order.
              </p>
              {order.postPrintNotes.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div className="wf-section-title">Post-print notes</div>
                  <History items={order.postPrintNotes} />
                </div>
              )}
            </Card>
          )}

          <Card title="Proof history" icon="layers"><ProofHistory proofs={order.proofs} /></Card>

          <Reorder order={order} />
        </div>

        <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          <Card title="Order" icon="kart">
            <PriceLines lines={order.items.map((i) => ({ label: `${i.label}${i.qty > 1 ? ` × ${i.qty}` : ''}`, amount: i.price * i.qty }))} />
            <div className="divider" />
            <div className="small stack" style={{ '--gap': '4px' } as React.CSSProperties}>
              <span><span className="muted">Material:</span> {order.material === 'holographic' ? 'Holographic' : 'Standard'}</span>
              <span><span className="muted">Options:</span> {order.options.length ? order.options.map(optLabel).join(', ') : 'None'}</span>
              <span><span className="muted">Design service:</span> {order.designService ? 'Yes (paid upfront)' : 'No'}</span>
              <span><span className="muted">Total paid:</span> <strong>{money(order.total)}</strong></span>
            </div>
          </Card>
          <Card title="Invoices" icon="basket"><InvoiceTable invoices={order.invoices} onPay={payInvoice} /></Card>
          <Card title="Notifications" icon="mail" actions={<SimBadge>Simulated email</SimBadge>}>
            <NotificationList items={[...order.notifications].reverse()} />
          </Card>
          <Card title="Status history" icon="flag"><History items={order.history} /></Card>
          {!user && <Note tone="info">Signed out: guest orders placed in this browser are shown. Sign in to see your account history.</Note>}
        </div>
      </div>
    </div>
  );
}

/* ---------------- reorders ---------------- */
type Choice = 'kit' | 'panels';

function Reorder({ order }: { order: KartOrder }) {
  const { user } = useAuth();
  const settings = useSettings();
  const basket = useBasket();
  const nav = useNavigate();
  const elig = reorderEligibility(order, user);
  const [choice, setChoice] = useState<Choice>('panels');
  const [panels, setPanels] = useState<Record<PanelId, boolean>>({ leftPod: false, rightPod: false, nassau: false, frontBumper: false });
  const selected = PANELS.map((p) => p.id).filter((id) => panels[id]);
  const price = useMemo(() => priceKart({
    bodyworkId: order.bodyworkId, material: order.material, options: [], designService: false, panels: choice === 'kit' ? undefined : selected,
  }, settings), [order, settings, choice, selected.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const isGuest = !user || order.guest;
  if (isGuest) {
    return (
      <Card title="Reorder" icon="copy">
        <Note tone="warn" title="Easy reordering needs an account.">
          Guest orders can&apos;t be reordered online. {user ? 'This order was placed as a guest.' : 'Sign in or create an account for future orders to reorder replacement panels in a couple of clicks.'} You can still contact the workshop quoting {order.ref}.
        </Note>
      </Card>
    );
  }
  if (!elig.ok) {
    return (
      <Card title="Reorder" icon="copy">
        <p className="small muted">{elig.why}</p>
      </Card>
    );
  }
  const approved = approvedProofOf(order)!;
  const add = async () => {
    if (choice === 'panels' && !selected.length) { toast('Choose at least one panel.', 'warn'); return; }
    await preloadKartImages(order.design).catch(() => undefined);
    let thumb = approved.image;
    try { thumb = renderKitSheet(order.design, { width: 420, holographic: order.material === 'holographic' }).toDataURL('image/jpeg', 0.8); } catch { /* use proof */ }
    basket.add({
      type: 'kart', id: uid('bk_'), designId: order.designId, design: order.design, name: `Reorder ${order.ref}`, material: order.material,
      options: [], designService: false, items: price.items, lines: price.lines, price: price.total, qty: 1,
      reorderOf: { orderId: order.id, ref: order.ref, proofNo: approved.no }, approvedProofImage: approved.image, thumb,
    });
    toast('Reorder added to your basket.');
    nav('/basket');
  };
  return (
    <Card title="Reorder replacement stickers" icon="copy" actions={<span className="badge launch">Account customers</span>}>
      <p className="small" style={{ marginBottom: 12 }}>
        Reorders reuse your approved artwork from proof {approved.no}. Pick the complete kit, or just the panels you need: each panel can be ordered on its own.
      </p>
      <Seg label="Reorder type" value={choice} onChange={setChoice} options={[{ id: 'panels', label: 'Individual panels' }, { id: 'kit', label: 'Complete kit' }]} />
      {choice === 'panels' && (
        <div className="wf-check-grid" style={{ marginTop: 12 }} role="group" aria-label="Replacement panels">
          {PANELS.map((p) => (
            <label key={p.id} className="wf-check-card">
              <input type="checkbox" checked={panels[p.id]} onChange={(e) => setPanels({ ...panels, [p.id]: e.target.checked })} />
              <span>{p.name}{p.id === 'leftPod' || p.id === 'rightPod' ? ' alone' : ''}</span>
              <span className="p">{money(settings.kart.panelPrices[p.id])}</span>
            </label>
          ))}
        </div>
      )}
      <div style={{ marginTop: 14 }}>
        {choice === 'panels' && !selected.length ? <div className="wf-empty-inline">Select one or more panels.</div> : <PriceLines lines={price.lines} total={price.total} />}
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn btn-primary" onClick={add} disabled={choice === 'panels' && !selected.length}><Icon name="basket" />Add reorder to basket</button>
        <span className="tiny muted">Material: {order.material}. Paid at checkout; the approved artwork is carried over.</span>
      </div>
    </Card>
  );
}
