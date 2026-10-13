/* Draft cleanup: removes only old, unreferenced saved designs. Orders and production history are never touched. */
import { useMemo, useState } from 'react';
import type { HelmetDesign, HelmetJob, KartDesign, KartOrder, ShareLink } from '@/core/types';
import { fmtDate } from '@/core/util';
import { planDraftCleanup } from '@/domain/cleanup';
import { removeDoc, toast, useCollection } from '@/store';
import { Icon, Modal, Note } from '@/ui';
import type { D } from '../data';
import { Card } from '../shared';

export function CleanupTab() {
  const helmets = useCollection<D<HelmetDesign>>('helmetDesigns');
  const karts = useCollection<D<KartDesign>>('kartDesigns');
  const jobs = useCollection<D<HelmetJob>>('jobs').items;
  const orders = useCollection<D<KartOrder>>('kartOrders').items;
  const shares = useCollection<D<ShareLink>>('shares').items;
  const [days, setDays] = useState(30);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const plan = useMemo(() => planDraftCleanup({
    helmetDesigns: helmets.items, kartDesigns: karts.items, jobs, kartOrders: orders, shares, olderThanDays: days,
  }), [helmets.items, karts.items, jobs, orders, shares, days]);
  const name = (id: string) => helmets.items.find((d) => d.id === id)?.name || karts.items.find((d) => d.id === id)?.name || id;
  const updated = (id: string) => (helmets.items.find((d) => d.id === id) || karts.items.find((d) => d.id === id))?.updatedAt;
  const removeCount = plan.removeHelmetDesigns.length + plan.removeKartDesigns.length;
  const kept = helmets.items.length + karts.items.length - removeCount - plan.protected.length;

  const run = async () => {
    setBusy(true);
    let n = 0;
    try {
      // Only saved draft designs are removed. jobs / kartOrders / partOrders are never passed to removeDoc.
      for (const id of plan.removeHelmetDesigns) { await removeDoc('helmetDesigns', id); n++; }
      for (const id of plan.removeKartDesigns) { await removeDoc('kartDesigns', id); n++; }
      toast(`Removed ${n} draft design${n === 1 ? '' : 's'}.`);
    } catch (e) {
      toast(`Stopped after ${n}: ${(e as Error).message}`, 'err');
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  };

  return (
    <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
      <Note tone="info" title="Safe by design.">
        Only unreferenced saved designs are removed. Paid orders, quotes, revisions, proofs and production history are never touched, and any design
        referenced by a job, order or share link is protected.
      </Note>
      <Card title="Plan a cleanup" icon="trash">
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <label className="field" style={{ width: 200 }}>
            <span className="label">Drafts older than (days)</span>
            <input className="input" type="number" min={0} value={days} onChange={(e) => setDays(Math.max(0, Number(e.target.value) || 0))} />
          </label>
          <span className="tiny muted" style={{ paddingBottom: 12 }}>Use 0 in the demo to include drafts saved today.</span>
        </div>
        <div className="wf-stats" style={{ marginTop: 14 }}>
          <div className="wf-stat hot"><span className="v">{removeCount}</span><span className="l">Will be removed</span></div>
          <div className="wf-stat"><span className="v">{plan.protected.length}</span><span className="l">Protected</span></div>
          <div className="wf-stat"><span className="v">{Math.max(0, kept)}</span><span className="l">Too recent · kept</span></div>
          <div className="wf-stat"><span className="v">{jobs.length + orders.length}</span><span className="l">Orders · never touched</span></div>
        </div>
      </Card>
      <div className="wf-layout">
        <Card title={`To remove (${removeCount})`} icon="trash">
          {removeCount ? (
            <div className="table-wrap">
              <table className="table wf-table">
                <thead><tr><th>Design</th><th>Type</th><th>Last updated</th></tr></thead>
                <tbody>
                  {[...plan.removeHelmetDesigns.map((id) => ({ id, t: 'Helmet' })), ...plan.removeKartDesigns.map((id) => ({ id, t: 'Kart kit' }))].map((r) => (
                    <tr key={r.id}><td className="wrap">{name(r.id)}</td><td>{r.t}</td><td>{fmtDate(updated(r.id))}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="wf-empty-inline">Nothing to remove with this setting.</div>}
          <button className="btn btn-danger" style={{ marginTop: 12 }} disabled={!removeCount || busy} onClick={() => setConfirm(true)}><Icon name="trash" />Remove {removeCount} draft{removeCount === 1 ? '' : 's'}…</button>
        </Card>
        <Card title={`Protected (${plan.protected.length})`} icon="lock">
          {plan.protected.length ? (
            <div className="table-wrap">
              <table className="table wf-table">
                <thead><tr><th>Design</th><th>Reason</th></tr></thead>
                <tbody>{plan.protected.map((p) => <tr key={p.id}><td className="wrap">{name(p.id)}</td><td className="wrap">{p.reason}</td></tr>)}</tbody>
              </table>
            </div>
          ) : <div className="wf-empty-inline">No referenced designs.</div>}
        </Card>
      </div>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Remove draft designs?"
        footer={<><button className="btn btn-ghost btn-sm" onClick={() => setConfirm(false)}>Cancel</button><button className="btn btn-danger btn-sm" disabled={busy} onClick={run}>{busy ? 'Removing…' : `Remove ${removeCount}`}</button></>}>
        <p className="small">This permanently deletes {removeCount} unreferenced saved design{removeCount === 1 ? '' : 's'} older than {days} day{days === 1 ? '' : 's'}. Orders and production history are not affected.</p>
      </Modal>
    </div>
  );
}
