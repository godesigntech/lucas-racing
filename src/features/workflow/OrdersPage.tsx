/* "My orders & proofs": the visitor's helmet jobs, kart orders and part orders (account + guest records from this browser). */
import { Link, useParams } from 'react-router-dom';
import type { HelmetJob, KartOrder, PartOrder } from '@/core/types';
import { fmtDate, money } from '@/core/util';
import { isPaidJob, latestRevision } from '@/domain/helmet';
import { currentProof } from '@/domain/kart';
import { useAuth, useMine } from '@/store';
import { Empty, Icon, Note, PageHead } from '@/ui';
import { JOB_STATUS, KART_STATUS, PART_STATUS, type D } from './data';
import { Boundary, Card, StatusBadge } from './shared';
import { JobDetail } from './JobDetail';
import { KartOrderDetail } from './KartOrderDetail';
import { PartOrderDetail } from './PartOrderDetail';
import './workflow.css';

export default function OrdersPage() {
  const { kind, id } = useParams();
  const { user, isAdmin } = useAuth();
  const jobs = useMine<D<HelmetJob>>('jobs');
  const karts = useMine<D<KartOrder>>('kartOrders');
  const parts = useMine<D<PartOrder>>('partOrders');
  const loading = jobs.loading || karts.loading || parts.loading;

  if (kind && id) {
    const rec = kind === 'helmet' ? jobs.items.find((x) => x.id === id) : kind === 'kart' ? karts.items.find((x) => x.id === id) : kind === 'part' ? parts.items.find((x) => x.id === id) : null;
    return (
      <div className="wrap page wf-page">
        {rec ? (<Boundary label="This order">{
          kind === 'helmet' ? <JobDetail job={rec as HelmetJob} allMine={jobs.items} />
            : kind === 'kart' ? <KartOrderDetail order={rec as KartOrder} />
              : <PartOrderDetail order={rec as PartOrder} />
        }</Boundary>) : loading ? <div className="muted">Loading order…</div> : (
          <Empty title="Order not found" action={<Link className="btn btn-dark btn-sm" to="/orders">Back to my orders</Link>}>
            This order isn&apos;t linked to {user ? 'your account' : 'this browser'}. {user ? '' : 'Sign in to see orders placed on your account.'}
            {isAdmin ? ' Workshop staff can open every order from Workshop admin.' : ''}
          </Empty>
        )}
      </div>
    );
  }

  const total = jobs.items.length + karts.items.length + parts.items.length;
  const actionNeeded = [
    ...jobs.items.filter((j) => j.status === 'quoted' || j.status === 'awaiting-payment' || j.status === 'change-authorised' || j.invoices.some((i) => i.status === 'unpaid')),
    ...karts.items.filter((o) => currentProof(o)?.status === 'pending'),
  ].length;

  return (
    <div className="wrap page wf-page">
      <PageHead eyebrow="Your account" title="My orders & proofs">
        Track helmet quotes and approvals, approve sticker proofs, pay invoices and reorder replacement panels.
      </PageHead>
      <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
        {!user && <Note tone="info" title="Signed out.">Guest orders placed in this browser are shown. <Link to="/account">Sign in</Link> for your full account history and easy sticker reorders.</Note>}
        {isAdmin && <Note tone="info" title="Workshop role.">This page shows only your own orders. Use <Link to="/admin">Workshop admin</Link> to manage every customer&apos;s orders.</Note>}
        {actionNeeded > 0 && <Note tone="warn" title="Action needed.">{actionNeeded} item{actionNeeded === 1 ? ' is' : 's are'} waiting for your approval, proof decision or payment.</Note>}

        {loading && !total ? <div className="muted">Loading…</div> : !total ? (
          <Empty title="No orders yet" action={<div className="row" style={{ justifyContent: 'center' }}><Link className="btn btn-primary btn-sm" to="/helmet-builder">Design a helmet</Link><Link className="btn btn-ghost btn-sm" to="/stickers">Sticker kits</Link></div>}>
            Orders and quote requests you make {user ? 'on your account' : 'in this browser'} appear here.
          </Empty>
        ) : (
          <>
            <Card title={`Helmets (${jobs.items.length})`} icon="helmet">
              {jobs.items.length ? (
                <div className="table-wrap">
                  <table className="table wf-table">
                    <thead><tr><th>Ref</th><th>Type</th><th>Status</th><th>Revision</th><th className="num">Value</th><th>Updated</th><th><span className="sr-only">Open</span></th></tr></thead>
                    <tbody>
                      {jobs.items.map((j) => {
                        const v = j.quote?.total ?? j.invoices.filter((i) => i.kind === 'main').reduce((a, i) => a + i.amount, 0);
                        return (
                          <tr key={j.id}>
                            <td><Link to={`/orders/helmet/${j.id}`}><strong>{j.ref}</strong></Link></td>
                            <td>{j.kind}</td>
                            <td><StatusBadge {...JOB_STATUS[j.status]} /></td>
                            <td>{j.masterRevision ? <><Icon name="lock" size={12} /> R{j.masterRevision}</> : `R${latestRevision(j).no}`}</td>
                            <td className="num">{v ? money(v) : <span className="muted">Quote pending</span>}{isPaidJob(j) && <span className="tiny muted"> · paid</span>}</td>
                            <td>{fmtDate(j.updatedAt)}</td>
                            <td><Link className="btn btn-ghost btn-xs" to={`/orders/helmet/${j.id}`}>Open<Icon name="arrow" size={13} /></Link></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : <div className="wf-empty-inline">No helmet orders or quotes.</div>}
            </Card>

            <Card title={`Sticker kits (${karts.items.length})`} icon="kart">
              {karts.items.length ? (
                <div className="table-wrap">
                  <table className="table wf-table">
                    <thead><tr><th>Ref</th><th>Status</th><th>Proof</th><th>Items</th><th className="num">Total</th><th>Updated</th><th><span className="sr-only">Open</span></th></tr></thead>
                    <tbody>
                      {karts.items.map((o) => {
                        const p = currentProof(o);
                        return (
                          <tr key={o.id}>
                            <td><Link to={`/orders/kart/${o.id}`}><strong>{o.ref}</strong></Link>{o.reorderOf && <div className="tiny muted">Reorder of {o.reorderOf.ref}</div>}</td>
                            <td><StatusBadge {...KART_STATUS[o.status]} /></td>
                            <td>{p ? <>#{p.no} {p.status === 'pending' ? <span className="badge warn">Approve</span> : <span className="tiny muted">{p.status}</span>}</> : <span className="muted">—</span>}</td>
                            <td className="wrap">{o.items.map((i) => i.label).join(', ')}</td>
                            <td className="num">{money(o.total)}</td>
                            <td>{fmtDate(o.updatedAt)}</td>
                            <td><Link className="btn btn-ghost btn-xs" to={`/orders/kart/${o.id}`}>Open<Icon name="arrow" size={13} /></Link></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : <div className="wf-empty-inline">No sticker orders.</div>}
            </Card>

            <Card title={`Kart parts (${parts.items.length})`} icon="wrench">
              {parts.items.length ? (
                <div className="table-wrap">
                  <table className="table wf-table">
                    <thead><tr><th>Ref</th><th>Status</th><th>Lines</th><th className="num">Total</th><th>Updated</th><th><span className="sr-only">Open</span></th></tr></thead>
                    <tbody>
                      {parts.items.map((o) => (
                        <tr key={o.id}>
                          <td><Link to={`/orders/part/${o.id}`}><strong>{o.ref}</strong></Link></td>
                          <td><StatusBadge {...PART_STATUS[o.status]} /></td>
                          <td className="wrap">{o.lines.map((l) => `${l.qty} × ${l.name}`).join(', ')}</td>
                          <td className="num">{money(o.total)}</td>
                          <td>{fmtDate(o.updatedAt)}</td>
                          <td><Link className="btn btn-ghost btn-xs" to={`/orders/part/${o.id}`}>Open<Icon name="arrow" size={13} /></Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className="wf-empty-inline">No parts orders.</div>}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
