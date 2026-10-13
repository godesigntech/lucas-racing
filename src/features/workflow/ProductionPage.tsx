/* Production area: approved and paid work only. */
import { Link, useParams } from 'react-router-dom';
import type { HelmetJob, KartOrder } from '@/core/types';
import { fmtDate } from '@/core/util';
import { isPaidJob, masterOf } from '@/domain/helmet';
import { approvedProofOf } from '@/domain/kart';
import { modelById, modelLabel } from '@/data/helmets';
import { bodyworkById } from '@/data/kart';
import { useCollection } from '@/store';
import { Empty, Icon, Note, PageHead } from '@/ui';
import { JOB_STATUS, KART_STATUS, type D } from './data';
import { Boundary, Card, StatusBadge } from './shared';
import { ReturnToCustomer, StaffGate } from './StaffGate';
import { HelmetProduction } from './production/HelmetProduction';
import { KartProduction } from './production/KartProduction';
import './workflow.css';

const KART_READY = ['proof-approved', 'sent-to-print', 'dispatched'];
const helmetReady = (j: HelmetJob) => j.masterRevision !== null && isPaidJob(j);
const kartReady = (o: KartOrder) => KART_READY.includes(o.status) && !!approvedProofOf(o);

export default function ProductionPage() {
  return <StaffGate area="Production"><Production /></StaffGate>;
}

function Production() {
  const { kind, id } = useParams();
  const jobs = useCollection<D<HelmetJob>>('jobs');
  const karts = useCollection<D<KartOrder>>('kartOrders');
  const loading = jobs.loading || karts.loading;

  if (kind && id) {
    const job = kind === 'helmet' ? jobs.items.find((j) => j.id === id) : undefined;
    const order = kind === 'kart' ? karts.items.find((o) => o.id === id) : undefined;
    const blocked = (job && !helmetReady(job)) || (order && !kartReady(order));
    return (
      <div className="wrap page wf-page">
        {loading && !job && !order ? <div className="muted">Loading…</div>
          : blocked ? (
            <Empty title="Not released to production" action={<Link className="btn btn-dark btn-sm" to="/production">Production queue</Link>}>
              Only approved and paid work appears in production. {job ? 'This helmet has no paid, locked master yet.' : 'This sticker order has no approved proof yet.'}
            </Empty>
          )
            : job ? <Boundary label="Production sheet"><HelmetProduction key={job.id} job={job} /></Boundary>
              : order ? <Boundary label="Production sheet"><KartProduction key={order.id} order={order} /></Boundary>
                : <Empty title="Not found" action={<Link className="btn btn-dark btn-sm" to="/production">Production queue</Link>}>No production record with that id.</Empty>}
      </div>
    );
  }

  const helmets = jobs.items.filter(helmetReady);
  const stickers = karts.items.filter(kartReady);

  return (
    <div className="wrap page wf-page">
      <PageHead eyebrow="Staff · workshop floor" title="Production" actions={<><Link className="btn btn-ghost btn-sm" to="/admin"><Icon name="wrench" />Workshop admin</Link><ReturnToCustomer /></>}>
        Approved and paid work only: locked helmet masters and sticker orders with an approved proof.
      </PageHead>
      <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
        <Note tone="warn" title="Concept exports.">Views, layouts and panel images here are concept exports, not validated full-size manufacturing patterns.</Note>
        <Card title={`Helmets (${helmets.length})`} icon="helmet">
          {helmets.length ? (
            <div className="table-wrap">
              <table className="table wf-table">
                <thead><tr><th>Ref</th><th>Customer</th><th>Model / supply</th><th>Master</th><th>Status</th><th>Updated</th><th><span className="sr-only">Open</span></th></tr></thead>
                <tbody>
                  {helmets.map((j) => {
                    const m = masterOf(j);
                    const d = m?.design;
                    return (
                      <tr key={j.id}>
                        <td><Link to={`/production/helmet/${j.id}`}><strong>{j.ref}</strong></Link><div className="tiny muted">{j.kind}</div></td>
                        <td>{j.customer.name}</td>
                        <td className="wrap">{d ? modelLabel(modelById(d.modelId)) : '—'}<div className="tiny muted">{d?.supply.kind === 'own' ? 'Customer’s own helmet' : d ? `New · ${d.supply.size}` : ''}</div></td>
                        <td><span className="badge dark"><Icon name="lock" size={11} />R{j.masterRevision}</span></td>
                        <td><StatusBadge {...JOB_STATUS[j.status]} /></td>
                        <td>{fmtDate(j.updatedAt)}</td>
                        <td><Link className="btn btn-ghost btn-xs" to={`/production/helmet/${j.id}`}>Open<Icon name="arrow" size={13} /></Link></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : <div className="wf-empty-inline">No paid, locked helmet masters yet.</div>}
        </Card>
        <Card title={`Sticker kits (${stickers.length})`} icon="kart">
          {stickers.length ? (
            <div className="table-wrap">
              <table className="table wf-table">
                <thead><tr><th>Ref</th><th>Customer</th><th>Bodywork</th><th>Items</th><th>Material</th><th>Status</th><th><span className="sr-only">Open</span></th></tr></thead>
                <tbody>
                  {stickers.map((o) => (
                    <tr key={o.id}>
                      <td><Link to={`/production/kart/${o.id}`}><strong>{o.ref}</strong></Link>{o.reorderOf && <div className="tiny muted">Reorder of {o.reorderOf.ref}</div>}</td>
                      <td>{o.customer.name}</td>
                      <td className="wrap">{bodyworkById(o.bodyworkId).name}</td>
                      <td className="wrap">{o.items.map((i) => i.label).join(', ')}</td>
                      <td>{o.material === 'holographic' ? <span className="badge warn">Holographic · TBC</span> : 'Standard'}</td>
                      <td><StatusBadge {...KART_STATUS[o.status]} /></td>
                      <td><Link className="btn btn-ghost btn-xs" to={`/production/kart/${o.id}`}>Open<Icon name="arrow" size={13} /></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="wf-empty-inline">No approved sticker proofs yet.</div>}
        </Card>
      </div>
    </div>
  );
}
