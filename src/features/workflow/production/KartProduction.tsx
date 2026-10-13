/* Kart sticker production sheet: approved proof, per-panel concept views and specs. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { KartOrder, PanelId } from '@/core/types';
import { fmtDate, money } from '@/core/util';
import { approvedProofOf, proofEditingOpen } from '@/domain/kart';
import { bodyworkById, PANELS } from '@/data/kart';
import { preloadKartImages, renderPanelCanvas } from '@/core/kartRender';
import { useSettings } from '@/store';
import { Icon, Note, downloadDataUrl } from '@/ui';
import { KART_STATUS, downloadJson, slug } from '../data';
import { CONCEPT_EXPORT, Card, PRODUCTION_CHECKLIST, StatusBadge } from '../shared';

export function KartProduction({ order }: { order: KartOrder }) {
  const settings = useSettings();
  const bw = bodyworkById(order.bodyworkId);
  const proof = approvedProofOf(order);
  const holo = order.material === 'holographic';
  const kit = order.items.some((i) => i.kind === 'kit');
  const panelIds: PanelId[] = kit ? PANELS.map((p) => p.id) : PANELS.map((p) => p.id).filter((id) => order.items.some((i) => i.kind === id));
  const [views, setViews] = useState<Partial<Record<PanelId, string>>>({});
  const prefix = slug(order.ref);
  const optLabel = (id: string) => settings.kart.options.find((o) => o.id === id)?.label || id;

  useEffect(() => {
    let alive = true;
    preloadKartImages(order.design).catch(() => undefined).then(() => {
      if (!alive) return;
      const out: Partial<Record<PanelId, string>> = {};
      for (const id of panelIds) {
        try { out[id] = renderPanelCanvas(order.design, id, 900, { cutLine: true, holographic: holo }).toDataURL('image/png'); } catch { /* skip */ }
      }
      setViews(out);
    });
    return () => { alive = false; };
  }, [order.design, holo, panelIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const spec = () => ({
    label: CONCEPT_EXPORT,
    checklist: PRODUCTION_CHECKLIST,
    order: { ref: order.ref, customer: order.customer, status: order.status, sentToPrintAt: order.sentToPrintAt },
    bodywork: { id: bw.id, name: bw.name, accurate: false },
    material: order.material, holographicUnderprint: holo ? 'TBC with print partner' : null,
    options: order.options.map(optLabel), items: order.items, reorderOf: order.reorderOf,
    approvedProof: proof ? { no: proof.no, approvedAt: proof.decidedAt } : null,
    panels: panelIds.map((id) => ({ id, name: PANELS.find((p) => p.id === id)!.name, outlineBox: { w: bw.outlines[id].w, h: bw.outlines[id].h, units: 'illustrative, not to scale' } })),
    exportedAt: new Date().toISOString(),
  });

  return (
    <div className="stack" style={{ '--gap': '18px' } as React.CSSProperties}>
      <div className="wf-head">
        <div>
          <Link to="/production" className="wf-back"><Icon name="back" size={14} />Production queue</Link>
          <div className="eyebrow lime">Sticker production sheet{order.reorderOf ? ' · reorder' : ''}</div>
          <h1 className="ref">{order.ref}</h1>
          <div className="wf-meta"><span>{order.customer.name}</span><a href={`mailto:${order.customer.email}`}>{order.customer.email}</a><span>Paid {fmtDate(order.createdAt)}</span></div>
        </div>
        <div className="row">
          <StatusBadge {...KART_STATUS[order.status]} />
          {proof && <span className="badge dark"><Icon name="lock" size={11} />Approved proof {proof.no}</span>}
        </div>
      </div>
      {order.status === 'proof-approved' && <Note tone="info" title="Not yet sent to print.">Proof {proof?.no} is approved. Use Workshop admin → Kart orders to record Sent to Print (this closes proof editing).</Note>}

      <div className="wf-layout">
        <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          <Card title={`Panels (${panelIds.length})`} icon="layers" actions={<span className="tiny muted">Cut line shown · ~900px</span>}>
            <div className="wf-panels">
              {panelIds.map((id) => {
                const p = PANELS.find((x) => x.id === id)!;
                const o = bw.outlines[id];
                const src = views[id];
                return (
                  <div className="wf-panel" key={id}>
                    <div className="row between"><strong>{p.name}</strong>{!kit && <span className="badge">Individual</span>}</div>
                    {src ? <img src={src} alt={`${p.name} concept view`} /> : <div className="wf-empty-inline">Rendering…</div>}
                    <div className="tiny muted">Outline box {o.w} × {o.h} units · illustrative, not to scale</div>
                    <button className="btn btn-ghost btn-xs" disabled={!src} onClick={() => src && downloadDataUrl(src, `${prefix}-${id}.png`)}><Icon name="download" size={14} />PNG</button>
                  </div>
                );
              })}
            </div>
          </Card>
          {proof && (
            <Card title={`Approved proof ${proof.no}`} icon="check" actions={<span className="tiny muted">Approved {fmtDate(proof.decidedAt)}</span>}>
              <img className="wf-proof" src={proof.image} alt={`Approved proof ${proof.no}`} />
              {proof.note && <p className="small" style={{ marginTop: 8 }}><span className="muted">Note:</span> {proof.note}</p>}
            </Card>
          )}
        </div>

        <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          <Card title="Downloads" icon="download">
            <Note tone="warn" title="Concept export —">not a validated full-size manufacturing pattern.</Note>
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn btn-dark btn-sm" disabled={!Object.keys(views).length} onClick={() => panelIds.forEach((id, i) => views[id] && setTimeout(() => downloadDataUrl(views[id]!, `${prefix}-${id}.png`), i * 250))}>
                <Icon name="download" />All panels (PNG)
              </button>
              {proof && <button className="btn btn-ghost btn-sm" onClick={() => downloadDataUrl(proof.image, `${prefix}-proof-${proof.no}.${proof.image.startsWith('data:image/jpeg') ? 'jpg' : 'png'}`)}><Icon name="download" />Approved proof</button>}
              <button className="btn btn-ghost btn-sm" onClick={() => downloadJson(spec(), `${prefix}-spec.json`)}><Icon name="download" />JSON spec</button>
            </div>
            <Note tone="sim" className="" title="Before production use">confirm dimensions, bleed, cut contours, colour handling, holographic underprint and required export formats.</Note>
          </Card>

          <Card title="Order specification" icon="kart">
            <dl className="wf-kv">
              <dt>Order</dt><dd>{order.ref} · {money(order.total)}</dd>
              <dt>Bodywork</dt><dd>{bw.name} <span className="badge proposed">Illustrative outline</span></dd>
              <dt>Material</dt><dd>{holo ? <>Holographic <span className="badge warn">Underprint TBC</span></> : 'Standard printed vinyl'}</dd>
              <dt>Options</dt><dd>{order.options.length ? order.options.map(optLabel).join(', ') : 'None'}</dd>
              <dt>Items</dt><dd>{order.items.map((i) => `${i.label}${i.qty > 1 ? ` × ${i.qty}` : ''}`).join(', ')}</dd>
              {order.reorderOf && <><dt>Reorder of</dt><dd>{order.reorderOf.ref} · approved proof {order.reorderOf.proofNo}</dd></>}
              <dt>Approved proof</dt><dd>{proof ? `Proof ${proof.no}` : <span className="badge err">None</span>}</dd>
              <dt>Design service</dt><dd>{order.designService ? 'Yes' : 'No'}</dd>
            </dl>
          </Card>

          <Card title="Print state" icon="print">
            {proofEditingOpen(order) ? (
              <p className="small">Awaiting Sent to Print. Proof editing is still open.</p>
            ) : (
              <div className="wf-lock"><Icon name="lock" /><span className="badge">Sent to Print</span><span>Cutoff {order.sentToPrintAt ? new Date(order.sentToPrintAt).toLocaleString('en-GB') : '—'}</span></div>
            )}
            {order.postPrintNotes.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div className="wf-section-title">Post-print notes</div>
                {order.postPrintNotes.map((n, i) => <p className="small" key={i}><span className="muted">{fmtDate(n.at)}:</span> {n.text}</p>)}
              </div>
            )}
            <Link className="btn-link small" style={{ display: 'inline-block', marginTop: 10 }} to={`/admin?tab=kart-orders&filter=all&order=${order.id}`}>Open in admin</Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
